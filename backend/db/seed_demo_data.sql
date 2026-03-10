-- Seed demo data for V2 features
-- Run after: dummy_data.sql, migration_v2.sql, seed_users.sql, seed_doctors.sql
-- Usage: docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_demo_data.sql

-- Clear existing V2 data (idempotent)
DELETE FROM follow_up_tasks;
DELETE FROM adverse_events;
DELETE FROM nba_recommendations;

-- ============================================================================
-- FOLLOW-UP TASKS
-- ============================================================================

-- Robert's tasks (mr_robert_003)
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
-- Pending tasks
(44, 'mr_robert_003', 'Dr. Reddy', 'Share Derise 10mg clinical trial brochure — doctor interested in prescribing for allergy OPD', (CURRENT_DATE + 2), 'pending', NOW() - INTERVAL '1 day'),
(46, 'mr_robert_003', 'Dr. Kumar', 'Send Rilast Tablet vs Capsule comparison chart as requested', (CURRENT_DATE + 3), 'pending', NOW() - INTERVAL '2 days'),
(48, 'mr_robert_003', 'Dr. Mehta', 'Arrange meeting with MSL for Bevaas 20mg resistant hypertension data', (CURRENT_DATE + 5), 'pending', NOW() - INTERVAL '3 days'),
(50, 'mr_robert_003', 'Dr. Rao', 'Follow up on Bevaas 20mg combination therapy results — doctor evaluating efficacy', (CURRENT_DATE + 1), 'pending', NOW() - INTERVAL '4 days'),
(NULL, 'mr_robert_003', 'Dr. Thomas', 'Deliver Rilast Syrup samples for paediatric ward trial', (CURRENT_DATE + 4), 'pending', NOW() - INTERVAL '2 days'),

-- Overdue tasks
(51, 'mr_robert_003', 'Dr. Rao', 'Submit adverse event follow-up form for Derise 50mg patient', (CURRENT_DATE - 3), 'overdue', NOW() - INTERVAL '10 days'),
(47, 'mr_robert_003', 'Dr. Kumar', 'Provide updated Rilast Capsule prescribing information leaflet', (CURRENT_DATE - 5), 'overdue', NOW() - INTERVAL '12 days'),

-- Completed tasks
(45, 'mr_robert_003', 'Dr. Reddy', 'Shared Derise 20mg dosage escalation guidelines', (CURRENT_DATE - 7), 'completed', NOW() - INTERVAL '14 days'),
(49, 'mr_robert_003', 'Dr. Mehta', 'Delivered Bevaas 10mg patient education materials', (CURRENT_DATE - 10), 'completed', NOW() - INTERVAL '15 days'),
(53, 'mr_robert_003', 'Dr. Thomas', 'Submitted Rilast Tablet sample request to warehouse', (CURRENT_DATE - 8), 'completed', NOW() - INTERVAL '16 days');

-- Rahul's tasks (mr_rahul_001)
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
(NULL, 'mr_rahul_001', 'Dr. Kapoor', 'Share ARIA trial data for Derise 10mg — doctor wants evidence for allergy OPD', (CURRENT_DATE + 2), 'pending', NOW() - INTERVAL '1 day'),
(NULL, 'mr_rahul_001', 'Dr. Nair', 'Deliver Rilast Capsule samples for chronic asthma ward', (CURRENT_DATE + 4), 'pending', NOW() - INTERVAL '3 days'),
(NULL, 'mr_rahul_001', 'Dr. Sinha', 'Send Bevaas clinical trial summary to doctor', (CURRENT_DATE - 2), 'overdue', NOW() - INTERVAL '8 days'),
(NULL, 'mr_rahul_001', 'Dr. Kulkarni', 'Completed Derise 50mg safety data presentation', (CURRENT_DATE - 6), 'completed', NOW() - INTERVAL '12 days'),
(NULL, 'mr_rahul_001', 'Dr. Patil', 'Arrange CME session on resistant hypertension management', (CURRENT_DATE + 7), 'pending', NOW() - INTERVAL '2 days');

