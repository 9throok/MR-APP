-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Regulatory Documents
--
-- 6 documents covering 6 of the 7 doc_type values + 7 versions. Includes
-- one MoH approval expiring in 50 days to trigger the "Expiring within 60
-- days" banner on the Regulatory Docs page — important demo moment.
--
-- Pairs with backend/scripts/seed_regulatory_files.js, which writes the
-- placeholder PDFs/TXTs that the file_url values point to. Run that helper
-- BEFORE this seed so the "Open" link in RegulatoryDocs.tsx works.
--
-- Run AFTER:
--   1. node backend/scripts/seed_regulatory_files.js
--   2. migration_v15_compliance.sql
--   3. seed_users.sql, dummy_data.sql (products)
-- ─────────────────────────────────────────────────────────────────────────────

-- Order matters: drop versions first (FK back to documents), then documents.
TRUNCATE regulatory_document_versions RESTART IDENTITY CASCADE;
-- regulatory_documents has a deferrable FK to versions; null current_version_id
-- before truncate to avoid FK chatter.
UPDATE regulatory_documents SET current_version_id = NULL;
TRUNCATE regulatory_documents RESTART IDENTITY CASCADE;

-- ── Documents (6 rows). current_version_id is set in a follow-up UPDATE ────
INSERT INTO regulatory_documents
  (title, doc_type, product_id, jurisdiction, description, current_version_id, owner_user_id)
VALUES
  -- 1: Derise India label — has 2 versions (v1 superseded, v2 active)
  ('Derise — India Prescribing Information', 'drug_label',
   1, 'IN',
   'Approved India prescribing information for Derise (10mg/20mg/50mg). Updated v2 includes post-MI indication and renal-dose-adjustment guidance.',
   NULL, 'admin_001'),

  -- 2: Bevaas IFU — 1 active version
  ('Bevaas — Instructions for Use', 'ifu',
   7, 'IN',
   'Patient-facing IFU for Bevaas 5mg/10mg. Includes administration, storage, and special-population guidance.',
   NULL, 'admin_001'),

  -- 3: MoH approval — expires SOON (drives the demo banner)
  ('MoH Approval Letter — Derise IN-DRG-2024-0184', 'moh_approval',
   1, 'IN',
   'CDSCO marketing authorisation. Renewal due — expiring in ~50 days.',
   NULL, 'admin_001'),

  -- 4: Safety communication
  ('Bevaas Safety Communication — Q1 2026', 'safety_communication',
   7, 'IN',
   'Updated hepatotoxicity signal under post-marketing surveillance. Distributed to all field reps Q1 2026.',
   NULL, 'mgr_vikram_001'),

  -- 5: SOP (cross-product)
  ('SOP — Detailing Aid Versioning', 'sop',
   NULL, 'global',
   'Internal SOP defining the MLR review + version-control workflow for marketing assets.',
   NULL, 'admin_001'),

  -- 6: Training material (cross-product)
  ('Field Rep Training — Fair Balance Compliance 2026', 'training_material',
   NULL, 'IN',
   '2026 edition of the fair-balance compliance training. Required reading for all field reps and managers.',
   NULL, 'mgr_vikram_001');

-- ── Versions (7 rows) ──────────────────────────────────────────────────────
INSERT INTO regulatory_document_versions
  (document_id, version_number, file_url, mime_type, file_size_bytes,
   effective_date, expiry_date, status, uploaded_by, change_notes)
VALUES
  -- doc 1, v1 superseded (expired 4mo ago)
  (1, 1,
   '/uploads/regulatory/1/1700000000000-derise-india-label-v1.pdf',
   'application/pdf', 612,
   CURRENT_DATE - INTERVAL '24 months', CURRENT_DATE - INTERVAL '4 months',
   'superseded', 'admin_001', 'Initial Indian label.'),

  -- doc 1, v2 active (expires in 14mo)
  (1, 2,
   '/uploads/regulatory/1/1750000000000-derise-india-label-v2.pdf',
   'application/pdf', 998,
   CURRENT_DATE - INTERVAL '4 months', CURRENT_DATE + INTERVAL '14 months',
   'active', 'admin_001',
   'Added post-MI LV dysfunction indication. Added CrCl-tiered renal dose adjustment table. Reformatted contraindications.'),

  -- doc 2, v1 active (expires in 8mo)
  (2, 1,
   '/uploads/regulatory/2/1720000000000-bevaas-ifu.pdf',
   'application/pdf', 568,
   CURRENT_DATE - INTERVAL '8 months', CURRENT_DATE + INTERVAL '8 months',
   'active', 'admin_001', 'Initial IFU.'),

  -- doc 3, v1 active — EXPIRES IN 50 DAYS (banner trigger)
  (3, 1,
   '/uploads/regulatory/3/1700000000111-moh-approval-derise-2024.pdf',
   'application/pdf', 715,
   CURRENT_DATE - INTERVAL '11 months', CURRENT_DATE + INTERVAL '50 days',
   'active', 'admin_001', 'Initial CDSCO marketing authorisation. Renewal pending.'),

  -- doc 4, v1 active (no expiry)
  (4, 1,
   '/uploads/regulatory/4/1735000000000-safety-comm-bevaas-2026q1.pdf',
   'application/pdf', 798,
   CURRENT_DATE - INTERVAL '3 months', NULL,
   'active', 'mgr_vikram_001', 'Initial Q1 2026 safety communication.'),

  -- doc 5, v1 active (no expiry — internal SOP)
  (5, 1,
   '/uploads/regulatory/5/1715000000000-sop-detailing-aid-versioning.txt',
   'text/plain', 712,
   CURRENT_DATE - INTERVAL '6 months', NULL,
   'active', 'admin_001', 'Initial v1.0 of the detailing-aid versioning SOP.'),

  -- doc 6, v1 active (expires in 12 months — annual training refresh)
  (6, 1,
   '/uploads/regulatory/6/1718000000000-training-fair-balance-2026.pdf',
   'application/pdf', 685,
   CURRENT_DATE - INTERVAL '5 months', CURRENT_DATE + INTERVAL '12 months',
   'active', 'mgr_vikram_001', '2026 annual training refresh.');

-- ── Set current_version_id on each document to the active version ──────────
-- Deferrable FK pattern: documents and versions both exist now, so we can
-- close the loop. doc 1 points to v2 (the active one); the rest point to v1.
UPDATE regulatory_documents SET current_version_id = 2 WHERE id = 1;
UPDATE regulatory_documents SET current_version_id = 3 WHERE id = 2;
UPDATE regulatory_documents SET current_version_id = 4 WHERE id = 3;
UPDATE regulatory_documents SET current_version_id = 5 WHERE id = 4;
UPDATE regulatory_documents SET current_version_id = 6 WHERE id = 5;
UPDATE regulatory_documents SET current_version_id = 7 WHERE id = 6;
