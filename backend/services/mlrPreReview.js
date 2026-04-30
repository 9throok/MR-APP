/**
 * MLR Pre-Review Service — Phase B
 *
 * Async hook fired when a content version is submitted for MLR review:
 *   1. Read the file's text from disk (reuses extractFileText from contentScanner).
 *   2. Pull any already-extracted claims from content_claims for added context.
 *   3. LLM scans for off-label / fair-balance / unsubstantiated-comparison /
 *      vague-qualifier / audience issues.
 *   4. Stores the structured findings into content_versions.ai_pre_review_notes.
 *
 * Fire-and-forget contract — same as aeDetection / contentScanner. Submit
 * succeeds regardless of LLM outcome.
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { getLLMService } = require('./llm');
const { buildMlrPreReviewMessages } = require('../prompts/mlrPreReview');

const MAX_TEXT_BYTES = 1 * 1024 * 1024;

// ─────────────────────────────────────────────────────────────────────────────
// File read helper. Duplicated (small) from contentScanner instead of being
// shared because pre-review also reads from disk and we want this service to
// be self-contained — a future refactor can extract a tiny `fileText.js` helper
// once a third caller appears.
// ─────────────────────────────────────────────────────────────────────────────
async function extractFileText(absPath) {
  if (!absPath || !fs.existsSync(absPath)) return null;
  const ext = path.extname(absPath).toLowerCase();
  try {
    if (ext === '.txt' || ext === '.md' || ext === '.csv') {
      const text = fs.readFileSync(absPath, 'utf-8');
      return text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text;
    }
    if (ext === '.pdf') {
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync(absPath);
      const parsed = await pdfParse(buf);
      const text = (parsed && parsed.text) || '';
      return text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text;
    }
    return null;
  } catch (err) {
    console.warn(`[MLRPreReview] file read/parse failed (${absPath}):`, err.message);
    return null;
  }
}

function resolveDiskPath(fileUrl) {
  if (!fileUrl) return null;
  return path.join(__dirname, '..', fileUrl.replace(/^\/+/, ''));
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry — call from routes/content.js submit endpoint with the version row.
// ─────────────────────────────────────────────────────────────────────────────
async function runMlrPreReview(versionRow) {
  const versionId = versionRow.id;
  const orgId = versionRow.org_id;
  if (!versionId || !orgId) {
    console.warn('[MLRPreReview] missing versionId or orgId — skipping');
    return null;
  }

  try {
    // Look up parent asset for product context
    const { rows: assetRows } = await db.query(
      `SELECT a.id, a.title, a.product_id, a.therapeutic_area, a.description,
              p.name AS product_name
       FROM content_assets a
       LEFT JOIN products p ON p.id = a.product_id AND p.org_id = a.org_id
       WHERE a.id = $1 AND a.org_id = $2`,
      [versionRow.asset_id, orgId]
    );
    if (assetRows.length === 0) {
      console.warn(`[MLRPreReview] asset ${versionRow.asset_id} not found for version ${versionId}`);
      return null;
    }
    const asset = assetRows[0];

    // Pull any extracted claims from contentScanner for added context
    const { rows: claimRows } = await db.query(
      `SELECT claim_text FROM content_claims
       WHERE org_id = $1 AND version_id = $2 ORDER BY id`,
      [orgId, versionId]
    );
    const claims = claimRows.map(r => r.claim_text);

    // Read the file's text content
    const diskPath = resolveDiskPath(versionRow.file_url);
    const fileText = await extractFileText(diskPath);
    const contentText = [
      asset.description || '',
      versionRow.change_notes || '',
      fileText || ''
    ].filter(Boolean).join('\n\n');

    if (!contentText.trim() && claims.length === 0) {
      console.log(`[MLRPreReview] no analyzable content for version ${versionId}, skipping`);
      return null;
    }

    // Run the LLM pass
    const llm = getLLMService();
    const messages = buildMlrPreReviewMessages({
      assetTitle: asset.title,
      productName: asset.product_name,
      therapeuticArea: asset.therapeutic_area,
      contentText,
      claims
    });

    let result;
    try {
      result = await llm.chat(messages, { requireJson: true });
    } catch (err) {
      console.warn(`[MLRPreReview] LLM error for version ${versionId}:`, err.message);
      return null;
    }

    // Light shape-validation: ensure findings is an array and clamp counts.
    const findings = Array.isArray(result && result.findings) ? result.findings.slice(0, 15) : [];
    const notes = {
      findings,
      summary: typeof result?.summary === 'string' ? result.summary.slice(0, 2000) : null,
      ready_for_human_review: result?.ready_for_human_review === true,
      generated_at: new Date().toISOString(),
      finding_count: findings.length
    };

    // Persist into the snapshot column on the version row
    await db.query(
      `UPDATE content_versions
       SET ai_pre_review_notes = $1
       WHERE id = $2 AND org_id = $3`,
      [JSON.stringify(notes), versionId, orgId]
    );
    console.log(`[MLRPreReview] version ${versionId}: stored ${findings.length} finding(s)`);
    return notes;
  } catch (err) {
    console.error(`[MLRPreReview] unexpected error for version ${versionId}:`, err.message);
    return null;
  }
}

module.exports = { runMlrPreReview };
