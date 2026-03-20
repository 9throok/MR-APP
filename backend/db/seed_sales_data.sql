-- Seed Data: Sales Module (distributors, secondary_sales, mr_targets)
-- Run AFTER migration_v6_sales.sql
-- Does NOT truncate any existing tables.
--
-- Product IDs (from dummy_data.sql insert order):
--   1=Derise 10mg (₹8), 2=Derise 20mg (₹14), 3=Derise 50mg (₹25),
--   4=Rilast Tablet (₹15), 5=Rilast Capsule (₹18), 6=Rilast Syrup (₹85),
--   7=Bevaas 5mg (₹12), 8=Bevaas 10mg (₹20), 9=Bevaas 20mg (₹35)

-- ════════════════════════════════════════════════════════════════════════════
-- DISTRIBUTORS
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO distributors (name, territory, code) VALUES
  ('Pharma Distributors Mumbai North', 'Mumbai North', 'DIST-MN-001'),
  ('MedSupply North',                  'Mumbai North', 'DIST-MN-002'),
  ('HealthCare Distributors South',    'Mumbai South', 'DIST-MS-001'),
  ('Apollo Supply Chain',              'Mumbai South', 'DIST-MS-002'),
  ('Delhi Pharma Wholesale',           'Delhi NCR',    'DIST-DL-001'),
  ('NCR MedDistributors',              'Delhi NCR',    'DIST-DL-002');

-- ════════════════════════════════════════════════════════════════════════════
-- MR TARGETS — 9 products × 4 months × 3 MRs = 108 rows
-- Periods: month-1 through month-4 (relative to current month)
-- ════════════════════════════════════════════════════════════════════════════

-- Helper: We use to_char to compute the 4 recent periods
-- Month-0 (current): to_char(CURRENT_DATE, 'YYYY-MM')
-- Month-1 (last):    to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM')
-- Month-2:           to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM')
-- Month-3:           to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM')

-- ── Rahul (mr_rahul_001) — Strong performer targets ──
INSERT INTO mr_targets (user_id, product_id, period, target_qty, target_value, set_by) VALUES
  ('mr_rahul_001', 1, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 500, 4000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 2, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 350, 4900.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 3, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 200, 5000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 4, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 400, 6000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 5, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 300, 5400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 6, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 80,  6800.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 7, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 450, 5400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 8, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 300, 6000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 9, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 180, 6300.00, 'mgr_vikram_001'),

  ('mr_rahul_001', 1, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 520, 4160.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 2, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 360, 5040.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 3, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 210, 5250.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 4, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 420, 6300.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 5, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 310, 5580.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 6, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 85,  7225.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 7, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 460, 5520.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 8, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 310, 6200.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 9, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 190, 6650.00, 'mgr_vikram_001'),

  ('mr_rahul_001', 1, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 540, 4320.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 2, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 370, 5180.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 3, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 220, 5500.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 4, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 430, 6450.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 5, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 320, 5760.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 6, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 90,  7650.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 7, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 470, 5640.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 8, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 320, 6400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 9, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 200, 7000.00, 'mgr_vikram_001'),

  ('mr_rahul_001', 1, to_char(CURRENT_DATE, 'YYYY-MM'), 550, 4400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 2, to_char(CURRENT_DATE, 'YYYY-MM'), 380, 5320.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 3, to_char(CURRENT_DATE, 'YYYY-MM'), 230, 5750.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 4, to_char(CURRENT_DATE, 'YYYY-MM'), 440, 6600.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 5, to_char(CURRENT_DATE, 'YYYY-MM'), 330, 5940.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 6, to_char(CURRENT_DATE, 'YYYY-MM'), 95,  8075.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 7, to_char(CURRENT_DATE, 'YYYY-MM'), 480, 5760.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 8, to_char(CURRENT_DATE, 'YYYY-MM'), 330, 6600.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 9, to_char(CURRENT_DATE, 'YYYY-MM'), 210, 7350.00, 'mgr_vikram_001');