-- Priya's tasks (mr_priya_002)
INSERT INTO follow_up_tasks (dcr_id, user_id, doctor_name, task, due_date, status, created_at) VALUES
(NULL, 'mr_priya_002', 'Dr. Shah', 'Follow up on Derise 20mg patient compliance feedback', (CURRENT_DATE + 1), 'pending', NOW() - INTERVAL '2 days'),
(NULL, 'mr_priya_002', 'Dr. Desai', 'Send Bevaas ASCOT trial summary for cardiology discussion', (CURRENT_DATE + 3), 'pending', NOW() - INTERVAL '1 day'),
(NULL, 'mr_priya_002', 'Dr. Joshi', 'Share Rilast Syrup paediatric dosing chart', (CURRENT_DATE - 1), 'overdue', NOW() - INTERVAL '7 days'),
(NULL, 'mr_priya_002', 'Dr. Kulkarni', 'Delivered Derise 50mg prescribing info to clinic', (CURRENT_DATE - 5), 'completed', NOW() - INTERVAL '10 days');

-- ============================================================================
-- ADVERSE EVENTS
-- ============================================================================

-- Pending adverse events (need review)
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at) VALUES
(48, 'mr_robert_003', 'Dr. Mehta', 'Bevaas 10mg',
 ARRAY['peripheral edema', 'ankle swelling'],
 'mild',
 '{"age": "67", "gender": "male", "condition": "essential hypertension", "duration_on_drug": "3 weeks"}'::jsonb,
 'Swelling noticed after 2 weeks of starting Bevaas 10mg. No pain, mild discomfort.',
 'pending', NOW() - INTERVAL '3 days'),

(50, 'mr_robert_003', 'Dr. Rao', 'Bevaas 20mg',
 ARRAY['dizziness', 'fatigue', 'hypotension'],
 'moderate',
 '{"age": "72", "gender": "female", "condition": "resistant hypertension", "duration_on_drug": "1 week", "concomitant_drugs": "ramipril 5mg"}'::jsonb,
 'Patient experienced dizziness on standing after dose increase from 10mg to 20mg. BP dropped to 95/60.',
 'pending', NOW() - INTERVAL '2 days'),

(44, 'mr_robert_003', 'Dr. Reddy', 'Derise 10mg',
 ARRAY['headache', 'dry mouth'],
 'mild',
 '{"age": "34", "gender": "female", "condition": "seasonal allergic rhinitis", "duration_on_drug": "5 days"}'::jsonb,
 'Mild headache in the first 3 days, resolved spontaneously. Persistent dry mouth.',
 'pending', NOW() - INTERVAL '1 day'),

(NULL, 'mr_priya_002', 'Dr. Joshi', 'Rilast Tablet',
 ARRAY['vivid dreams', 'sleep disturbance', 'irritability'],
 'moderate',
 '{"age": "28", "gender": "male", "condition": "chronic asthma", "duration_on_drug": "2 weeks"}'::jsonb,
 'Patient reports vivid nightmares starting 1 week after initiation. Irritability during daytime.',
 'pending', NOW() - INTERVAL '4 days'),

(NULL, 'mr_rahul_001', 'Dr. Sinha', 'Bevaas 5mg',
 ARRAY['flushing', 'palpitations'],
 'mild',
 '{"age": "55", "gender": "male", "condition": "early-stage hypertension", "duration_on_drug": "10 days"}'::jsonb,
 'Facial flushing and occasional palpitations after starting therapy. Symptoms reducing over time.',
 'pending', NOW() - INTERVAL '5 days');

-- Confirmed adverse events
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(51, 'mr_robert_003', 'Dr. Rao', 'Derise 50mg',
 ARRAY['somnolence', 'fatigue', 'impaired concentration'],
 'moderate',
 '{"age": "45", "gender": "male", "condition": "severe allergic dermatitis", "duration_on_drug": "1 week"}'::jsonb,
 'Patient reports excessive drowsiness at 50mg dose despite non-sedating profile. Affects daily work.',
 'confirmed', NOW() - INTERVAL '15 days', 'manager1',
 'Confirmed. Dose-related sedation at 50mg. Recommend dose reduction to 20mg and reassess. Patient should avoid driving until symptoms resolve.',
 NOW() - INTERVAL '13 days'),

