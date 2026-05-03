-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Content (Phase B CLM/MLR)
--
-- Creates:
--   - 3 demo MLR reviewers (one per role) so the workflow is testable.
--   - 4 content_assets across 3 products + an in-progress MLR cycle.
--   - 6 content_versions covering all 5 active statuses (draft / in_review /
--     changes_requested / approved / published; retired stays unused for now).
--   - mlr_reviews rows for the in-progress version (medical approved, legal
--     pending, regulatory pending) — this is the "halfway through" demo.
--   - A handful of content_distributions and content_views so analytics
--     queries return non-empty results from the start.
--   - One content_claim row showing both citation states.
--
-- Run AFTER: migration_v13_clm_mlr.sql + seed_users.sql + seed_doctors.sql
--           + dummy_data.sql (products) + seed_knowledge.sql (drug_knowledge)
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE content_views        RESTART IDENTITY CASCADE;
TRUNCATE content_claims       RESTART IDENTITY CASCADE;
TRUNCATE content_distributions RESTART IDENTITY CASCADE;
TRUNCATE mlr_reviews          RESTART IDENTITY CASCADE;
TRUNCATE content_versions     RESTART IDENTITY CASCADE;
TRUNCATE content_assets       RESTART IDENTITY CASCADE;

-- ── 3 MLR reviewers (one per role) ─────────────────────────────────────────
-- bcrypt hash of "password123" (same as the existing seed_users hashes)
INSERT INTO users (username, email, password_hash, role, name, territory, user_id)
VALUES
  ('reviewer_med', 'med.reviewer@zenrac.com',
   '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS',
   'medical_reviewer', 'Dr. Anjali Rao (Medical)', 'HQ', 'rev_med_001'),
  ('reviewer_legal', 'legal.reviewer@zenrac.com',
   '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS',
   'legal_reviewer', 'Sanjay Bhatia (Legal)', 'HQ', 'rev_legal_001'),
  ('reviewer_reg', 'reg.reviewer@zenrac.com',
   '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS',
   'regulatory_reviewer', 'Meera Iyer (Regulatory)', 'HQ', 'rev_reg_001')
ON CONFLICT (org_id, username) DO NOTHING;

-- ── content_assets (4 demo assets) ─────────────────────────────────────────
INSERT INTO content_assets (title, asset_type, product_id, therapeutic_area, description, owner_user_id)
VALUES
  ('Derise 10mg — Allergy Detail Aid',  'detail_aid', 1, 'Allergy/Immunology',
   'Primary detail aid for Derise 10mg, focused on once-daily non-sedating profile.',
   'admin_001'),
  ('Bevaas 5mg — Cardio Slide Deck',     'slide_deck', 7, 'Cardiology',
   'BP reduction efficacy + ASCOT trial CV-outcomes deck.',
   'admin_001'),
  ('Rilast Tablet — KOL Brochure',       'brochure',   4, 'Respiratory',
   'KOL-focused brochure on sustained-release advantage.',
   'admin_001'),
  ('Cross-product fair-balance trainer', 'pdf',        NULL, 'Training',
   'Internal training PDF on fair-balance language for MR onboarding.',
   'admin_001');

-- ── content_versions (6 versions across the 4 assets) ──────────────────────
-- Asset 1: Derise — has v1 PUBLISHED (the live one MRs see) + v2 IN_REVIEW
--          (medical approved, legal/regulatory pending — a halfway-through demo)
INSERT INTO content_versions
  (asset_id, version_number, file_url, mime_type, file_size_bytes, status,
   submitted_by, submitted_at, published_at, change_notes)
VALUES
  (1, 1, '/uploads/content/1/derise-detail-aid-v1.txt',
   'text/plain', 1457280, 'published',
   'admin_001', NOW() - INTERVAL '60 days', NOW() - INTERVAL '45 days',
   'Initial release.'),
  (1, 2, '/uploads/content/1/derise-detail-aid-v2.txt',
   'text/plain', 1620992, 'in_review',
   'admin_001', NOW() - INTERVAL '3 days', NULL,
   'Updated ARIA trial citations + added drowsiness-rate comparison.');

-- Asset 2: Bevaas — has v1 APPROVED (ready to publish but admin hasn't
--          flipped the publish switch yet — common queue state)
INSERT INTO content_versions
  (asset_id, version_number, file_url, mime_type, file_size_bytes, status,
   submitted_by, submitted_at, change_notes)
VALUES
  (2, 1, '/uploads/content/2/bevaas-cardio-deck-v1.pptx',
   'application/vnd.openxmlformats-officedocument.presentationml.presentation',
   3145728, 'approved',
   'admin_001', NOW() - INTERVAL '7 days',
   'Initial release with ASCOT trial slides.');

-- Asset 3: Rilast — has v1 in CHANGES_REQUESTED (regulatory bounced it)
INSERT INTO content_versions
  (asset_id, version_number, file_url, mime_type, file_size_bytes, status,
   submitted_by, submitted_at, change_notes)
VALUES
  (3, 1, '/uploads/content/3/rilast-kol-brochure-v1.txt',
   'text/plain', 982016, 'changes_requested',
   'admin_001', NOW() - INTERVAL '5 days',
   'KOL brochure draft.');

-- Asset 4: Training PDF — has v1 in DRAFT (just uploaded, not submitted yet)
--          + v2 also DRAFT (owner kept iterating without ever submitting)
INSERT INTO content_versions
  (asset_id, version_number, file_url, mime_type, file_size_bytes, status, change_notes)
