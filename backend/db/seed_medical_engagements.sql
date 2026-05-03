-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Medical Engagements + Attendees
--
-- 6 engagements covering all 7 engagement_type values (skipping 'other') and
-- all 4 status values (planned, confirmed, completed, cancelled). 14 attendee
-- rows wiring KOLs into engagements with realistic role mix and honoraria.
--
-- The KOL last_engagement_at + last_engagement_type values in seed_kols.sql
-- are kept consistent with the dates here (manually — the route handler
-- normally auto-stamps them, but we're bulk-inserting).
--
-- Run AFTER: migration_v17_medical_affairs.sql + seed_doctors.sql + seed_kols.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE engagement_attendees RESTART IDENTITY CASCADE;
TRUNCATE medical_engagements RESTART IDENTITY CASCADE;

-- ── Engagements (6 rows) ───────────────────────────────────────────────────
INSERT INTO medical_engagements
  (title, engagement_type, product, topic, agenda, location, scheduled_at, duration_minutes,
   sponsor_user_id, status, outcomes_summary)
VALUES
  -- 1: confirmed advisory board, +14 days from now (the demo's "next week" event)
  ('Mumbai Cardiology Advisory Board Q3 2026', 'advisory_board',
   'Derise', 'Real-world dosing of Derise in CKD-comorbid cardiology patients',
   E'09:00 — Welcome & objectives\n09:15 — Dr. Anil Mehta: Pivotal CARDIO-V update\n10:00 — Panel: dosing in CrCl 30-60\n11:00 — Coffee break\n11:30 — Open discussion: real-world signals\n12:30 — Lunch & wrap-up',
   'The Oberoi, Nariman Point, Mumbai',
   NOW() + INTERVAL '14 days', 240,
   'mgr_vikram_001', 'confirmed',
   NULL),

  -- 2: planned speaker program, +28 days
  ('Bevaas Speaker Program — North India Tour 2026', 'speaker_program',
   'Bevaas', 'Cardiology + neurology dual-speaker tour across Delhi, Chandigarh, Lucknow',
   E'Three-city tour. Each city: 90-minute CME session with Q&A. Target 50-70 attending physicians per city.',
   'Delhi NCR / Chandigarh / Lucknow',
   NOW() + INTERVAL '28 days', 270,
   'mgr_vikram_001', 'planned',
   NULL),

  -- 3: completed roundtable, -21 days
  ('Derise Renal Dosing Roundtable', 'roundtable',
   'Derise', 'Renal dose adjustment guidance for nephrologists',
   E'Closed-door roundtable. 8 invited nephrologists. Focus on the v2 dosing label updates.',
   'ITC Maratha, Mumbai',
   NOW() - INTERVAL '21 days', 180,
   'mgr_vikram_001', 'completed',
   E'Strong consensus that the new CrCl-tiered dosing chart is clinically useful. Two attendees committed to internal protocol updates at their hospitals. Dr. Joshi (chair) volunteered to draft a one-page tear-sheet for nephrology departments. Action items captured.'),

  -- 4: planned investigator meeting, +45 days
  ('Cardiology Investigator Meeting — Pune Site', 'investigator_meeting',
   'Derise',
   'Site initiation visit for the Derise CARDIO-VI investigator-initiated trial',
   E'Protocol walkthrough, regulatory document collection, GCP refresher.',
   'JW Marriott, Pune',
   NOW() + INTERVAL '45 days', 360,
   'admin_001', 'planned',
   NULL),

  -- 5: completed symposium, -10 days
  ('Mumbai Neurology Symposium 2026', 'symposium',
   'Bevaas',
   'Movement disorders and neurodegeneration — current evidence',
   E'Half-day symposium. 4 speakers, 1 panel discussion. ~120 attendees expected.',
   'Taj Lands End, Bandra, Mumbai',
   NOW() - INTERVAL '10 days', 240,
   'mgr_vikram_001', 'completed',
   E'132 attendees (exceeded target). Dr. Kapoor''s keynote on movement disorders received strong feedback. Q&A revealed appetite for more deep-dive on Bevaas long-term safety. Dr. Sharma''s first major participation as an emerging KOL.'),

  -- 6: cancelled consultation, originally scheduled -7 days
  ('Q4 Endocrinology Strategy Consultation', 'consultation',
   'Derise',
   'One-on-one strategy consultation on diabetes-cardiovascular dual indication',
   E'Cancelled. Will reschedule pending updated safety bulletin.',
   'Online video conference (Zoom)',
   NOW() - INTERVAL '7 days', 60,
   'mgr_vikram_001', 'cancelled',
   E'Cancelled by mutual agreement. Dr. Rao asked to reschedule once we provide updated hepatotoxicity safety data. Internal note: rebook in 4-6 weeks once medical affairs publishes the bulletin.');

-- ── Attendees (14 rows) ────────────────────────────────────────────────────
INSERT INTO engagement_attendees
  (engagement_id, doctor_id, attendee_role, attended, honorarium_amt, honorarium_ccy, feedback)
VALUES
  -- Engagement 1 (Mumbai cardio AB, +14 days, future)
  (1, 1,  'chair',    NULL,  75000.00, 'INR', NULL),
  (1, 8,  'panelist', NULL,  50000.00, 'INR', NULL),
  (1, 3,  'attendee', NULL,  30000.00, 'INR', NULL),
  (1, 6,  'attendee', NULL,  30000.00, 'INR', NULL),

  -- Engagement 2 (Bevaas speaker tour, +28 days, future)
  (2, 10, 'speaker',  NULL, 100000.00, 'INR', NULL),
  (2, 1,  'speaker',  NULL, 100000.00, 'INR', NULL),

  -- Engagement 3 (renal roundtable, -21 days, completed)
  (3, 3,  'chair',    TRUE,  40000.00, 'INR', 'Excellent discussion on dose adjustments. Strong appetite for the v2 label rollout.'),
  (3, 13, 'attendee', TRUE,  20000.00, 'INR', 'Useful cross-specialty perspective. Endocrinology angle was well-received.'),

  -- Engagement 4 (Pune investigator meeting, +45 days, future)
  (4, 8,  'attendee', NULL,      NULL, 'INR', NULL),
  (4, 10, 'organiser',NULL,      NULL, 'INR', NULL),

  -- Engagement 5 (Mumbai neurology symposium, -10 days, completed)
  (5, 6,  'speaker',  TRUE,  60000.00, 'INR', 'Keynote on movement disorders received strong feedback. 132 attendees.'),
  (5, 11, 'attendee', TRUE,  15000.00, 'INR', 'First major event for an emerging KOL — good engagement during Q&A.'),

  -- Engagement 6 (cancelled endocrinology consultation, -7 days)
  (6, 4,  'attendee', FALSE,     NULL, 'INR', 'Cancelled — to be rescheduled.');