-- ── Priya (mr_priya_002) — Moderate performer targets ──
INSERT INTO mr_targets (user_id, product_id, period, target_qty, target_value, set_by) VALUES
  ('mr_priya_002', 1, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 480, 3840.00, 'mgr_vikram_001'),
  ('mr_priya_002', 2, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 320, 4480.00, 'mgr_vikram_001'),
  ('mr_priya_002', 3, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 180, 4500.00, 'mgr_vikram_001'),
  ('mr_priya_002', 4, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 380, 5700.00, 'mgr_vikram_001'),
  ('mr_priya_002', 5, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 280, 5040.00, 'mgr_vikram_001'),
  ('mr_priya_002', 6, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 70,  5950.00, 'mgr_vikram_001'),
  ('mr_priya_002', 7, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 420, 5040.00, 'mgr_vikram_001'),
  ('mr_priya_002', 8, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 280, 5600.00, 'mgr_vikram_001'),
  ('mr_priya_002', 9, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 160, 5600.00, 'mgr_vikram_001'),

  ('mr_priya_002', 1, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 490, 3920.00, 'mgr_vikram_001'),
  ('mr_priya_002', 2, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 330, 4620.00, 'mgr_vikram_001'),
  ('mr_priya_002', 3, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 190, 4750.00, 'mgr_vikram_001'),
  ('mr_priya_002', 4, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 390, 5850.00, 'mgr_vikram_001'),
  ('mr_priya_002', 5, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 290, 5220.00, 'mgr_vikram_001'),
  ('mr_priya_002', 6, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 75,  6375.00, 'mgr_vikram_001'),
  ('mr_priya_002', 7, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 430, 5160.00, 'mgr_vikram_001'),
  ('mr_priya_002', 8, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 290, 5800.00, 'mgr_vikram_001'),
  ('mr_priya_002', 9, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 170, 5950.00, 'mgr_vikram_001'),

  ('mr_priya_002', 1, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 500, 4000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 2, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 340, 4760.00, 'mgr_vikram_001'),
  ('mr_priya_002', 3, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 200, 5000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 4, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 400, 6000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 5, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 300, 5400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 6, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 80,  6800.00, 'mgr_vikram_001'),
  ('mr_priya_002', 7, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 440, 5280.00, 'mgr_vikram_001'),
  ('mr_priya_002', 8, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 300, 6000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 9, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 180, 6300.00, 'mgr_vikram_001'),

  ('mr_priya_002', 1, to_char(CURRENT_DATE, 'YYYY-MM'), 510, 4080.00, 'mgr_vikram_001'),
  ('mr_priya_002', 2, to_char(CURRENT_DATE, 'YYYY-MM'), 350, 4900.00, 'mgr_vikram_001'),
  ('mr_priya_002', 3, to_char(CURRENT_DATE, 'YYYY-MM'), 210, 5250.00, 'mgr_vikram_001'),
  ('mr_priya_002', 4, to_char(CURRENT_DATE, 'YYYY-MM'), 410, 6150.00, 'mgr_vikram_001'),
  ('mr_priya_002', 5, to_char(CURRENT_DATE, 'YYYY-MM'), 310, 5580.00, 'mgr_vikram_001'),
  ('mr_priya_002', 6, to_char(CURRENT_DATE, 'YYYY-MM'), 85,  7225.00, 'mgr_vikram_001'),
  ('mr_priya_002', 7, to_char(CURRENT_DATE, 'YYYY-MM'), 450, 5400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 8, to_char(CURRENT_DATE, 'YYYY-MM'), 310, 6200.00, 'mgr_vikram_001'),
  ('mr_priya_002', 9, to_char(CURRENT_DATE, 'YYYY-MM'), 190, 6650.00, 'mgr_vikram_001');

