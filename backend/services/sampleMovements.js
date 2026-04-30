/**
 * Sample Movements service
 *
 * Single source of truth for any change to sample stock. Every caller goes
 * through `applyMovement()` so the audit ledger and the cached stock balance
 * can never disagree.
 *
 * Sign rule (applied automatically based on movement_type):
 *   allocation  → +quantity   (manager → MR's stock)
 *   return      → -quantity   (MR returns leftover, debits MR's stock)
 *   distribution→ -quantity   (MR drops to doctor)
 *   expiry      → -quantity   (lot expired in MR's possession)
 *   adjustment  → caller passes adjustment_delta (signed) for full control
 *
 * The caller MUST own a transaction (pass `client`) — both the movement
 * insert and the stock UPSERT/UPDATE must commit or roll back atomically.
 */

const TYPE_SIGN = {
  allocation:   +1,
  return:       -1,
  distribution: -1,
  expiry:       -1,
  // adjustment is signed by caller via opts.adjustment_delta
};

/**
 * Apply a sample movement. Inserts the audit row + adjusts the cached stock.
 * Throws an error with .statusCode set when the operation cannot proceed
 * (e.g. insufficient stock, missing lot row for an outgoing movement).
 *
 * @param {Object} client       - pg client inside an open transaction
 * @param {Object} opts
 * @param {string} opts.org_id
 * @param {string} opts.user_id
 * @param {number} opts.product_id
 * @param {string} opts.lot_number
 * @param {string} opts.movement_type   one of TYPE_SIGN keys or 'adjustment'
 * @param {number} opts.quantity        ALWAYS positive (the audit ledger wants positives)
 * @param {number} [opts.adjustment_delta]  signed delta for movement_type='adjustment'
 * @param {string} [opts.expiry_date]   only on incoming (allocation) when creating new lot
 * @param {bigint} [opts.ref_dcr_id]
 * @param {number} [opts.ref_doctor_id]
 * @param {string} [opts.doctor_name]
 * @param {string} [opts.recorded_by]
 * @param {string} [opts.notes]
 * @returns {Promise<{movement: Object, stock: Object}>}
 */
async function applyMovement(client, opts) {
  const {
    org_id, user_id, product_id, lot_number, movement_type, quantity,
    adjustment_delta, expiry_date,
    ref_dcr_id, ref_doctor_id, doctor_name, recorded_by, notes
  } = opts;

  if (!org_id || !user_id || !product_id || !lot_number || !movement_type) {
    const err = new Error('org_id, user_id, product_id, lot_number, movement_type are required');
    err.statusCode = 400;
    throw err;
  }
  if (!Number.isFinite(quantity) || quantity <= 0) {
    const err = new Error('quantity must be a positive number');
    err.statusCode = 400;
    throw err;
  }

  // Determine the signed delta to apply to stock
  let delta;
  if (movement_type === 'adjustment') {
    if (!Number.isFinite(adjustment_delta) || adjustment_delta === 0) {
      const err = new Error('adjustment movements require a non-zero adjustment_delta');
      err.statusCode = 400;
      throw err;
    }
    delta = adjustment_delta;
  } else if (TYPE_SIGN[movement_type] !== undefined) {
    delta = TYPE_SIGN[movement_type] * quantity;
  } else {
    const err = new Error(`Invalid movement_type: ${movement_type}`);
    err.statusCode = 400;
    throw err;
  }

  // For outgoing movements, the lot must exist with sufficient stock.
  // For incoming movements (delta > 0), the row may not exist yet — UPSERT.
  if (delta < 0) {
    const { rows: existing } = await client.query(
      `SELECT id, quantity FROM sample_stock
       WHERE org_id = $1 AND user_id = $2 AND product_id = $3 AND lot_number = $4
       FOR UPDATE`,
      [org_id, user_id, product_id, lot_number]
    );
    if (existing.length === 0) {
      const err = new Error(`No stock for product ${product_id} lot ${lot_number} — cannot ${movement_type}`);
      err.statusCode = 409;
      throw err;
    }
    if (existing[0].quantity + delta < 0) {
      const err = new Error(`Insufficient stock: have ${existing[0].quantity}, requested ${Math.abs(delta)}`);
      err.statusCode = 409;
      throw err;
    }
  }

  // Insert the audit row first
  const movementResult = await client.query(
    `INSERT INTO sample_movements
       (org_id, user_id, product_id, lot_number, movement_type, quantity,
        ref_dcr_id, ref_doctor_id, doctor_name, recorded_by, notes)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
     RETURNING *`,
    [org_id, user_id, product_id, lot_number, movement_type, quantity,
     ref_dcr_id || null, ref_doctor_id || null, doctor_name || null,
     recorded_by || null, notes || null]
  );

  // Update or insert the cached stock row.
  // We can't use ON CONFLICT/UPSERT here because for outgoing movements
  // (delta < 0), the prospective INSERT row would carry a negative quantity
  // that violates the CHECK constraint, even though the conflict path would
  // route it to UPDATE — Postgres validates the proposed INSERT row first.
  // Branch explicitly: existing row → UPDATE; new lot → INSERT (delta must be > 0).
  const { rows: existingRows } = await client.query(
    `SELECT id FROM sample_stock
     WHERE org_id = $1 AND user_id = $2 AND product_id = $3 AND lot_number = $4`,
    [org_id, user_id, product_id, lot_number]
  );

  let stockResult;
  if (existingRows.length > 0) {
    stockResult = await client.query(
      `UPDATE sample_stock
       SET quantity     = quantity + $1,
           expiry_date  = COALESCE(expiry_date, $2),
           last_updated = NOW()
       WHERE org_id = $3 AND user_id = $4 AND product_id = $5 AND lot_number = $6
       RETURNING *`,
      [delta, expiry_date || null, org_id, user_id, product_id, lot_number]
    );
  } else {
    if (delta <= 0) {
      const err = new Error(`Cannot create new lot ${lot_number} via outgoing movement — incoming required first`);
      err.statusCode = 409;
      throw err;
    }
    stockResult = await client.query(
      `INSERT INTO sample_stock
         (org_id, user_id, product_id, lot_number, expiry_date, quantity, last_updated)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [org_id, user_id, product_id, lot_number, expiry_date || null, delta]
    );
  }

  return { movement: movementResult.rows[0], stock: stockResult.rows[0] };
}

module.exports = { applyMovement };
