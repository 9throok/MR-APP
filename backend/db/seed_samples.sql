-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Sample Inventory + Movements
--
-- Creates the initial allocation history for each MR + the resulting cached
-- stock balances. Manager Vikram allocated stock at the start of the quarter;
-- some has already been distributed to doctors via prior DCR visits.
--
-- Run AFTER: migration_v12_samples.sql + seed_users.sql + dummy_data.sql (products)
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE sample_stock RESTART IDENTITY CASCADE;
TRUNCATE sample_movements RESTART IDENTITY CASCADE;

-- ── Allocation history (manager → MR) at start of quarter ──────────────────
-- Three lots per MR: one Derise lot, one Bevaas lot, one Rilast lot.

DO $$
DECLARE
  qtr_start TIMESTAMPTZ := NOW() - INTERVAL '60 days';
  derise_id INT := (SELECT id FROM products WHERE name = 'Derise 10mg' LIMIT 1);
  bevaas_id INT := (SELECT id FROM products WHERE name = 'Bevaas 5mg' LIMIT 1);
  rilast_id INT := (SELECT id FROM products WHERE name = 'Rilast Tablet' LIMIT 1);
BEGIN
  -- Allocations
  INSERT INTO sample_movements
    (user_id, product_id, lot_number, movement_type, quantity, recorded_by, notes, created_at)
  VALUES
    ('mr_rahul_001',  derise_id, 'DER-2026-Q1-A', 'allocation', 200, 'mgr_vikram_001', 'Q1 Derise allocation', qtr_start),
    ('mr_rahul_001',  bevaas_id, 'BEV-2026-Q1-A', 'allocation', 150, 'mgr_vikram_001', 'Q1 Bevaas allocation', qtr_start),
    ('mr_rahul_001',  rilast_id, 'RIL-2026-Q1-A', 'allocation', 100, 'mgr_vikram_001', 'Q1 Rilast allocation', qtr_start),
    ('mr_priya_002',  derise_id, 'DER-2026-Q1-B', 'allocation', 200, 'mgr_vikram_001', 'Q1 Derise allocation', qtr_start),
    ('mr_priya_002',  bevaas_id, 'BEV-2026-Q1-A', 'allocation', 150, 'mgr_vikram_001', 'Q1 Bevaas allocation', qtr_start),
    ('mr_robert_003', derise_id, 'DER-2026-Q1-C', 'allocation', 200, 'mgr_vikram_001', 'Q1 Derise allocation', qtr_start),
    ('mr_robert_003', bevaas_id, 'BEV-2026-Q1-A', 'allocation', 150, 'mgr_vikram_001', 'Q1 Bevaas allocation', qtr_start);

  -- A few prior distributions (so stock isn't pristine)
  INSERT INTO sample_movements
    (user_id, product_id, lot_number, movement_type, quantity, doctor_name, recorded_by, notes, created_at)
  VALUES
    ('mr_rahul_001',  derise_id, 'DER-2026-Q1-A', 'distribution', 5, 'Dr. Anil Mehta',    'mr_rahul_001', 'Routine visit', NOW() - INTERVAL '30 days'),
    ('mr_rahul_001',  derise_id, 'DER-2026-Q1-A', 'distribution', 3, 'Dr. Pradeep Joshi', 'mr_rahul_001', 'Trial pack',    NOW() - INTERVAL '20 days'),
    ('mr_priya_002',  bevaas_id, 'BEV-2026-Q1-A', 'distribution', 4, 'Dr. Rajesh Kapoor', 'mr_priya_002', 'Stock drop',    NOW() - INTERVAL '15 days'),
    ('mr_robert_003', derise_id, 'DER-2026-Q1-C', 'distribution', 6, 'Dr. Pooja Singh',   'mr_robert_003','First contact', NOW() - INTERVAL '10 days');

  -- Cached stock = allocated - distributed (one row per (user, product, lot))
  INSERT INTO sample_stock
    (user_id, product_id, lot_number, expiry_date, quantity)
  VALUES
    ('mr_rahul_001',  derise_id, 'DER-2026-Q1-A', '2027-12-31', 192),  -- 200 - 5 - 3
    ('mr_rahul_001',  bevaas_id, 'BEV-2026-Q1-A', '2027-09-30', 150),
    ('mr_rahul_001',  rilast_id, 'RIL-2026-Q1-A', '2027-06-30', 100),
    ('mr_priya_002',  derise_id, 'DER-2026-Q1-B', '2027-12-31', 200),
    ('mr_priya_002',  bevaas_id, 'BEV-2026-Q1-A', '2027-09-30', 146),  -- 150 - 4
    ('mr_robert_003', derise_id, 'DER-2026-Q1-C', '2027-12-31', 194),  -- 200 - 6
    ('mr_robert_003', bevaas_id, 'BEV-2026-Q1-A', '2027-09-30', 150);
END $$;
