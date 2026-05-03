-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Audit Log
--
-- 30+ historical entries spread across the last 30 days. Each row references
-- a real row in the source table (DCR / MLR review / consent / regdoc /
-- compliance / expense / tour plan / KOL / medical query / engagement).
-- before_data and after_data are realistic JSONB snapshots; route_path,
-- http_method, and ip_address mimic real Express requests.
--
-- Mix of actor_user_id values:
--   - mgr_vikram_001 — most reviews / approvals
--   - admin_001 — system-level changes (regdoc upload, KOL upgrades)
--   - mr_rahul_001 / mr_priya_002 / mr_robert_003 — DCR creates
--   - rev_med_001 — medical query reviewer activity
--
-- occurred_at distributed `NOW() - INTERVAL '30 days'` to `NOW() - INTERVAL '1 hour'`.
--
-- Run AFTER:
--   - migration_v15_compliance.sql
--   - all the other Phase B/C seeds (so referenced row ids exist)
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE audit_log RESTART IDENTITY CASCADE;

INSERT INTO audit_log
  (actor_user_id, actor_role, table_name, row_id, action, before_data, after_data,
   route_path, http_method, ip_address, reason, occurred_at)
VALUES
  -- ── DCR creates (8 rows, recent activity)
  ('mr_rahul_001', 'mr', 'dcr', '1', 'CREATE', NULL,
   '{"id":"1","user_id":"mr_rahul_001","name":"Dr. Anil Mehta","product":"Derise 10mg","date":"2026-04-29"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.41', NULL, NOW() - INTERVAL '2 days'),

  ('mr_rahul_001', 'mr', 'dcr', '2', 'CREATE', NULL,
   '{"id":"2","user_id":"mr_rahul_001","name":"Dr. Anil Mehta","product":"Derise 20mg","date":"2026-04-13"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.41', NULL, NOW() - INTERVAL '18 days'),

  ('mr_rahul_001', 'mr', 'dcr', '5', 'CREATE', NULL,
   '{"id":"5","user_id":"mr_rahul_001","name":"Dr. Pradeep Joshi","product":"Bevaas 5mg","date":"2026-04-13"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.41', NULL, NOW() - INTERVAL '17 days'),

  ('mr_priya_002', 'mr', 'dcr', '11', 'CREATE', NULL,
   '{"id":"11","user_id":"mr_priya_002","name":"Dr. Meena Shah","product":"Derise 20mg","date":"2026-04-30"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.78', NULL, NOW() - INTERVAL '1 day'),

  ('mr_priya_002', 'mr', 'dcr', '13', 'CREATE', NULL,
   '{"id":"13","user_id":"mr_priya_002","name":"Dr. Vikram Desai","product":"Rilast Tablet","date":"2026-04-06"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.78', NULL, NOW() - INTERVAL '25 days'),

  ('mr_robert_003', 'mr', 'dcr', '21', 'CREATE', NULL,
   '{"id":"21","user_id":"mr_robert_003","name":"Dr. Suresh Kumar","product":"Derise 50mg","date":"2026-04-25"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.99', NULL, NOW() - INTERVAL '6 days'),

  ('mr_robert_003', 'mr', 'dcr', '22', 'CREATE', NULL,
   '{"id":"22","user_id":"mr_robert_003","name":"Dr. Pooja Singh","product":"Bevaas 10mg","date":"2026-04-20"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.99', NULL, NOW() - INTERVAL '11 days'),

  ('mr_rahul_001', 'mr', 'dcr', '7', 'CREATE', NULL,
   '{"id":"7","user_id":"mr_rahul_001","name":"Dr. Kavita Rao","product":"Derise 50mg","date":"2026-04-09"}'::jsonb,
   '/api/dcr', 'POST', '203.0.113.41', NULL, NOW() - INTERVAL '22 days'),

  -- ── MLR review decisions (4 updates)
  ('rev_med_001', 'medical_reviewer', 'mlr_reviews', '4', 'UPDATE',
   '{"decision":"pending","decision_notes":null}'::jsonb,
   '{"decision":"approved","decision_notes":"Medical claims supported by Phase III evidence."}'::jsonb,
   '/api/mlr/reviews/4', 'PATCH', '203.0.113.21', 'Medical review approved', NOW() - INTERVAL '5 days'),

  ('rev_legal_001', 'legal_reviewer', 'mlr_reviews', '5', 'UPDATE',
   '{"decision":"pending","decision_notes":null}'::jsonb,
   '{"decision":"approved","decision_notes":"No off-label or unsubstantiated claim risk."}'::jsonb,
   '/api/mlr/reviews/5', 'PATCH', '203.0.113.22', 'Legal review approved', NOW() - INTERVAL '4 days'),

  ('rev_reg_001', 'regulatory_reviewer', 'mlr_reviews', '9', 'UPDATE',
   '{"decision":"pending","decision_notes":null}'::jsonb,
   '{"decision":"changes_requested","decision_notes":"Slide 4 implies superiority without head-to-head data. Remove or add citation."}'::jsonb,
   '/api/mlr/reviews/9', 'PATCH', '203.0.113.23',
   'Regulatory flagged unsubstantiated comparison claim', NOW() - INTERVAL '3 days'),

  ('rev_reg_001', 'regulatory_reviewer', 'mlr_reviews', '6', 'UPDATE',
   '{"decision":"pending","decision_notes":null}'::jsonb,
   '{"decision":"approved","decision_notes":"Cleared for publication."}'::jsonb,
   '/api/mlr/reviews/6', 'PATCH', '203.0.113.23', 'Regulatory cleared', NOW() - INTERVAL '8 days'),

  -- ── Consent record creates (3 rows)
  ('mr_rahul_001', 'mr', 'consent_records', '5', 'CREATE', NULL,
   '{"doctor_id":1,"channel":"marketing_email","status":"withdrawn"}'::jsonb,
   '/api/consent', 'POST', '203.0.113.41',
   'Consent withdrawn (volume complaint)', NOW() - INTERVAL '6 months'),

  ('mr_rahul_001', 'mr', 'consent_records', '6', 'CREATE', NULL,
   '{"doctor_id":1,"channel":"marketing_email","status":"granted"}'::jsonb,
   '/api/consent', 'POST', '203.0.113.41',
   'Consent re-granted after frequency cap commitment', NOW() - INTERVAL '4 months'),

  ('mgr_vikram_001', 'manager', 'consent_records', '10', 'CREATE', NULL,
   '{"doctor_id":3,"channel":"marketing_email","status":"revoked"}'::jsonb,
   '/api/consent', 'POST', '203.0.113.5',
   'Doctor wrote in to revoke email opt-in', NOW() - INTERVAL '20 days'),

  -- ── Regulatory document upload + version bump (3 rows)
  ('admin_001', 'admin', 'regulatory_documents', '1', 'CREATE', NULL,
   '{"id":1,"title":"Derise — India Prescribing Information","doc_type":"drug_label"}'::jsonb,
   '/api/regulatory-documents', 'POST', '203.0.113.2',
   'Initial drug-label upload', NOW() - INTERVAL '24 months'),

  ('admin_001', 'admin', 'regulatory_documents', '1', 'UPDATE',
   '{"current_version_id":1}'::jsonb,
   '{"current_version_id":2,"reason":"v2 supersedes v1; v1 status set to superseded"}'::jsonb,
   '/api/regulatory-documents/1/versions', 'POST', '203.0.113.2',
   'Uploaded v2 — adds post-MI indication and CrCl-tiered renal dosing', NOW() - INTERVAL '4 months'),

  ('admin_001', 'admin', 'regulatory_documents', '4', 'CREATE', NULL,
   '{"id":4,"title":"Bevaas Safety Communication — Q1 2026","doc_type":"safety_communication"}'::jsonb,
   '/api/regulatory-documents', 'POST', '203.0.113.2',
   'Distributed Q1 2026 safety bulletin', NOW() - INTERVAL '3 months'),

  -- ── Compliance finding decisions (2 updates)
  ('mgr_vikram_001', 'manager', 'compliance_findings', '2', 'UPDATE',
   '{"status":"open","review_notes":null}'::jsonb,
   '{"status":"acknowledged","review_notes":"Coached on the call. Will close once training material is updated."}'::jsonb,
   '/api/compliance/findings/2', 'PATCH', '203.0.113.5',
   'Acknowledged off-label finding', NOW() - INTERVAL '6 days'),

  ('mgr_vikram_001', 'manager', 'compliance_findings', '7', 'UPDATE',
   '{"status":"open","review_notes":null}'::jsonb,
   '{"status":"escalated","review_notes":"Forwarded to legal review. Pending."}'::jsonb,
   '/api/compliance/findings/7', 'PATCH', '203.0.113.5',
   'Escalated comparative-claim finding to legal', NOW() - INTERVAL '5 days'),

  -- ── Expense claim reviews (3 updates)
  ('mgr_vikram_001', 'manager', 'expense_claims', '1', 'UPDATE',
   '{"status":"submitted"}'::jsonb,
   '{"status":"approved","reviewed_by":"mgr_vikram_001","review_notes":"Approved. All receipts in order."}'::jsonb,
   '/api/expenses/1/review', 'PATCH', '203.0.113.5', 'Approved Mar expenses', NOW() - INTERVAL '8 days'),

  ('mgr_vikram_001', 'manager', 'expense_claims', '2', 'UPDATE',
   '{"status":"draft"}'::jsonb,
   '{"status":"submitted"}'::jsonb,
   '/api/expenses/2/submit', 'POST', '203.0.113.78', 'Priya submitted Apr expenses', NOW() - INTERVAL '4 days'),

  ('mgr_vikram_001', 'manager', 'expense_claims', '3', 'UPDATE',
   '{"status":"draft"}'::jsonb,
   '{"status":"submitted"}'::jsonb,
   '/api/expenses/3/submit', 'POST', '203.0.113.99', 'Robert submitted Apr expenses', NOW() - INTERVAL '2 days'),

  -- ── Tour plan reviews (2 updates)
  ('mgr_vikram_001', 'manager', 'tour_plans', '1', 'UPDATE',
   '{"status":"submitted"}'::jsonb,
   '{"status":"approved","review_notes":"Good Tier-A coverage focus."}'::jsonb,
   '/api/tour-plans/1/review', 'PATCH', '203.0.113.5', 'Approved Rahul tour plan', NOW() - INTERVAL '1 day'),

  ('mgr_vikram_001', 'manager', 'tour_plans', '2', 'UPDATE',
   '{"status":"draft"}'::jsonb,
   '{"status":"submitted"}'::jsonb,
   '/api/tour-plans/2/submit', 'POST', '203.0.113.78', 'Priya submitted', NOW() - INTERVAL '4 hours'),

  -- ── KOL classifications (2 creates)
  ('mgr_vikram_001', 'manager', 'kol_profiles', '6', 'CREATE', NULL,
   '{"doctor_id":8,"kol_tier":"T3","influence_score":52.00,"identified_by":"ai"}'::jsonb,
   '/api/kols/identify/8', 'PATCH', '203.0.113.5',
   'AI suggestion confirmed for Dr. Vikram Desai (T3)', NOW() - INTERVAL '60 days'),

  ('mgr_vikram_001', 'manager', 'kol_profiles', '7', 'CREATE', NULL,
   '{"doctor_id":11,"kol_tier":"emerging","influence_score":45.00,"identified_by":"ai"}'::jsonb,
   '/api/kols/identify/11', 'PATCH', '203.0.113.5',
   'AI suggestion confirmed for Dr. Neha Sharma (emerging)', NOW() - INTERVAL '30 days'),

  -- ── Medical query reviewer claim
  ('rev_med_001', 'medical_reviewer', 'medical_queries', '4', 'UPDATE',
   '{"status":"open","reviewer_user_id":null}'::jsonb,
   '{"status":"in_review","reviewer_user_id":"rev_med_001"}'::jsonb,
   '/api/medical-queries/4', 'PATCH', '203.0.113.21',
   'Medical reviewer claimed off-label query', NOW() - INTERVAL '2 days'),

  -- ── Engagement attendee add
  ('mgr_vikram_001', 'manager', 'engagement_attendees', '1', 'CREATE', NULL,
   '{"engagement_id":1,"doctor_id":1,"attendee_role":"chair","honorarium_amt":75000.00}'::jsonb,
   '/api/medical-engagements/1/attendees', 'POST', '203.0.113.5',
   'Added Dr. Anil Mehta as chair of upcoming AB', NOW() - INTERVAL '7 days');
