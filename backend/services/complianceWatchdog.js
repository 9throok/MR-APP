/**
 * services/complianceWatchdog.js — Phase C.1
 *
 * Async scanner for compliance findings on DCR rows. Mirrors the
 * fire-and-forget pattern of aeDetection.js so DCR creation never blocks
 * on the LLM call.
 *
 * Writes one row per finding into compliance_findings, with the source
 * polymorphic pointer (source_table='dcr', source_row_id=<dcr.id>).
 */

const db = require('../config/db');
const { getLLMService } = require('./llm');
const { buildComplianceWatchdogMessages } = require('../prompts/complianceWatchdog');

async function scanDcrForCompliance(dcrRow) {
  try {
    if (!dcrRow.call_summary && !dcrRow.doctor_feedback && !dcrRow.gifts_or_samples) {
      return null;
    }

    // Try to fetch a label hint for this product. Optional — falls back to
    // generic label-aware analysis if no regulatory document exists yet.
    let productLabel = null;
    try {
      const { rows: labelRows } = await db.query(
        `SELECT v.file_url
         FROM regulatory_document_versions v
         JOIN regulatory_documents d ON d.id = v.document_id AND d.org_id = v.org_id
         JOIN products p ON p.id = d.product_id AND p.org_id = d.org_id
         WHERE d.org_id = $1
           AND d.doc_type = 'drug_label'
           AND v.status = 'active'
           AND p.name = $2
         ORDER BY v.version_number DESC
         LIMIT 1`,
        [dcrRow.org_id, dcrRow.product]
      );
      if (labelRows.length > 0) {
        productLabel = `(Approved label on file at ${labelRows[0].file_url})`;
      }
    } catch (_) {
      // Best-effort lookup; ignore failures.
    }

    const messages = buildComplianceWatchdogMessages(dcrRow, productLabel);
    const llm = getLLMService();
    const result = await llm.chat(messages, { requireJson: true });

    if (!result || !result.compliance_issues_detected || !Array.isArray(result.findings) || result.findings.length === 0) {
      console.log(`[WATCHDOG] No compliance issues for DCR ${dcrRow.id}`);
      return null;
    }

    console.log(`[WATCHDOG] ⚠️  ${result.findings.length} compliance finding(s) on DCR ${dcrRow.id}`);

    const VALID_TYPES = ['off_label_promotion', 'missing_fair_balance', 'gift_value_threshold', 'unsubstantiated_claim'];
    const VALID_SEVERITY = ['low', 'medium', 'high', 'critical'];

    for (const finding of result.findings) {
      const findingType = VALID_TYPES.includes(finding.finding_type) ? finding.finding_type : 'other';
      const severity    = VALID_SEVERITY.includes(finding.severity) ? finding.severity : 'medium';

      await db.query(
        `INSERT INTO compliance_findings
          (org_id, finding_type, severity, source_table, source_row_id,
           user_id, description, evidence_quote, recommendation, detected_by)
         VALUES ($1, $2, $3, 'dcr', $4, $5, $6, $7, $8, 'ai')`,
        [
          dcrRow.org_id,
          findingType,
          severity,
          String(dcrRow.id),
          dcrRow.user_id || null,
          finding.description || '(no description)',
          finding.evidence_quote || null,
          finding.recommendation || null,
        ]
      );
    }

    return result;
  } catch (err) {
    console.error(`[WATCHDOG] Error scanning DCR ${dcrRow.id}:`, err.message);
    return null;
  }
}

module.exports = { scanDcrForCompliance };
