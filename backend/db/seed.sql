-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Seed Data
-- 3 MRs, 13 doctors, 9 products, ~48 days of DCR history
--
-- MR IDs (use these in API calls):
--   mr_rahul_001   → Rahul Sharma
--   mr_priya_002   → Priya Mehta
--   mr_robert_003  → Robert
--
-- Run against local Docker:
--   docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

TRUNCATE TABLE products RESTART IDENTITY CASCADE;

INSERT INTO products (name) VALUES
('Derise 10mg'),
('Derise 20mg'),
('Derise 50mg'),
('Rilast Tablet'),
('Rilast Capsule'),
('Rilast Syrup'),
('Bevaas 5mg'),
('Bevaas 10mg'),
('Bevaas 20mg');

TRUNCATE TABLE dcr RESTART IDENTITY CASCADE;

INSERT INTO dcr (user_id, name, date, product, samples, call_summary, doctor_feedback) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- MR: Rahul Sharma (mr_rahul_001)
-- Doctors: Anil Mehta, Sunita Verma, Pradeep Joshi, Kavita Rao, Ramesh Patil
-- ─────────────────────────────────────────────────────────────────────────────

('mr_rahul_001', 'Dr. Anil Mehta', CURRENT_DATE - 2, 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":3}]',
 'Discussed allergy management cases. Doctor seeing good patient tolerance.',
 'Patients reporting less drowsiness'),

('mr_rahul_001', 'Dr. Anil Mehta', CURRENT_DATE - 18, 'Derise 20mg',
 '[{"id":2,"name":"Derise 20mg","quantity":2}]',
 'Doctor evaluating higher strength for resistant allergic rhinitis.',
 NULL),

('mr_rahul_001', 'Dr. Sunita Verma', CURRENT_DATE - 5, 'Rilast Tablet',
 '[{"id":4,"name":"Rilast Tablet","quantity":4}]',
 'Discussed asthma control therapy for chronic patients.',
 'Doctor satisfied with symptom control'),

('mr_rahul_001', 'Dr. Sunita Verma', CURRENT_DATE - 21, 'Rilast Syrup',
 '[{"id":6,"name":"Rilast Syrup","quantity":3}]',
 'Paediatric asthma cases discussed.',
 'Parents reported improved night breathing'),

('mr_rahul_001', 'Dr. Pradeep Joshi', CURRENT_DATE - 18, 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":5}]',
 'Doctor treating mild hypertension patients.',
 'BP reduction seen within 2 weeks'),

('mr_rahul_001', 'Dr. Pradeep Joshi', CURRENT_DATE - 26, 'Bevaas 10mg',
 '[{"id":8,"name":"Bevaas 10mg","quantity":3}]',
 'Discussed dosage escalation strategy.',
 NULL),

('mr_rahul_001', 'Dr. Kavita Rao', CURRENT_DATE - 22, 'Derise 50mg',
 '[{"id":3,"name":"Derise 50mg","quantity":2}]',
 'Doctor managing severe allergy patients.',
 'Works well in chronic urticaria'),

('mr_rahul_001', 'Dr. Kavita Rao', CURRENT_DATE - 34, 'Rilast Capsule',
 '[{"id":5,"name":"Rilast Capsule","quantity":4}]',
 'Adult asthma cases reviewed.',
 NULL),

('mr_rahul_001', 'Dr. Ramesh Patil', CURRENT_DATE - 35, 'Bevaas 20mg',
 '[{"id":9,"name":"Bevaas 20mg","quantity":3}]',
 'Doctor treating resistant hypertension.',
 'BP stabilization observed'),

