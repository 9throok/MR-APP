-- Seed demo data for V2 features
-- Run after: dummy_data.sql, migration_v2.sql, seed_users.sql, seed_doctors.sql
-- Usage: docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_demo_data.sql
-- NOTE: DCR IDs assume sequences were reset before seeding dummy_data.sql.
--       Robert's DCRs are IDs 19-28 (first block) and 37-38 (extra visits).

-- Clear existing V2 data (idempotent)
DELETE FROM follow_up_tasks;
DELETE FROM adverse_events;
DELETE FROM nba_recommendations;

-- ============================================================================
-- FOLLOW-UP TASKS
-- ============================================================================

-- Robert's tasks (mr_robert_003)
-- DCR ID mapping: 19=Neha Sharma/Derise10, 20=Neha Sharma/Derise20, 21=Suresh Kumar/RilastTab,
--   22=Suresh Kumar/RilastCap, 23=Amit Gupta/Bevaas5, 24=Amit Gupta/Bevaas10, 25=Pooja Singh/Bevaas20,
--   26=Pooja Singh/Derise50, 27=Rakesh Mishra/RilastSyrup, 28=Rakesh Mishra/RilastTab
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
-- Pending tasks
(19, 'mr_robert_003', 'Dr. Neha Sharma', 'Share Derise 10mg clinical trial brochure — doctor interested in prescribing for allergy OPD', (CURRENT_DATE + 2), 'pending', NOW() - INTERVAL '1 day'),
(21, 'mr_robert_003', 'Dr. Suresh Kumar', 'Send Rilast Tablet vs Capsule comparison chart as requested', (CURRENT_DATE + 3), 'pending', NOW() - INTERVAL '2 days'),
(23, 'mr_robert_003', 'Dr. Amit Gupta', 'Arrange meeting with MSL for Bevaas 20mg resistant hypertension data', (CURRENT_DATE + 5), 'pending', NOW() - INTERVAL '3 days'),
(25, 'mr_robert_003', 'Dr. Pooja Singh', 'Follow up on Bevaas 20mg combination therapy results — doctor evaluating efficacy', (CURRENT_DATE + 1), 'pending', NOW() - INTERVAL '4 days'),
(NULL, 'mr_robert_003', 'Dr. Rakesh Mishra', 'Deliver Rilast Syrup samples for paediatric ward trial', (CURRENT_DATE + 4), 'pending', NOW() - INTERVAL '2 days'),

-- Overdue tasks
(26, 'mr_robert_003', 'Dr. Pooja Singh', 'Submit adverse event follow-up form for Derise 50mg patient', (CURRENT_DATE - 3), 'overdue', NOW() - INTERVAL '10 days'),
(22, 'mr_robert_003', 'Dr. Suresh Kumar', 'Provide updated Rilast Capsule prescribing information leaflet', (CURRENT_DATE - 5), 'overdue', NOW() - INTERVAL '12 days'),

-- Completed tasks
(20, 'mr_robert_003', 'Dr. Neha Sharma', 'Shared Derise 20mg dosage escalation guidelines', (CURRENT_DATE - 7), 'completed', NOW() - INTERVAL '14 days'),
(24, 'mr_robert_003', 'Dr. Amit Gupta', 'Delivered Bevaas 10mg patient education materials', (CURRENT_DATE - 10), 'completed', NOW() - INTERVAL '15 days'),
(28, 'mr_robert_003', 'Dr. Rakesh Mishra', 'Submitted Rilast Tablet sample request to warehouse', (CURRENT_DATE - 8), 'completed', NOW() - INTERVAL '16 days');

-- Rahul's tasks (mr_rahul_001)
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
(NULL, 'mr_rahul_001', 'Dr. Anil Mehta', 'Share ARIA trial data for Derise 10mg — doctor wants evidence for allergy OPD', (CURRENT_DATE + 2), 'pending', NOW() - INTERVAL '1 day'),
(NULL, 'mr_rahul_001', 'Dr. Sunita Verma', 'Deliver Rilast Capsule samples for chronic asthma ward', (CURRENT_DATE + 4), 'pending', NOW() - INTERVAL '3 days'),
(NULL, 'mr_rahul_001', 'Dr. Pradeep Joshi', 'Send Bevaas clinical trial summary to doctor', (CURRENT_DATE - 2), 'overdue', NOW() - INTERVAL '8 days'),
(NULL, 'mr_rahul_001', 'Dr. Kavita Rao', 'Completed Derise 50mg safety data presentation', (CURRENT_DATE - 6), 'completed', NOW() - INTERVAL '12 days'),
(NULL, 'mr_rahul_001', 'Dr. Ramesh Patil', 'Arrange CME session on resistant hypertension management', (CURRENT_DATE + 7), 'pending', NOW() - INTERVAL '2 days');

-- Priya's tasks (mr_priya_002)
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
(NULL, 'mr_priya_002', 'Dr. Meena Shah', 'Follow up on Derise 20mg patient compliance feedback', (CURRENT_DATE + 1), 'pending', NOW() - INTERVAL '2 days'),
(NULL, 'mr_priya_002', 'Dr. Vikram Desai', 'Send Bevaas ASCOT trial summary for cardiology discussion', (CURRENT_DATE + 3), 'pending', NOW() - INTERVAL '1 day'),
(NULL, 'mr_priya_002', 'Dr. Rajesh Kapoor', 'Share Rilast Syrup paediatric dosing chart', (CURRENT_DATE - 1), 'overdue', NOW() - INTERVAL '7 days'),
(NULL, 'mr_priya_002', 'Dr. Anita Patel', 'Delivered Derise 50mg prescribing info to clinic', (CURRENT_DATE - 5), 'completed', NOW() - INTERVAL '10 days');

