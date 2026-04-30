-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Tour Plans — 3 demo plans across MR personas covering all status states
--
-- Run AFTER: migration_v8_tour_plans.sql + seed_users.sql + seed_doctors.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE tour_plans RESTART IDENTITY CASCADE;

-- ── Rahul (Mumbai North): APPROVED plan for tomorrow, 3 doctor visits ──────
INSERT INTO tour_plans
  (user_id, plan_date, type_of_tour, station, start_time, end_time, status,
   submitted_at, reviewed_by, reviewed_at, review_notes, notes)
VALUES
  ('mr_rahul_001', CURRENT_DATE + INTERVAL '1 day', 'field_work', 'Mumbai',
   '09:00', '18:00', 'approved',
   NOW() - INTERVAL '2 days',
   'mgr_vikram_001',
   NOW() - INTERVAL '1 day',
   'Approved. Good Tier-A coverage focus.',
   'Morning route: Lilavati → Kokilaben → Hinduja');

INSERT INTO tour_plan_visits (tour_plan_id, doctor_id, doctor_name, visit_order, notes)
VALUES
  (1, 1, 'Dr. Anil Mehta',    1, 'Discuss Bevaas combination data'),
  (1, 3, 'Dr. Pradeep Joshi', 2, 'Follow-up on ARIA trial copy'),
  (1, 5, 'Dr. Ramesh Patil',  3, 'Drop Derise samples');

-- ── Priya (Mumbai South): SUBMITTED plan pending review, 2 visits ──────────
INSERT INTO tour_plans
  (user_id, plan_date, type_of_tour, station, start_time, end_time, status,
   submitted_at, notes)
VALUES
  ('mr_priya_002', CURRENT_DATE + INTERVAL '2 days', 'field_work', 'Mumbai',
   '10:00', '17:00', 'submitted',
   NOW() - INTERVAL '4 hours',
   'Focus on cardiology cluster around Breach Candy');

INSERT INTO tour_plan_visits (tour_plan_id, doctor_id, doctor_name, visit_order, notes)
VALUES
  (2, 6, 'Dr. Rajesh Kapoor', 1, 'New product detailing'),
  (2, 8, 'Dr. Vikram Desai',  2, 'Bevaas update');

-- ── Robert (Delhi NCR): DRAFT plan, 1 visit (still being edited) ───────────
INSERT INTO tour_plans
  (user_id, plan_date, type_of_tour, station, status, notes)
VALUES
  ('mr_robert_003', CURRENT_DATE + INTERVAL '3 days', 'meeting', 'Delhi',
   'draft',
   'Quarterly KOL meeting — agenda still being finalised');

INSERT INTO tour_plan_visits (tour_plan_id, doctor_id, doctor_name, visit_order, notes)
VALUES
  (3, 13, 'Dr. Pooja Singh', 1, 'Quarterly KOL discussion');
