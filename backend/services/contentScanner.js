/**
 * Content Scanner — Phase B Claim Substantiation
 *
 * Async hook fired after a content_versions row is inserted (post-upload):
 *   1. Read the file's text from disk (PDF / .txt / .md / .csv supported).
 *   2. Ask the LLM to extract a list of promotional claims.
 *   3. For each claim, call searchKnowledge() (existing RAG over drug_knowledge)
 *      to find a citation. If a high-confidence match is found, store it as
 *      `auto`. Otherwise mark as `needs_citation`.
 *   4. Insert one content_claims row per extracted claim.
 *
 * Fire-and-forget contract — same as aeDetection. Never throws to the caller;
 * any failure is logged. The upload succeeds regardless.
 */

const fs = require('fs');
const path = require('path');
const db = require('../config/db');
const { getLLMService } = require('./llm');
const { searchKnowledge } = require('./knowledgeSearch');
const { buildClaimExtractionMessages } = require('../prompts/claimExtraction');

// Match scores from knowledgeSearch's RRF range typically come in 0–0.05
// for hybrid + 0.0–1.0 for FTS-only. We treat anything that retrieved at all
// as a candidate citation; the reviewer can still mark it `dismissed` later.
const CITATION_RRF_THRESHOLD = 0.005;
const MAX_CLAIMS_PER_VERSION = 25;
const MAX_TEXT_BYTES = 1 * 1024 * 1024; // 1 MB cap on extracted text