('mr_rahul_001', 'Dr. Ramesh Patil', CURRENT_DATE - 42, 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":3}]',
 'Follow-up visit regarding allergy patients.',
 NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- MR: Priya Mehta (mr_priya_002)
-- Doctors: Meena Shah, Vikram Desai, Rajesh Kapoor, Anita Patel
-- ─────────────────────────────────────────────────────────────────────────────

('mr_priya_002', 'Dr. Meena Shah', CURRENT_DATE - 1, 'Derise 20mg',
 '[{"id":2,"name":"Derise 20mg","quantity":5}]',
 'Doctor prescribing regularly in allergy OPD.',
 'Patients prefer once daily dosing'),

('mr_priya_002', 'Dr. Meena Shah', CURRENT_DATE - 16, 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":4}]',
 'Discussed mild allergy treatment protocol.',
 NULL),

('mr_priya_002', 'Dr. Vikram Desai', CURRENT_DATE - 25, 'Rilast Tablet',
 '[{"id":4,"name":"Rilast Tablet","quantity":3}]',
 'Doctor reviewing asthma therapy options.',
 'Doctor wants long term efficacy data'),

('mr_priya_002', 'Dr. Vikram Desai', CURRENT_DATE - 36, 'Rilast Capsule',
 '[{"id":5,"name":"Rilast Capsule","quantity":2}]',
 'Doctor trialing capsules for adult patients.',
 NULL),

('mr_priya_002', 'Dr. Rajesh Kapoor', CURRENT_DATE - 35, 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":5}]',
 'Doctor treating newly diagnosed hypertension.',
 'Good response in early cases'),

('mr_priya_002', 'Dr. Rajesh Kapoor', CURRENT_DATE - 28, 'Bevaas 10mg',
 '[{"id":8,"name":"Bevaas 10mg","quantity":4}]',
 'Doctor evaluating dosage increase.',
 NULL),

('mr_priya_002', 'Dr. Anita Patel', CURRENT_DATE - 55, 'Derise 50mg',
 '[{"id":3,"name":"Derise 50mg","quantity":3}]',
 'Doctor seeing severe allergic reactions.',
 'Fast symptom relief observed'),

('mr_priya_002', 'Dr. Anita Patel', CURRENT_DATE - 48, 'Rilast Syrup',
 '[{"id":6,"name":"Rilast Syrup","quantity":4}]',
 'Doctor treating paediatric asthma.',
 NULL),

-- ─────────────────────────────────────────────────────────────────────────────
-- MR: Robert (mr_robert_003)
-- Doctors: Neha Sharma, Suresh Kumar, Amit Gupta, Pooja Singh, Rakesh Mishra
-- ─────────────────────────────────────────────────────────────────────────────

('mr_robert_003', 'Dr. Neha Sharma', CURRENT_DATE - 2, 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":5}]',
 'First visit with doctor. Introduced antihistamine therapy.',
 'Doctor interested in prescribing'),

('mr_robert_003', 'Dr. Neha Sharma', CURRENT_DATE - 19, 'Derise 20mg',
 '[{"id":2,"name":"Derise 20mg","quantity":3}]',
 'Follow-up discussion on severe allergy cases.',
 NULL),

('mr_robert_003', 'Dr. Suresh Kumar', CURRENT_DATE - 4, 'Rilast Tablet',
 '[{"id":4,"name":"Rilast Tablet","quantity":4}]',
 'Doctor treating chronic asthma patients.',
 'Positive response reported'),

('mr_robert_003', 'Dr. Suresh Kumar', CURRENT_DATE - 24, 'Rilast Capsule',
 '[{"id":5,"name":"Rilast Capsule","quantity":3}]',
 'Doctor requested more clinical material.',
 NULL),

('mr_robert_003', 'Dr. Amit Gupta', CURRENT_DATE - 15, 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":5}]',
 'Doctor treating early stage hypertension.',
 'Good tolerance in elderly'),

('mr_robert_003', 'Dr. Amit Gupta', CURRENT_DATE - 31, 'Bevaas 10mg',
 '[{"id":8,"name":"Bevaas 10mg","quantity":3}]',
 'Doctor evaluating BP reduction effectiveness.',
 NULL),

('mr_robert_003', 'Dr. Pooja Singh', CURRENT_DATE - 29, 'Bevaas 20mg',
 '[{"id":9,"name":"Bevaas 20mg","quantity":2}]',
 'Doctor managing resistant hypertension.',
 'Effective in combination therapy'),

('mr_robert_003', 'Dr. Pooja Singh', CURRENT_DATE - 29, 'Derise 50mg',
 '[{"id":3,"name":"Derise 50mg","quantity":3}]',
 'Doctor treating severe allergic dermatitis.',
 NULL),

('mr_robert_003', 'Dr. Rakesh Mishra', CURRENT_DATE - 40, 'Rilast Syrup',
 '[{"id":6,"name":"Rilast Syrup","quantity":4}]',
 'Doctor handles paediatric asthma cases.',
 'Parents report improved breathing'),

('mr_robert_003', 'Dr. Rakesh Mishra', CURRENT_DATE - 40, 'Rilast Tablet',
 '[{"id":4,"name":"Rilast Tablet","quantity":3}]',
 'Doctor satisfied with adult asthma management.',
 NULL);

-- ─────────────────────────────────────────────────────────────────────────────
-- Additional visits with visit_time
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO dcr (user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback) VALUES

-- Rahul extra visits
('mr_rahul_001', 'Dr. Anil Mehta', CURRENT_DATE - 1, '2026-03-01 10:30:00+00', 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":2}]',
 'Discussed combination therapy for resistant hypertension.',
 NULL),

('mr_rahul_001', 'Dr. Sunita Verma', CURRENT_DATE - 3, '2026-03-03 15:45:00+00', 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":4}]',
 'Follow-up on allergic rhinitis cases.',
 'Patient response improving'),

('mr_rahul_001', 'Dr. Pradeep Joshi', CURRENT_DATE - 18, '2026-02-27 09:15:00+00', 'Rilast Syrup',
 '[{"id":6,"name":"Rilast Syrup","quantity":3}]',
 'Paediatric asthma follow-up.',
 NULL),

('mr_rahul_001', 'Dr. Ramesh Patil', CURRENT_DATE - 35, '2026-02-10 11:00:00+00', 'Bevaas 10mg',
 '[{"id":8,"name":"Bevaas 10mg","quantity":2}]',
 'Dosage adjustments discussed for hypertensive patients.',
 'BP under control'),

('mr_rahul_001', 'Dr. Kavita Rao', CURRENT_DATE - 22, '2026-02-23 14:20:00+00', 'Derise 20mg',
 '[{"id":2,"name":"Derise 20mg","quantity":3}]',
 'Severe allergy cases reviewed.',
 NULL),

-- Priya extra visits
('mr_priya_002', 'Dr. Meena Shah', CURRENT_DATE - 2, '2026-03-02 10:00:00+00', 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":3}]',
 'Hypertension management cases.',
 'Good BP control observed'),

('mr_priya_002', 'Dr. Vikram Desai', CURRENT_DATE - 25, '2026-02-20 16:30:00+00', 'Derise 50mg',
 '[{"id":3,"name":"Derise 50mg","quantity":2}]',
 'High strength allergy therapy discussion.',
 NULL),

('mr_priya_002', 'Dr. Rajesh Kapoor', CURRENT_DATE - 30, '2026-02-15 09:45:00+00', 'Rilast Tablet',
 '[{"id":4,"name":"Rilast Tablet","quantity":5}]',
 'Adult asthma follow-up.',
 'Doctor satisfied with symptom control'),

('mr_priya_002', 'Dr. Anita Patel', CURRENT_DATE - 45, '2026-01-31 13:15:00+00', 'Bevaas 20mg',
 '[{"id":9,"name":"Bevaas 20mg","quantity":4}]',
 'Dosage evaluation for resistant hypertension.',
 NULL),

('mr_priya_002', 'Dr. Meena Shah', CURRENT_DATE - 5, '2026-03-05 11:50:00+00', 'Rilast Capsule',
 '[{"id":5,"name":"Rilast Capsule","quantity":3}]',
 'Capsule therapy review.',
 'Patient adherence good'),

-- Robert extra visits
('mr_robert_003', 'Dr. Neha Sharma', CURRENT_DATE - 3, '2026-03-03 10:10:00+00', 'Bevaas 5mg',
 '[{"id":7,"name":"Bevaas 5mg","quantity":3}]',
 'Early hypertension treatment follow-up.',
 'Positive patient response'),

('mr_robert_003', 'Dr. Suresh Kumar', CURRENT_DATE - 5, '2026-03-05 14:30:00+00', 'Derise 20mg',
 '[{"id":2,"name":"Derise 20mg","quantity":2}]',
 'Allergic rhinitis management.',
 NULL),

('mr_robert_003', 'Dr. Amit Gupta', CURRENT_DATE - 15, '2026-03-02 09:00:00+00', 'Rilast Syrup',
 '[{"id":6,"name":"Rilast Syrup","quantity":4}]',
 'Paediatric asthma follow-up.',
 'Improvement in night-time symptoms'),

('mr_robert_003', 'Dr. Pooja Singh', CURRENT_DATE - 29, '2026-02-16 11:20:00+00', 'Derise 10mg',
 '[{"id":1,"name":"Derise 10mg","quantity":3}]',
 'Allergy cases discussion.',
 NULL),

('mr_robert_003', 'Dr. Rakesh Mishra', CURRENT_DATE - 40, '2026-02-05 15:40:00+00', 'Bevaas 10mg',
 '[{"id":8,"name":"Bevaas 10mg","quantity":2}]',
 'Hypertension monitoring visit.',
 'BP improving in patients');