VALUES
  (4, 1, '/uploads/content/4/fair-balance-trainer-v1.txt',
   'text/plain', 524288, 'draft', 'First cut.'),
  (4, 2, '/uploads/content/4/fair-balance-trainer-v2.txt',
   'text/plain', 612000, 'draft', 'Added more examples.');

-- Set current_version_id on the 1 asset that has a published version (asset 1)
UPDATE content_assets SET current_version_id = 1 WHERE id = 1;

-- ── mlr_reviews ────────────────────────────────────────────────────────────
-- Asset 1, version 2 (in_review): medical APPROVED, legal PENDING, regulatory PENDING
INSERT INTO mlr_reviews
  (version_id, reviewer_role, reviewer_user_id, decision, decision_notes, reviewed_at)
VALUES
  (2, 'medical',    'rev_med_001',   'approved',
   'Citations accurate. ARIA trial reference matches the drug_knowledge entry.',
   NOW() - INTERVAL '1 day'),
  (2, 'legal',      NULL, 'pending',     NULL, NULL),
  (2, 'regulatory', NULL, 'pending',     NULL, NULL);

-- Asset 2, version 1 (approved): all 3 reviewers approved (the "happy path"
-- audit trail behind a clean approval)
INSERT INTO mlr_reviews
  (version_id, reviewer_role, reviewer_user_id, decision, decision_notes, reviewed_at)
VALUES
  (3, 'medical',    'rev_med_001',   'approved', 'Clinically accurate.',     NOW() - INTERVAL '4 days'),
  (3, 'legal',      'rev_legal_001', 'approved', 'No off-label concerns.',   NOW() - INTERVAL '3 days'),
  (3, 'regulatory', 'rev_reg_001',   'approved', 'Compliant with DCGI guidance.', NOW() - INTERVAL '2 days');

-- Asset 3, version 1 (changes_requested): regulatory bounced, others pending
INSERT INTO mlr_reviews
  (version_id, reviewer_role, reviewer_user_id, decision, decision_notes, reviewed_at)
VALUES
  (4, 'medical',    NULL,            'pending', NULL, NULL),
  (4, 'legal',      NULL,            'pending', NULL, NULL),
  (4, 'regulatory', 'rev_reg_001',   'changes_requested',
   'Add fair-balance disclaimer for elderly patients on Rilast.',
   NOW() - INTERVAL '2 days');

-- Asset 1, version 1 (published — historical): all 3 approved long ago
INSERT INTO mlr_reviews
  (version_id, reviewer_role, reviewer_user_id, decision, decision_notes, reviewed_at)
VALUES
  (1, 'medical',    'rev_med_001',   'approved', 'OK.', NOW() - INTERVAL '50 days'),
  (1, 'legal',      'rev_legal_001', 'approved', 'OK.', NOW() - INTERVAL '49 days'),
  (1, 'regulatory', 'rev_reg_001',   'approved', 'OK.', NOW() - INTERVAL '48 days');

-- ── content_distributions ──────────────────────────────────────────────────
-- Asset 1 v1 (the published Derise detail aid) → distributed to all
INSERT INTO content_distributions (version_id, target_type, target_id, distributed_by, distributed_at)
VALUES (1, 'all', NULL, 'admin_001', NOW() - INTERVAL '45 days');

-- Asset 2 v1 (Bevaas — approved but not yet published; pre-distributed to
-- a single MR for early-access piloting before publish)
-- Skip — distributing only published versions is a sensible policy. Leave empty.

-- ── content_views (the MR-side CLM tracker history) ───────────────────────
-- Rahul has shown the Derise detail aid (asset 1 v1) to Dr. Anil Mehta
-- across 3 slides during a recent visit
INSERT INTO content_views
  (version_id, user_id, doctor_id, slide_index, duration_seconds, viewed_at)
VALUES
  (1, 'mr_rahul_001', 1, 0, 8.2,  NOW() - INTERVAL '2 days'),
  (1, 'mr_rahul_001', 1, 1, 14.6, NOW() - INTERVAL '2 days'),
  (1, 'mr_rahul_001', 1, 2, 6.0,  NOW() - INTERVAL '2 days'),
  -- Priya showed the same asset to a different doctor — different durations
  (1, 'mr_priya_002', 6, 0, 12.4, NOW() - INTERVAL '1 day'),
  (1, 'mr_priya_002', 6, 1, 22.0, NOW() - INTERVAL '1 day'),
  (1, 'mr_priya_002', 6, 2, 4.5,  NOW() - INTERVAL '1 day'); -- skipped fast

-- ── content_claims ─────────────────────────────────────────────────────────
-- Asset 1 v2 (in review): AI extracted 3 claims, 2 with citations, 1 needing one.
-- (drug_knowledge IDs come from seed_knowledge.sql — we use 1 as a stand-in.)
INSERT INTO content_claims
  (version_id, claim_text, source_doc_id, reviewer_status, extracted_by)
VALUES
  (2, '38% reduction in Total Symptom Score (TSS) vs placebo at 4 weeks.',
   1, 'auto', 'ai'),
  (2, 'Drowsiness incidence: 0.7% with Derise vs 3.1% with cetirizine.',
   1, 'auto', 'ai'),
  (2, 'Once-daily dosing improves compliance by 22%.',
   NULL, 'needs_citation', 'ai');