-- ============================================================================
-- ADVERSE EVENTS
-- ============================================================================

-- Pending adverse events (need review)
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at) VALUES
(23, 'mr_robert_003', 'Dr. Amit Gupta', 'Bevaas 10mg',
 ARRAY['peripheral edema', 'ankle swelling'],
 'mild',
 '{"age": "67", "gender": "male", "condition": "essential hypertension", "duration_on_drug": "3 weeks"}'::jsonb,
 'Swelling noticed after 2 weeks of starting Bevaas 10mg. No pain, mild discomfort.',
 'pending', NOW() - INTERVAL '3 days'),

(25, 'mr_robert_003', 'Dr. Pooja Singh', 'Bevaas 20mg',
 ARRAY['dizziness', 'fatigue', 'hypotension'],
 'moderate',
 '{"age": "72", "gender": "female", "condition": "resistant hypertension", "duration_on_drug": "1 week", "concomitant_drugs": "ramipril 5mg"}'::jsonb,
 'Patient experienced dizziness on standing after dose increase from 10mg to 20mg. BP dropped to 95/60.',
 'pending', NOW() - INTERVAL '2 days'),

(19, 'mr_robert_003', 'Dr. Neha Sharma', 'Derise 10mg',
 ARRAY['headache', 'dry mouth'],
 'mild',
 '{"age": "34", "gender": "female", "condition": "seasonal allergic rhinitis", "duration_on_drug": "5 days"}'::jsonb,
 'Mild headache in the first 3 days, resolved spontaneously. Persistent dry mouth.',
 'pending', NOW() - INTERVAL '1 day'),

(NULL, 'mr_priya_002', 'Dr. Rajesh Kapoor', 'Rilast Tablet',
 ARRAY['vivid dreams', 'sleep disturbance', 'irritability'],
 'moderate',
 '{"age": "28", "gender": "male", "condition": "chronic asthma", "duration_on_drug": "2 weeks"}'::jsonb,
 'Patient reports vivid nightmares starting 1 week after initiation. Irritability during daytime.',
 'pending', NOW() - INTERVAL '4 days'),

(NULL, 'mr_rahul_001', 'Dr. Pradeep Joshi', 'Bevaas 5mg',
 ARRAY['flushing', 'palpitations'],
 'mild',
 '{"age": "55", "gender": "male", "condition": "early-stage hypertension", "duration_on_drug": "10 days"}'::jsonb,
 'Facial flushing and occasional palpitations after starting therapy. Symptoms reducing over time.',
 'pending', NOW() - INTERVAL '5 days');

-- Confirmed adverse events
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(26, 'mr_robert_003', 'Dr. Pooja Singh', 'Derise 50mg',
 ARRAY['somnolence', 'fatigue', 'impaired concentration'],
 'moderate',
 '{"age": "45", "gender": "male", "condition": "severe allergic dermatitis", "duration_on_drug": "1 week"}'::jsonb,
 'Patient reports excessive drowsiness at 50mg dose despite non-sedating profile. Affects daily work.',
 'confirmed', NOW() - INTERVAL '15 days', 'manager1',
 'Confirmed. Dose-related sedation at 50mg. Recommend dose reduction to 20mg and reassess. Patient should avoid driving until symptoms resolve.',
 NOW() - INTERVAL '13 days'),

(NULL, 'mr_priya_002', 'Dr. Meena Shah', 'Derise 20mg',
 ARRAY['nausea', 'abdominal discomfort'],
 'mild',
 '{"age": "42", "gender": "female", "condition": "chronic urticaria", "duration_on_drug": "3 weeks"}'::jsonb,
 'Mild nausea after taking on empty stomach. Resolved when taken with food.',
 'confirmed', NOW() - INTERVAL '20 days', 'manager1',
 'Confirmed mild GI intolerance. Advise patient to take with food. No dose change needed.',
 NOW() - INTERVAL '18 days');

-- Dismissed adverse event
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(NULL, 'mr_rahul_001', 'Dr. Anil Mehta', 'Rilast Syrup',
 ARRAY['cough', 'throat irritation'],
 'mild',
 '{"age": "8", "gender": "male", "condition": "paediatric asthma", "duration_on_drug": "4 weeks"}'::jsonb,
 'Parent reports mild cough after syrup administration.',
 'dismissed', NOW() - INTERVAL '25 days', 'manager1',
 'Dismissed. Cough is likely related to underlying asthma condition, not drug-related. Syrup formulation well-tolerated in clinical trials.',
 NOW() - INTERVAL '22 days');

-- Severe adverse event
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(NULL, 'mr_robert_003', 'Dr. Amit Gupta', 'Bevaas 20mg',
 ARRAY['severe hypotension', 'syncope', 'tachycardia'],
 'severe',
 '{"age": "78", "gender": "female", "condition": "resistant hypertension with aortic stenosis", "duration_on_drug": "3 days", "concomitant_drugs": "enalapril 10mg, hydrochlorothiazide 12.5mg"}'::jsonb,
 'Patient fainted at home on day 3. BP recorded at 80/50. Brought to ER. Triple antihypertensive combination likely contributory.',
 'confirmed', NOW() - INTERVAL '30 days', 'manager1',
 'SERIOUS AE — confirmed. Bevaas 20mg contraindicated with severe aortic stenosis. Triple combination excessive for elderly patient. Reported to pharmacovigilance. Bevaas discontinued, patient stabilized.',
 NOW() - INTERVAL '28 days');

-- NOTE: All DCR call_summary/doctor_feedback are now set directly in dummy_data.sql.
-- No UPDATE statements needed here.