// ─────────────────────────────────────────────────────────────────────────────
// Read file text from disk based on mime type / extension.
// Returns null when the file format isn't text-extractable (e.g. video/image).
// ─────────────────────────────────────────────────────────────────────────────
async function extractFileText(absPath) {
  if (!fs.existsSync(absPath)) {
    console.warn(`[ContentScanner] file not found on disk: ${absPath}`);
    return null;
  }
  const ext = path.extname(absPath).toLowerCase();

  try {
    if (ext === '.txt' || ext === '.md' || ext === '.csv') {
      const text = fs.readFileSync(absPath, 'utf-8');
      return text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text;
    }
    if (ext === '.pdf') {
      // pdf-parse exports the parser as a default function. Lazy-require so
      // routes that never trigger this hook don't pay the boot cost.
      const pdfParse = require('pdf-parse');
      const buf = fs.readFileSync(absPath);
      const parsed = await pdfParse(buf);
      const text = (parsed && parsed.text) || '';
      return text.length > MAX_TEXT_BYTES ? text.slice(0, MAX_TEXT_BYTES) : text;
    }
    // .pptx / .ppt / .mp4 / .mov / .webm / images: text extraction needs
    // additional libraries we haven't installed. Skip with a log line; a
    // marketing user can manually annotate the description, which the
    // recommender + recommendation surface still uses.
    console.log(`[ContentScanner] file type ${ext} not text-extractable, skipping claim extraction`);
    return null;
  } catch (err) {
    console.warn(`[ContentScanner] file read/parse failed (${absPath}):`, err.message);
    return null;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Resolve the absolute path on disk for a content_versions.file_url.
// file_url is stored as e.g. "/uploads/content/12/1730000000-foo.pdf"; we
// translate it to backend/uploads/content/12/1730000000-foo.pdf.
// ─────────────────────────────────────────────────────────────────────────────
function resolveDiskPath(fileUrl) {
  if (!fileUrl) return null;
  // Strip the leading slash so we can join under __dirname/..
  const rel = fileUrl.replace(/^\/+/, '');
  return path.join(__dirname, '..', rel);
}

// ─────────────────────────────────────────────────────────────────────────────
// Main entry — call from routes/content.js with the freshly-inserted version row.
// ─────────────────────────────────────────────────────────────────────────────
async function extractAndSubstantiateClaims(versionRow) {
  const versionId = versionRow.id;
  const orgId = versionRow.org_id;
  if (!versionId || !orgId) {
    console.warn('[ContentScanner] missing versionId or orgId — skipping');
    return null;
  }

  try {
    // Look up the parent asset for product context (used by knowledgeSearch
    // to scope citation lookup to the right product).
    const { rows: assetRows } = await db.query(
      `SELECT a.id, a.title, a.product_id, a.therapeutic_area, a.description,
              p.name AS product_name
       FROM content_assets a
       LEFT JOIN products p ON p.id = a.product_id AND p.org_id = a.org_id
       WHERE a.id = $1 AND a.org_id = $2`,
      [versionRow.asset_id, orgId]
    );
    if (assetRows.length === 0) {
      console.warn(`[ContentScanner] asset ${versionRow.asset_id} not found for version ${versionId}`);
      return null;
    }
    const asset = assetRows[0];

    // Read text from the uploaded file
    const diskPath = resolveDiskPath(versionRow.file_url);
    const fileText = await extractFileText(diskPath);

    // Build the text we hand the LLM. If we couldn't extract from the file,
    // fall back to the asset's title/description — at minimum we'll find
    // any claims hiding in the description.
    const contentText = [
      asset.description || '',
      versionRow.change_notes || '',
      fileText || ''
    ].filter(Boolean).join('\n\n');

    if (!contentText.trim()) {
      console.log(`[ContentScanner] no text content for version ${versionId}, skipping`);
      return null;
    }

    // 1) Extract claims via LLM
    const llm = getLLMService();
    const messages = buildClaimExtractionMessages({
      assetTitle: asset.title,
      productName: asset.product_name,
      therapeuticArea: asset.therapeutic_area,
      contentText
    });

    let claims = [];
    try {
      const result = await llm.chat(messages, { requireJson: true });
      if (result && Array.isArray(result.claims)) {
        claims = result.claims
          .filter(c => typeof c === 'string' && c.trim().length > 0)
          .map(c => c.trim().slice(0, 500))
          .slice(0, MAX_CLAIMS_PER_VERSION);
      }
    } catch (err) {
      console.warn(`[ContentScanner] LLM extraction failed for version ${versionId}:`, err.message);
      return null;
    }

    if (claims.length === 0) {
      console.log(`[ContentScanner] no claims extracted for version ${versionId}`);
      return [];
    }
    console.log(`[ContentScanner] version ${versionId}: extracted ${claims.length} claim(s)`);

    // 2) For each claim, find a citation via the existing RAG pipeline
    const inserted = [];
    for (const claim of claims) {
      let sourceDocId = null;
      let reviewerStatus = 'needs_citation';

      try {
        const matches = await searchKnowledge(claim, orgId, asset.product_id, { limit: 1 });
        if (matches && matches.length > 0) {
          const top = matches[0];
          // Hybrid search returns `rrf_score` as `rank`; FTS-only returns ts_rank.
          // Either is "we found a textual or semantic match" — treat as a
          // candidate citation. Reviewers tighten downstream.
          const score = parseFloat(top.rank || top.fts_score || top.sim_score || 0);
          if (score >= CITATION_RRF_THRESHOLD) {
            sourceDocId = top.knowledge_id || null;
            reviewerStatus = 'auto';
          }
        }
      } catch (err) {
        // searchKnowledge may fail when pgvector is missing or embeddings are
        // unavailable — log and treat as no-citation.
        console.warn(`[ContentScanner] knowledge lookup failed for claim "${claim.slice(0, 60)}…":`, err.message);
      }

      try {
        const { rows } = await db.query(
          `INSERT INTO content_claims
             (org_id, version_id, claim_text, source_doc_id, reviewer_status, extracted_by)
           VALUES ($1, $2, $3, $4, $5, 'ai')
           RETURNING id, reviewer_status`,
          [orgId, versionId, claim, sourceDocId, reviewerStatus]
        );
        inserted.push(rows[0]);
      } catch (err) {
        console.warn(`[ContentScanner] insert claim row failed:`, err.message);
      }
    }

    const cited = inserted.filter(r => r.reviewer_status === 'auto').length;
    console.log(`[ContentScanner] version ${versionId}: ${inserted.length} claims stored, ${cited} auto-cited`);
    return inserted;
  } catch (err) {
    console.error(`[ContentScanner] unexpected error scanning version ${versionId}:`, err.message);
    return null;
  }
}

module.exports = { extractAndSubstantiateClaims };
