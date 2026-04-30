-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Leaves — demo applications + per-user balance ledger
--
-- Run AFTER: migration_v10_leaves.sql + seed_users.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE leaves RESTART IDENTITY CASCADE;
TRUNCATE leave_balances RESTART IDENTITY CASCADE;

-- ── Annual allocations (current year) for the 3 MRs ────────────────────────
-- Standard SFA leave policy: 12 CL, 12 SL, 18 EL, 0 LOP/comp_off/sabbatical/maternity/paternity
-- (managers/admins typically have separate config; kept simple here)

DO $$
DECLARE
  yr INT := EXTRACT(YEAR FROM CURRENT_DATE)::int;
  uid TEXT;
  uids TEXT[] := ARRAY['mr_rahul_001', 'mr_priya_002', 'mr_robert_003'];
BEGIN
  FOREACH uid IN ARRAY uids LOOP
    INSERT INTO leave_balances (user_id, year, leave_type, allocated_days)
      VALUES (uid, yr, 'casual_leave',     12.0),
             (uid, yr, 'sick_leave',       12.0),
             (uid, yr, 'earned_leave',     18.0),
             (uid, yr, 'comp_off',          0.0),
             (uid, yr, 'loss_of_pay',       0.0),
             (uid, yr, 'maternity_leave',   0.0),
             (uid, yr, 'paternity_leave',   0.0),
             (uid, yr, 'sabbatical_leave',  0.0)
      ON CONFLICT (org_id, user_id, year, leave_type) DO NOTHING;
  END LOOP;
END $$;

-- ── Rahul: APPROVED 3-day casual leave taken last month ───────────────────
INSERT INTO leaves
  (user_id, leave_type, from_date, to_date, from_session, to_session, total_days,
   reason, contact_details, status, reviewed_by, reviewed_at, review_notes)
VALUES
  ('mr_rahul_001', 'casual_leave',
   CURRENT_DATE - INTERVAL '20 days',
   CURRENT_DATE - INTERVAL '18 days',
   'full', 'full', 3.0,
   'Family wedding in hometown',
   '+91-9876543210',
   'approved',
   'mgr_vikram_001',
   NOW() - INTERVAL '22 days',
   'Approved. Enjoy the wedding.');

-- Reflect the approved leave in Rahul's CL balance
UPDATE leave_balances
   SET used_days = 3.0, updated_at = NOW()
 WHERE user_id = 'mr_rahul_001'
   AND year = EXTRACT(YEAR FROM CURRENT_DATE)::int
   AND leave_type = 'casual_leave';

-- ── Priya: PENDING half-day sick leave (session_2 = afternoon) ─────────────
INSERT INTO leaves
  (user_id, leave_type, from_date, to_date, from_session, to_session, total_days,
   reason, contact_details, status)
VALUES
  ('mr_priya_002', 'sick_leave',
   CURRENT_DATE + INTERVAL '2 days',
   CURRENT_DATE + INTERVAL '2 days',
   'session_2', 'session_2', 0.5,
   'Routine medical check-up — afternoon only',
   '+91-9888777666',
   'pending');

-- ── Robert: REJECTED earned-leave application ─────────────────────────────
INSERT INTO leaves
  (user_id, leave_type, from_date, to_date, from_session, to_session, total_days,
   reason, contact_details, status, reviewed_by, reviewed_at, review_notes)
VALUES
  ('mr_robert_003', 'earned_leave',
   CURRENT_DATE + INTERVAL '5 days',
   CURRENT_DATE + INTERVAL '15 days',
   'full', 'full', 11.0,
   'Annual vacation — Goa trip',
   '+91-9123456789',
   'rejected',
   'mgr_vikram_001',
   NOW() - INTERVAL '1 day',
   'Quarterly review week. Please reschedule.');