(NULL, 'mr_priya_002', 'Dr. Shah', 'Derise 20mg',
 ARRAY['nausea', 'abdominal discomfort'],
 'mild',
 '{"age": "42", "gender": "female", "condition": "chronic urticaria", "duration_on_drug": "3 weeks"}'::jsonb,
 'Mild nausea after taking on empty stomach. Resolved when taken with food.',
 'confirmed', NOW() - INTERVAL '20 days', 'manager1',
 'Confirmed mild GI intolerance. Advise patient to take with food. No dose change needed.',
 NOW() - INTERVAL '18 days');

-- Dismissed adverse event
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(NULL, 'mr_rahul_001', 'Dr. Kapoor', 'Rilast Syrup',
 ARRAY['cough', 'throat irritation'],
 'mild',
 '{"age": "8", "gender": "male", "condition": "paediatric asthma", "duration_on_drug": "4 weeks"}'::jsonb,
 'Parent reports mild cough after syrup administration.',
 'dismissed', NOW() - INTERVAL '25 days', 'manager1',
 'Dismissed. Cough is likely related to underlying asthma condition, not drug-related. Syrup formulation well-tolerated in clinical trials.',
 NOW() - INTERVAL '22 days');

-- Severe adverse event
INSERT INTO adverse_events (dcr_id, user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, status, detected_at, reviewed_by, review_notes, reviewed_at) VALUES
(NULL, 'mr_robert_003', 'Dr. Mehta', 'Bevaas 20mg',
 ARRAY['severe hypotension', 'syncope', 'tachycardia'],
 'severe',
 '{"age": "78", "gender": "female", "condition": "resistant hypertension with aortic stenosis", "duration_on_drug": "3 days", "concomitant_drugs": "enalapril 10mg, hydrochlorothiazide 12.5mg"}'::jsonb,
 'Patient fainted at home on day 3. BP recorded at 80/50. Brought to ER. Triple antihypertensive combination likely contributory.',
 'confirmed', NOW() - INTERVAL '30 days', 'manager1',
 'SERIOUS AE — confirmed. Bevaas 20mg contraindicated with severe aortic stenosis. Triple combination excessive for elderly patient. Reported to pharmacovigilance. Bevaas discontinued, patient stabilized.',
 NOW() - INTERVAL '28 days');

-- ============================================================================
-- UPDATE DCR SUMMARIES FOR VARIETY
-- ============================================================================

-- Make Robert's DCR summaries more varied and realistic
UPDATE dcr SET
  call_summary = 'Detailed Derise 10mg for seasonal allergy patients. Doctor showed strong interest in non-sedating profile. Shared ARIA trial data. Doctor plans to switch 5 patients from cetirizine.',
  doctor_feedback = 'Impressed by drowsiness data. Will trial with morning-shift workers first.'
WHERE id = 44;

UPDATE dcr SET
  call_summary = 'Discussed Rilast Tablet efficacy for chronic asthma add-on therapy. Doctor currently using competitor LTRA. Presented compliance advantage of once-daily evening dosing.',
  doctor_feedback = 'Wants to see head-to-head data vs competitor. Positive about oral route for non-compliant patients.'
WHERE id = 46;

UPDATE dcr SET
  call_summary = 'Follow-up on Bevaas 5mg initiation in elderly hypertensives. Doctor reports 3 out of 5 patients achieved BP goal. Discussed step-up to 10mg for remaining patients.',
  doctor_feedback = 'Good tolerance in elderly. Minimal edema at 5mg. Will step up cautiously.'
WHERE id = 48;

UPDATE dcr SET
  call_summary = 'Reviewed Bevaas 20mg outcomes for resistant hypertension. Doctor using triple combination (Bevaas + ACE-I + diuretic). 4 of 6 patients now at target.',
  doctor_feedback = 'Effective in combination. One patient had syncope episode — needs review. Overall satisfied.'
