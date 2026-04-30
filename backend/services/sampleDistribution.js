/**
 * Sample Distribution Hook (DCR → sample_movements)
 *
 * Called after a DCR is saved. For each entry in the DCR's `samples` array,
 * try to record a `distribution` movement against the MR's stock, using FEFO
 * (first-expiring-first-out) lot selection.
 *
 * Failure modes (none of which throw — DCR persistence is already complete):
 *   - DCR has no samples → no-op
 *   - sample name doesn't match any product in the org → log warning, skip
 *   - MR has no stock for that product → record an `adjustment` movement
 *     with negative delta but DO NOT touch sample_stock (it would go negative);
 *     instead emit a NEGATIVE-stock-not-allowed log and skip. Manager can
 *     reconcile via /api/samples/adjust if real-world stock differs.
 *
 * The whole hook runs in its own transaction so partial success is OK across
 * different sample lines (each line has its own try/catch).
 */

const db = require('../config/db');
const { applyMovement } = require('./sampleMovements');

async function recordDcrSampleDistributions(dcrRow) {
  // Parse the JSONB samples array. May already be an array if pg returned it
  // as native JSONB, or a string if stringified upstream.
  let samples = dcrRow.samples;
  if (typeof samples === 'string') {
    try { samples = JSON.parse(samples); } catch { samples = null; }
  }
  if (!Array.isArray(samples) || samples.length === 0) return;

  const orgId = dcrRow.org_id;
  const userId = dcrRow.user_id;
  const dcrId = dcrRow.id;
  const doctorName = dcrRow.name;

  // Try to resolve the DCR's doctor_id by name within the org for the FK.
  let doctorId = null;
  try {
    const { rows } = await db.query(
      'SELECT id FROM doctor_profiles WHERE org_id = $1 AND name = $2 LIMIT 1',
      [orgId, doctorName]
    );
    if (rows.length > 0) doctorId = rows[0].id;
  } catch (err) {
    console.warn('[Samples] DCR hook: doctor lookup failed:', err.message);
  }

  for (const sample of samples) {
    const sampleName = (sample && sample.name) || null;
    const qty = parseInt(sample && sample.quantity, 10);
    if (!sampleName || !Number.isFinite(qty) || qty <= 0) continue;

    try {
      // Match sample name to a product within the org
      const { rows: prodRows } = await db.query(
        'SELECT id FROM products WHERE org_id = $1 AND name = $2 LIMIT 1',
        [orgId, sampleName]
      );
      if (prodRows.length === 0) {
        console.warn(`[Samples] DCR ${dcrId}: no product matches sample name "${sampleName}" — skipping`);
        continue;
      }
      const productId = prodRows[0].id;

      // FEFO lot selection: pick lots in order of soonest expiry first,
      // skipping zero-balance rows. Distribute quantity across lots until
      // the requested qty is satisfied or the MR runs out.
      const { rows: stockLots } = await db.query(
        `SELECT lot_number, quantity, expiry_date
         FROM sample_stock
         WHERE org_id = $1 AND user_id = $2 AND product_id = $3 AND quantity > 0
         ORDER BY expiry_date NULLS LAST, lot_number ASC`,
        [orgId, userId, productId]
      );

      if (stockLots.length === 0) {
        console.warn(`[Samples] DCR ${dcrId}: no stock for product_id=${productId} — recording 0-stock note only`);
        // Do NOT write a movement that would push stock negative; just log.
        continue;
      }

      let remaining = qty;
      for (const lot of stockLots) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, lot.quantity);
        if (take <= 0) continue;

        const client = await db.pool.connect();
        try {
          await client.query('BEGIN');
          await applyMovement(client, {
            org_id: orgId,
            user_id: userId,
            product_id: productId,
            lot_number: lot.lot_number,
            movement_type: 'distribution',
            quantity: take,
            ref_dcr_id: dcrId,
            ref_doctor_id: doctorId,
            doctor_name: doctorName,
            recorded_by: userId
          });
          await client.query('COMMIT');
          remaining -= take;
        } catch (err) {
          await client.query('ROLLBACK');
          console.warn(`[Samples] DCR ${dcrId} lot ${lot.lot_number}: movement failed: ${err.message}`);
          // Don't try further lots if it's an unexpected error
          break;
        } finally {
          client.release();
        }
      }

      if (remaining > 0) {
        console.warn(`[Samples] DCR ${dcrId}: short ${remaining} units of ${sampleName} — MR's stock insufficient. Manager can reconcile.`);
      }
    } catch (err) {
      console.warn(`[Samples] DCR ${dcrId} sample "${sampleName}": ${err.message}`);
    }
  }
}

module.exports = { recordDcrSampleDistributions };
