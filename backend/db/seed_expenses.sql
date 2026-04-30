-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Expense Claims — 3 demo claims covering all status states + claim types
--
-- Run AFTER: migration_v9_expenses.sql + seed_users.sql + seed_doctors.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE expense_claims RESTART IDENTITY CASCADE;

-- ── Rahul (Mumbai North): APPROVED claim for last month ─────────────────────
INSERT INTO expense_claims
  (user_id, period_start, period_end, currency, total_amount, status,
   submitted_at, reviewed_by, reviewed_at, review_notes, notes)
VALUES
  ('mr_rahul_001',
   date_trunc('month', CURRENT_DATE - INTERVAL '1 month')::date,
   (date_trunc('month', CURRENT_DATE) - INTERVAL '1 day')::date,
   'INR', 0, 'approved',
   NOW() - INTERVAL '10 days',
   'mgr_vikram_001',
   NOW() - INTERVAL '8 days',
   'Approved. All receipts in order.',
   'Last month field expenses');

-- Rahul's lines: a mix of all 4 claim types
INSERT INTO expense_line_items
  (claim_id, claim_type, expense_date, amount, description,
   conveyance_mode, distance_km, rate_per_km, from_place, to_place)
VALUES
  (1, 'local_conveyance',
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '5 days')::date,
   180.00, 'Office to Lilavati Hospital',
   'bike', 30.0, 6.00, 'Andheri Office', 'Lilavati Hospital');

INSERT INTO expense_line_items
  (claim_id, claim_type, from_date, to_date, amount, description,
   conveyance_mode, from_place, to_place, transport_class)
VALUES
  (1, 'travel_allowance',
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '12 days')::date,
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '14 days')::date,
   4500.00, 'Pune trip — KOL meeting',
   'train', 'Mumbai', 'Pune', 'AC 2-tier');

INSERT INTO expense_line_items
  (claim_id, claim_type, from_date, to_date, amount, description,
   allowance_type, days, daily_rate, city)
VALUES
  (1, 'daily_allowance',
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '12 days')::date,
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '14 days')::date,
   2250.00, 'Pune DA',
   'EX-HQ', 3.0, 750.00, 'Pune');

INSERT INTO expense_line_items
  (claim_id, claim_type, expense_date, amount, description, doctor_id)
VALUES
  (1, 'general_expense',
   (date_trunc('month', CURRENT_DATE - INTERVAL '1 month') + INTERVAL '20 days')::date,
   2400.00, 'Lunch meeting with Dr. Mehta — Cardiology rep',
   1);

UPDATE expense_claims
   SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM expense_line_items WHERE claim_id = 1)
 WHERE id = 1;

-- ── Priya (Mumbai South): SUBMITTED claim awaiting review ───────────────────
INSERT INTO expense_claims
  (user_id, period_start, period_end, currency, total_amount, status,
   submitted_at, notes)
VALUES
  ('mr_priya_002',
   date_trunc('month', CURRENT_DATE)::date,
   (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   'INR', 0, 'submitted',
   NOW() - INTERVAL '2 days',
   'Current month claim');

INSERT INTO expense_line_items
  (claim_id, claim_type, expense_date, amount, description,
   conveyance_mode, distance_km, rate_per_km, from_place, to_place)
VALUES
  (2, 'local_conveyance', CURRENT_DATE - INTERVAL '5 days',
   240.00, 'Visits across South Mumbai',
   'car', 40.0, 6.00, 'Office', 'Breach Candy Hospital');

INSERT INTO expense_line_items
  (claim_id, claim_type, expense_date, amount, description, allowance_type, days, daily_rate, city, from_date, to_date)
VALUES
  (2, 'daily_allowance', NULL, 750.00, 'HQ daily allowance', 'HQ', 1.0, 750.00, 'Mumbai',
   CURRENT_DATE - INTERVAL '5 days', CURRENT_DATE - INTERVAL '5 days');

UPDATE expense_claims
   SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM expense_line_items WHERE claim_id = 2)
 WHERE id = 2;

-- ── Robert (Delhi NCR): DRAFT claim, single line item ───────────────────────
INSERT INTO expense_claims
  (user_id, period_start, period_end, currency, total_amount, status, notes)
VALUES
  ('mr_robert_003',
   date_trunc('month', CURRENT_DATE)::date,
   (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month - 1 day')::date,
   'INR', 0, 'draft',
   'Building this month claim — still adding entries');

INSERT INTO expense_line_items
  (claim_id, claim_type, expense_date, amount, description,
   conveyance_mode, distance_km, rate_per_km, from_place, to_place)
VALUES
  (3, 'local_conveyance', CURRENT_DATE - INTERVAL '2 days',
   90.00, 'Quick visit to AIIMS',
   'taxi', 15.0, 6.00, 'Hotel', 'AIIMS');

UPDATE expense_claims
   SET total_amount = (SELECT COALESCE(SUM(amount),0) FROM expense_line_items WHERE claim_id = 3)
 WHERE id = 3;
