const db = require('../config/db');
const { getLLMService } = require('./llm');
const { buildAEDetectionMessages } = require('../prompts/aeDetection');

/**
 * Scans a DCR row for potential adverse events.
 * Runs asynchronously — never throws to caller.
 */
async function scanForAdverseEvents(dcrRow) {
  try {
    // Skip if no text content to analyze
    if (!dcrRow.call_summary && !dcrRow.doctor_feedback) {
      return null;
    }

    const messages = buildAEDetectionMessages(dcrRow);
    const llm = getLLMService();
    const result = await llm.chat(messages, { requireJson: true });

    if (!result || !result.ae_detected || !result.events || result.events.length === 0) {
      console.log(`[AE] No adverse events detected for DCR ${dcrRow.id}`);
      return null;
    }

    console.log(`[AE] ⚠️  Potential AE detected in DCR ${dcrRow.id}: ${result.events.length} event(s)`);

    // Insert each detected event — inherit org_id from the source DCR
    for (const event of result.events) {
      await db.query(
        `INSERT INTO adverse_events (org_id, dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          dcrRow.org_id,
          dcrRow.id,
          dcrRow.user_id,
          dcrRow.name,
          event.drug || dcrRow.product,
          event.symptoms || [],
          event.severity || 'moderate',
          event.patient_info ? JSON.stringify(event.patient_info) : null,
          event.timeline || null
        ]
      );
    }

    return result;
  } catch (err) {
    console.error(`[AE] Error scanning DCR ${dcrRow.id}:`, err.message);
    return null;
  }
}

module.exports = { scanForAdverseEvents };