WHERE id = 50;

UPDATE dcr SET
  call_summary = 'Delivered Rilast Syrup samples to paediatric ward. Discussed dosing for 2-5 age group. Parents of current patients reporting improved nighttime breathing.',
  doctor_feedback = 'Parents very positive. Compliance better than nebulizer. Wants more stock.'
WHERE id = 52;

UPDATE dcr SET
  call_summary = 'Follow-up visit. Derise 20mg working well for moderate allergic rhinitis patients. Doctor now prescribing to 12+ patients regularly.',
  doctor_feedback = 'Once-daily dosing is the key differentiator. Patients prefer it over twice-daily alternatives.'
WHERE id = 45;

UPDATE dcr SET
  call_summary = 'Discussed Rilast Capsule sustained-release advantages. Doctor comparing with tablet formulation for overnight symptom control in asthma patients.',
  doctor_feedback = 'Interested in capsule for patients with early morning wheeze. Requested clinical comparison data.'
WHERE id = 47;

UPDATE dcr SET
  call_summary = 'Reviewed Derise 50mg use in severe allergic dermatitis. One patient reported drowsiness — unusual for desloratadine. Doctor reduced to 20mg.',
  doctor_feedback = 'Concerned about sedation at 50mg. Most patients do well but this case needs AE reporting.'
WHERE id = 51;

UPDATE dcr SET
  call_summary = 'Bevaas 10mg efficacy review. Doctor evaluating BP reduction data across 15 patients. Mean reduction 22 mmHg systolic. One patient switched to 20mg.',
  doctor_feedback = 'Consistent BP reduction. Edema manageable with ACE-I combination. Good option for practice.'
WHERE id = 49;

UPDATE dcr SET
  call_summary = 'Rilast Tablet long-term follow-up. Doctor managing 20+ adult asthma patients on Rilast. Reduction in rescue inhaler use observed across the board.',
  doctor_feedback = 'Satisfied with long-term outcomes. No neuropsychiatric issues reported. Will continue prescribing.'
WHERE id = 53;

-- Update some of Rahul's and Priya's DCRs too
UPDATE dcr SET
  call_summary = 'Presented Derise 10mg non-sedating advantage for allergy OPD. Doctor currently prescribing cetirizine. Highlighted 0.7% vs 3.1% drowsiness rates.',
  doctor_feedback = 'Patients reporting less drowsiness is compelling. Will trial in 10 patients.'
WHERE user_id = 'mr_rahul_001' AND name = 'Dr. Kapoor' AND date = CURRENT_DATE - 2;

UPDATE dcr SET
  call_summary = 'Discussed Bevaas 5mg for newly diagnosed hypertensives in OPD. Doctor treats 30+ hypertension patients monthly. Currently using amlodipine competitor.',
  doctor_feedback = 'Open to switching if pricing is competitive. Wants samples for trial.'
WHERE user_id = 'mr_rahul_001' AND name = 'Dr. Patil' AND date = CURRENT_DATE - 10;

UPDATE dcr SET
  call_summary = 'Derise 20mg follow-up in allergy OPD. Doctor now prescribing to 20+ patients. Compliance at 88% based on refill data. Patients prefer once-daily convenience.',
  doctor_feedback = 'Patients prefer once daily dosing. Best antihistamine compliance I have seen.'
WHERE user_id = 'mr_priya_002' AND name = 'Dr. Shah' AND date = CURRENT_DATE - 1;

UPDATE dcr SET
  call_summary = 'Bevaas 10mg review with cardiologist. Doctor has 40+ patients on Bevaas. Discussed ASCOT trial outcomes. Doctor impressed by 24% CV mortality reduction.',
  doctor_feedback = 'Strong evidence base. Recommending to colleagues in cardiology department.'
WHERE user_id = 'mr_priya_002' AND name = 'Dr. Desai' AND date = CURRENT_DATE - 5;