-- ── Robert (mr_robert_003) — Mixed performer targets ──
INSERT INTO mr_targets (user_id, product_id, period, target_qty, target_value, set_by) VALUES
  ('mr_robert_003', 1, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 460, 3680.00, 'mgr_vikram_001'),
  ('mr_robert_003', 2, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 300, 4200.00, 'mgr_vikram_001'),
  ('mr_robert_003', 3, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 170, 4250.00, 'mgr_vikram_001'),
  ('mr_robert_003', 4, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 360, 5400.00, 'mgr_vikram_001'),
  ('mr_robert_003', 5, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 260, 4680.00, 'mgr_vikram_001'),
  ('mr_robert_003', 6, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 65,  5525.00, 'mgr_vikram_001'),
  ('mr_robert_003', 7, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 500, 6000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 8, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 350, 7000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 9, to_char(CURRENT_DATE - INTERVAL '3 months', 'YYYY-MM'), 220, 7700.00, 'mgr_vikram_001'),

  ('mr_robert_003', 1, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 470, 3760.00, 'mgr_vikram_001'),
  ('mr_robert_003', 2, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 310, 4340.00, 'mgr_vikram_001'),
  ('mr_robert_003', 3, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 180, 4500.00, 'mgr_vikram_001'),
  ('mr_robert_003', 4, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 370, 5550.00, 'mgr_vikram_001'),
  ('mr_robert_003', 5, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 270, 4860.00, 'mgr_vikram_001'),
  ('mr_robert_003', 6, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 70,  5950.00, 'mgr_vikram_001'),
  ('mr_robert_003', 7, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 510, 6120.00, 'mgr_vikram_001'),
  ('mr_robert_003', 8, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 360, 7200.00, 'mgr_vikram_001'),
  ('mr_robert_003', 9, to_char(CURRENT_DATE - INTERVAL '2 months', 'YYYY-MM'), 230, 8050.00, 'mgr_vikram_001'),

  ('mr_robert_003', 1, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 480, 3840.00, 'mgr_vikram_001'),
  ('mr_robert_003', 2, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 320, 4480.00, 'mgr_vikram_001'),
  ('mr_robert_003', 3, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 190, 4750.00, 'mgr_vikram_001'),
  ('mr_robert_003', 4, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 380, 5700.00, 'mgr_vikram_001'),
  ('mr_robert_003', 5, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 280, 5040.00, 'mgr_vikram_001'),
  ('mr_robert_003', 6, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 75,  6375.00, 'mgr_vikram_001'),
  ('mr_robert_003', 7, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 520, 6240.00, 'mgr_vikram_001'),
  ('mr_robert_003', 8, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 370, 7400.00, 'mgr_vikram_001'),
  ('mr_robert_003', 9, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'), 240, 8400.00, 'mgr_vikram_001'),

  ('mr_robert_003', 1, to_char(CURRENT_DATE, 'YYYY-MM'), 490, 3920.00, 'mgr_vikram_001'),
  ('mr_robert_003', 2, to_char(CURRENT_DATE, 'YYYY-MM'), 330, 4620.00, 'mgr_vikram_001'),
  ('mr_robert_003', 3, to_char(CURRENT_DATE, 'YYYY-MM'), 200, 5000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 4, to_char(CURRENT_DATE, 'YYYY-MM'), 390, 5850.00, 'mgr_vikram_001'),
  ('mr_robert_003', 5, to_char(CURRENT_DATE, 'YYYY-MM'), 290, 5220.00, 'mgr_vikram_001'),
  ('mr_robert_003', 6, to_char(CURRENT_DATE, 'YYYY-MM'), 80,  6800.00, 'mgr_vikram_001'),
  ('mr_robert_003', 7, to_char(CURRENT_DATE, 'YYYY-MM'), 530, 6360.00, 'mgr_vikram_001'),
  ('mr_robert_003', 8, to_char(CURRENT_DATE, 'YYYY-MM'), 380, 7600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 9, to_char(CURRENT_DATE, 'YYYY-MM'), 250, 8750.00, 'mgr_vikram_001');


-- ════════════════════════════════════════════════════════════════════════════
-- SECONDARY SALES — ~60 rows per MR across 4 months (~180 total)
-- Distributor IDs (from insert order): 1=DIST-MN-001, 2=DIST-MN-002,
--   3=DIST-MS-001, 4=DIST-MS-002, 5=DIST-DL-001, 6=DIST-DL-002
-- ════════════════════════════════════════════════════════════════════════════

-- ── RAHUL (mr_rahul_001) — Mumbai North — 85-110% achievement ──

-- Month-3 (~90-105% of target)
INSERT INTO secondary_sales (user_id, territory, distributor_id, product_id, sale_date, quantity, value, uploaded_by) VALUES
  ('mr_rahul_001', 'Mumbai North', 1, 1, CURRENT_DATE - 95, 270, 2160.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 1, CURRENT_DATE - 88, 210, 1680.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 2, CURRENT_DATE - 92, 190, 2660.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 2, CURRENT_DATE - 85, 170, 2380.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 3, CURRENT_DATE - 90, 110, 2750.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 3, CURRENT_DATE - 87, 95,  2375.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 4, CURRENT_DATE - 93, 220, 3300.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 4, CURRENT_DATE - 86, 200, 3000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 5, CURRENT_DATE - 91, 165, 2970.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 5, CURRENT_DATE - 84, 150, 2700.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 6, CURRENT_DATE - 89, 42,  3570.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 6, CURRENT_DATE - 83, 40,  3400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 7, CURRENT_DATE - 94, 240, 2880.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 7, CURRENT_DATE - 82, 220, 2640.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 8, CURRENT_DATE - 90, 160, 3200.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 8, CURRENT_DATE - 85, 155, 3100.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 9, CURRENT_DATE - 88, 95,  3325.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 9, CURRENT_DATE - 83, 90,  3150.00, 'mgr_vikram_001'),

-- Month-2 (~95-108% of target)
  ('mr_rahul_001', 'Mumbai North', 1, 1, CURRENT_DATE - 65, 280, 2240.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 1, CURRENT_DATE - 58, 230, 1840.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 2, CURRENT_DATE - 62, 200, 2800.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 2, CURRENT_DATE - 55, 175, 2450.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 3, CURRENT_DATE - 60, 120, 3000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 3, CURRENT_DATE - 57, 100, 2500.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 4, CURRENT_DATE - 63, 230, 3450.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 4, CURRENT_DATE - 56, 210, 3150.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 5, CURRENT_DATE - 61, 170, 3060.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 5, CURRENT_DATE - 54, 155, 2790.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 6, CURRENT_DATE - 59, 45,  3825.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 6, CURRENT_DATE - 53, 43,  3655.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 7, CURRENT_DATE - 64, 250, 3000.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 7, CURRENT_DATE - 52, 230, 2760.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 8, CURRENT_DATE - 60, 170, 3400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 8, CURRENT_DATE - 55, 160, 3200.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 9, CURRENT_DATE - 58, 100, 3500.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 9, CURRENT_DATE - 53, 98,  3430.00, 'mgr_vikram_001'),

-- Month-1 (~100-110% of target)
  ('mr_rahul_001', 'Mumbai North', 1, 1, CURRENT_DATE - 35, 300, 2400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 1, CURRENT_DATE - 28, 260, 2080.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 2, CURRENT_DATE - 33, 210, 2940.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 2, CURRENT_DATE - 26, 185, 2590.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 3, CURRENT_DATE - 31, 125, 3125.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 3, CURRENT_DATE - 27, 110, 2750.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 4, CURRENT_DATE - 34, 240, 3600.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 4, CURRENT_DATE - 25, 220, 3300.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 5, CURRENT_DATE - 32, 180, 3240.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 5, CURRENT_DATE - 27, 165, 2970.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 6, CURRENT_DATE - 30, 50,  4250.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 6, CURRENT_DATE - 24, 48,  4080.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 7, CURRENT_DATE - 35, 260, 3120.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 7, CURRENT_DATE - 23, 240, 2880.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 8, CURRENT_DATE - 31, 180, 3600.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 8, CURRENT_DATE - 26, 170, 3400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 9, CURRENT_DATE - 29, 110, 3850.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 9, CURRENT_DATE - 24, 105, 3675.00, 'mgr_vikram_001'),

-- Current month (partial — ~40-50% so far, on track)
  ('mr_rahul_001', 'Mumbai North', 1, 1, CURRENT_DATE - 12, 140, 1120.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 1, CURRENT_DATE - 5,  120, 960.00,  'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 2, CURRENT_DATE - 10, 100, 1400.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 2, CURRENT_DATE - 4,  85,  1190.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 4, CURRENT_DATE - 11, 110, 1650.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 4, CURRENT_DATE - 3,  100, 1500.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 7, CURRENT_DATE - 9,  120, 1440.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 7, CURRENT_DATE - 2,  110, 1320.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 1, 8, CURRENT_DATE - 8,  80,  1600.00, 'mgr_vikram_001'),
  ('mr_rahul_001', 'Mumbai North', 2, 8, CURRENT_DATE - 1,  75,  1500.00, 'mgr_vikram_001');

-- ── PRIYA (mr_priya_002) — Mumbai South — 70-95% achievement ──

-- Month-3 (~75-90% of target)
INSERT INTO secondary_sales (user_id, territory, distributor_id, product_id, sale_date, quantity, value, uploaded_by) VALUES
  ('mr_priya_002', 'Mumbai South', 3, 1, CURRENT_DATE - 96, 200, 1600.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 1, CURRENT_DATE - 89, 160, 1280.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 2, CURRENT_DATE - 93, 140, 1960.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 2, CURRENT_DATE - 86, 115, 1610.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 3, CURRENT_DATE - 91, 75,  1875.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 3, CURRENT_DATE - 84, 65,  1625.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 4, CURRENT_DATE - 94, 160, 2400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 4, CURRENT_DATE - 87, 140, 2100.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 5, CURRENT_DATE - 92, 120, 2160.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 5, CURRENT_DATE - 85, 100, 1800.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 6, CURRENT_DATE - 90, 30,  2550.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 6, CURRENT_DATE - 83, 25,  2125.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 7, CURRENT_DATE - 95, 180, 2160.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 7, CURRENT_DATE - 82, 155, 1860.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 8, CURRENT_DATE - 91, 120, 2400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 8, CURRENT_DATE - 84, 105, 2100.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 9, CURRENT_DATE - 88, 70,  2450.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 9, CURRENT_DATE - 82, 55,  1925.00, 'mgr_vikram_001'),

-- Month-2 (~78-92% of target)
  ('mr_priya_002', 'Mumbai South', 3, 1, CURRENT_DATE - 66, 210, 1680.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 1, CURRENT_DATE - 59, 175, 1400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 2, CURRENT_DATE - 63, 150, 2100.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 2, CURRENT_DATE - 56, 125, 1750.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 3, CURRENT_DATE - 61, 80,  2000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 3, CURRENT_DATE - 54, 70,  1750.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 4, CURRENT_DATE - 64, 175, 2625.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 4, CURRENT_DATE - 57, 150, 2250.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 5, CURRENT_DATE - 62, 130, 2340.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 5, CURRENT_DATE - 55, 110, 1980.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 6, CURRENT_DATE - 60, 32,  2720.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 6, CURRENT_DATE - 53, 28,  2380.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 7, CURRENT_DATE - 65, 195, 2340.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 7, CURRENT_DATE - 52, 170, 2040.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 8, CURRENT_DATE - 61, 130, 2600.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 8, CURRENT_DATE - 54, 115, 2300.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 9, CURRENT_DATE - 58, 75,  2625.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 9, CURRENT_DATE - 52, 65,  2275.00, 'mgr_vikram_001'),

-- Month-1 (~80-95% of target)
  ('mr_priya_002', 'Mumbai South', 3, 1, CURRENT_DATE - 36, 220, 1760.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 1, CURRENT_DATE - 29, 185, 1480.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 2, CURRENT_DATE - 34, 155, 2170.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 2, CURRENT_DATE - 27, 135, 1890.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 3, CURRENT_DATE - 32, 85,  2125.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 3, CURRENT_DATE - 25, 80,  2000.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 4, CURRENT_DATE - 35, 185, 2775.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 4, CURRENT_DATE - 28, 160, 2400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 5, CURRENT_DATE - 33, 140, 2520.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 5, CURRENT_DATE - 26, 120, 2160.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 6, CURRENT_DATE - 31, 35,  2975.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 6, CURRENT_DATE - 24, 32,  2720.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 7, CURRENT_DATE - 36, 200, 2400.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 7, CURRENT_DATE - 23, 180, 2160.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 8, CURRENT_DATE - 32, 140, 2800.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 8, CURRENT_DATE - 25, 125, 2500.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 9, CURRENT_DATE - 29, 82,  2870.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 9, CURRENT_DATE - 23, 70,  2450.00, 'mgr_vikram_001'),

-- Current month (partial — ~35-45%)
  ('mr_priya_002', 'Mumbai South', 3, 1, CURRENT_DATE - 13, 110, 880.00,  'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 1, CURRENT_DATE - 6,  90,  720.00,  'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 2, CURRENT_DATE - 11, 75,  1050.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 2, CURRENT_DATE - 4,  65,  910.00,  'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 4, CURRENT_DATE - 10, 85,  1275.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 4, CURRENT_DATE - 3,  75,  1125.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 7, CURRENT_DATE - 9,  100, 1200.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 7, CURRENT_DATE - 2,  85,  1020.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 3, 8, CURRENT_DATE - 7,  65,  1300.00, 'mgr_vikram_001'),
  ('mr_priya_002', 'Mumbai South', 4, 8, CURRENT_DATE - 1,  55,  1100.00, 'mgr_vikram_001');

-- ── ROBERT (mr_robert_003) — Delhi NCR — 60-120% mixed (great Bevaas, weak Rilast) ──

-- Month-3 (~60-70% Rilast, ~105-120% Bevaas, ~80-90% Derise)
INSERT INTO secondary_sales (user_id, territory, distributor_id, product_id, sale_date, quantity, value, uploaded_by) VALUES
  ('mr_robert_003', 'Delhi NCR', 5, 1, CURRENT_DATE - 97, 200, 1600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 1, CURRENT_DATE - 90, 170, 1360.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 2, CURRENT_DATE - 94, 135, 1890.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 2, CURRENT_DATE - 87, 120, 1680.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 3, CURRENT_DATE - 92, 80,  2000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 3, CURRENT_DATE - 85, 65,  1625.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 4, CURRENT_DATE - 95, 115, 1725.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 4, CURRENT_DATE - 88, 100, 1500.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 5, CURRENT_DATE - 93, 85,  1530.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 5, CURRENT_DATE - 86, 75,  1350.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 6, CURRENT_DATE - 91, 20,  1700.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 6, CURRENT_DATE - 84, 18,  1530.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 7, CURRENT_DATE - 96, 290, 3480.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 7, CURRENT_DATE - 83, 270, 3240.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 8, CURRENT_DATE - 92, 210, 4200.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 8, CURRENT_DATE - 85, 195, 3900.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 9, CURRENT_DATE - 89, 130, 4550.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 9, CURRENT_DATE - 82, 120, 4200.00, 'mgr_vikram_001'),

-- Month-2 (~65-75% Rilast, ~110-118% Bevaas, ~82-92% Derise)
  ('mr_robert_003', 'Delhi NCR', 5, 1, CURRENT_DATE - 67, 210, 1680.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 1, CURRENT_DATE - 60, 180, 1440.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 2, CURRENT_DATE - 64, 145, 2030.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 2, CURRENT_DATE - 57, 130, 1820.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 3, CURRENT_DATE - 62, 85,  2125.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 3, CURRENT_DATE - 55, 70,  1750.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 4, CURRENT_DATE - 65, 125, 1875.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 4, CURRENT_DATE - 58, 110, 1650.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 5, CURRENT_DATE - 63, 90,  1620.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 5, CURRENT_DATE - 56, 85,  1530.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 6, CURRENT_DATE - 61, 22,  1870.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 6, CURRENT_DATE - 54, 20,  1700.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 7, CURRENT_DATE - 66, 300, 3600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 7, CURRENT_DATE - 53, 280, 3360.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 8, CURRENT_DATE - 62, 220, 4400.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 8, CURRENT_DATE - 55, 200, 4000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 9, CURRENT_DATE - 59, 140, 4900.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 9, CURRENT_DATE - 53, 130, 4550.00, 'mgr_vikram_001'),

-- Month-1 (~60-68% Rilast, ~112-120% Bevaas, ~85-95% Derise)
  ('mr_robert_003', 'Delhi NCR', 5, 1, CURRENT_DATE - 37, 220, 1760.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 1, CURRENT_DATE - 30, 200, 1600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 2, CURRENT_DATE - 35, 155, 2170.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 2, CURRENT_DATE - 28, 140, 1960.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 3, CURRENT_DATE - 33, 90,  2250.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 3, CURRENT_DATE - 26, 80,  2000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 4, CURRENT_DATE - 36, 120, 1800.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 4, CURRENT_DATE - 29, 108, 1620.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 5, CURRENT_DATE - 34, 88,  1584.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 5, CURRENT_DATE - 27, 80,  1440.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 6, CURRENT_DATE - 32, 22,  1870.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 6, CURRENT_DATE - 25, 20,  1700.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 7, CURRENT_DATE - 37, 310, 3720.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 7, CURRENT_DATE - 24, 300, 3600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 8, CURRENT_DATE - 33, 230, 4600.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 8, CURRENT_DATE - 26, 215, 4300.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 9, CURRENT_DATE - 30, 150, 5250.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 9, CURRENT_DATE - 24, 140, 4900.00, 'mgr_vikram_001'),

-- Current month (partial — ~35-50%)
  ('mr_robert_003', 'Delhi NCR', 5, 1, CURRENT_DATE - 14, 105, 840.00,  'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 1, CURRENT_DATE - 7,  90,  720.00,  'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 2, CURRENT_DATE - 12, 70,  980.00,  'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 2, CURRENT_DATE - 5,  60,  840.00,  'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 7, CURRENT_DATE - 13, 140, 1680.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 7, CURRENT_DATE - 6,  130, 1560.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 8, CURRENT_DATE - 10, 100, 2000.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 8, CURRENT_DATE - 3,  90,  1800.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 5, 9, CURRENT_DATE - 8,  65,  2275.00, 'mgr_vikram_001'),
  ('mr_robert_003', 'Delhi NCR', 6, 9, CURRENT_DATE - 1,  60,  2100.00, 'mgr_vikram_001');
