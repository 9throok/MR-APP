-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Institutions + HCP Affiliations
--
-- Lays the HCP Master Data foundation. 10 institutions across all 6 type
-- discriminators + 17 affiliation rows wiring the 14 doctors to 1-2 sites
-- each. Demonstrates: type variety, multi-affiliation, primary-flag uniqueness,
-- and a closed (historical) affiliation row for the history view.
--
-- Run AFTER: migration_v16_hcp_master.sql + seed_doctors.sql + seed_users.sql
--
-- IDs are deterministic because of TRUNCATE … RESTART IDENTITY. Downstream
-- seeds (engagements, audit_log) reference institutions by id.
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE hcp_affiliations RESTART IDENTITY CASCADE;
TRUNCATE institutions RESTART IDENTITY CASCADE;

-- ── Institutions (10 rows covering all 6 type values) ──────────────────────
INSERT INTO institutions
  (name, institution_type, bed_count, city, state, country, pincode, address, phone, website, tier, territory, notes, created_by)
VALUES
  -- 1: Mumbai North flagship private hospital
  ('Lilavati Hospital & Research Centre', 'hospital_private', 332, 'Mumbai', 'Maharashtra', 'IN', '400050',
   'A-791, Bandra Reclamation, Bandra West, Mumbai', '+91-22-26568000',
   'https://www.lilavatihospital.com', 'A', 'Mumbai North',
   'Tier-A flagship hospital. 30+ specialty departments. Heavy cardiology + oncology focus.', 'admin_001'),

  -- 2: Mumbai North large multispecialty
  ('Kokilaben Dhirubhai Ambani Hospital', 'hospital_private', 750, 'Mumbai', 'Maharashtra', 'IN', '400053',
   'Rao Saheb Achutrao Patwardhan Marg, Four Bunglows, Andheri West, Mumbai', '+91-22-30999999',
   'https://www.kokilabenhospital.com', 'A', 'Mumbai North',
   'Largest private hospital in Mumbai North. Strong neurology and cardiac surgery programs.', 'admin_001'),

  -- 3: Mumbai South flagship
  ('P. D. Hinduja Hospital', 'hospital_private', 375, 'Mumbai', 'Maharashtra', 'IN', '400016',
   'Veer Savarkar Marg, Mahim, Mumbai', '+91-22-24452222',
   'https://www.hindujahospital.com', 'A', 'Mumbai South',
   'Tier-A. Renowned nephrology and endocrinology departments.', 'admin_001'),

  -- 4: Mumbai South premium
  ('Breach Candy Hospital Trust', 'hospital_private', 200, 'Mumbai', 'Maharashtra', 'IN', '400026',
   '60-A, Bhulabhai Desai Road, Breach Candy, Mumbai', '+91-22-23667788',
   'https://www.breachcandyhospital.org', 'A', 'Mumbai South',
   'High-net-worth clientele. Strong internal medicine and cardiology coverage.', 'admin_001'),

  -- 5: Mumbai South large public teaching hospital
  ('Seth GS Medical College & KEM Hospital', 'hospital_public', 1800, 'Mumbai', 'Maharashtra', 'IN', '400012',
   'Acharya Donde Marg, Parel, Mumbai', '+91-22-24107000',
   'https://www.kem.edu', 'B', 'Mumbai South',
   'Major public teaching hospital. High volume, lower per-MR ROI but strong KOL pipeline.', 'admin_001'),

  -- 6: Delhi NCR flagship public
  ('All India Institute of Medical Sciences (AIIMS)', 'hospital_public', 2478, 'New Delhi', 'Delhi', 'IN', '110029',
   'Ansari Nagar East, New Delhi', '+91-11-26588500',
   'https://www.aiims.edu', 'A', 'Delhi NCR',
   'India''s premier teaching hospital. Cardiology and endocrinology departments are top-tier KOL targets.', 'admin_001'),

  -- 7: Delhi NCR private flagship
  ('Max Super Speciality Hospital — Saket', 'hospital_private', 530, 'New Delhi', 'Delhi', 'IN', '110017',
   '1, 2, Press Enclave Road, Saket, New Delhi', '+91-11-26515050',
   'https://www.maxhealthcare.in', 'A', 'Delhi NCR',
   'Tier-A private hospital. Strong neurology and cardiac sciences departments.', 'admin_001'),

  -- 8: Delhi NCR diagnostic
  ('Apollo Diagnostics — Greater Kailash', 'diagnostic_center', NULL, 'New Delhi', 'Delhi', 'IN', '110048',
   'M-Block Market, Greater Kailash II, New Delhi', '+91-11-49999000',
   'https://www.apollodiagnostics.in', 'B', 'Delhi NCR',
   'Pathology + imaging center. Useful for sample-distribution agreements.', 'admin_001'),

  -- 9: Mumbai North private clinic
  ('Heart & Mind Clinic — Bandra', 'clinic', NULL, 'Mumbai', 'Maharashtra', 'IN', '400050',
   'Linking Road, Bandra West, Mumbai', '+91-22-26405566',
   NULL, 'C', 'Mumbai North',
   'Single-specialty cardiology clinic. Run by a Tier-3 KOL.', 'admin_001'),

  -- 10: Delhi NCR nursing home
  ('Sunrise Nursing Home', 'nursing_home', 45, 'New Delhi', 'Delhi', 'IN', '110024',
   'Lajpat Nagar III, New Delhi', '+91-11-29830055',
   NULL, 'B', 'Delhi NCR',
   'Mid-tier nursing home. Internal medicine focus.', 'admin_001');

-- ── HCP Affiliations (17 rows — 14 primary + 3 visiting + 1 closed history) ─
-- Convention: each doctor gets exactly ONE row with is_primary=TRUE.
-- Doctor IDs match seed_doctors.sql (1-14). Effective dates are relative.

INSERT INTO hcp_affiliations
  (doctor_id, institution_id, role, department, is_primary, effective_from, effective_until, notes, created_by)
VALUES
  -- Mumbai North doctors (1-5)
  (1, 1, 'consultant',     'Cardiology',                TRUE,  CURRENT_DATE - INTERVAL '24 months', NULL, 'Senior interventional cardiologist. KOL.', 'admin_001'),
  (1, 9, 'visiting',       'Cardiology OPD',            FALSE, CURRENT_DATE - INTERVAL '8 months',  NULL, 'Weekly OPD on Tuesdays at the Bandra clinic.', 'admin_001'),
  (2, 1, 'OPD consultant', 'Internal Medicine',         TRUE,  CURRENT_DATE - INTERVAL '14 months', NULL, NULL, 'admin_001'),
  (3, 1, 'HOD',            'Nephrology',                TRUE,  CURRENT_DATE - INTERVAL '36 months', NULL, 'Department head. Frequent advisory board participant.', 'admin_001'),
  (4, 2, 'consultant',     'Endocrinology',             TRUE,  CURRENT_DATE - INTERVAL '11 months', NULL, NULL, 'admin_001'),
  (5, 9, 'consultant',     'Dermatology',               TRUE,  CURRENT_DATE - INTERVAL '7 months',  NULL, 'Solo private practice attached to the Bandra clinic.', 'admin_001'),

  -- Mumbai South doctors (6-9)
  (6, 4, 'consultant',     'Neurology',                 TRUE,  CURRENT_DATE - INTERVAL '18 months', NULL, 'Speaker on movement disorders.', 'admin_001'),
  (6, 5, 'visiting',       'Neurology Teaching Service', FALSE, CURRENT_DATE - INTERVAL '6 months',  NULL, 'Joint-appointment teaching at KEM.', 'admin_001'),
  (7, 3, 'consultant',     'Internal Medicine',         TRUE,  CURRENT_DATE - INTERVAL '20 months', NULL, NULL, 'admin_001'),
  (8, 3, 'consultant',     'Cardiology',                TRUE,  CURRENT_DATE - INTERVAL '13 months', NULL, 'Emerging KOL.', 'admin_001'),
  (9, 5, 'attending',      'General Medicine OPD',      TRUE,  CURRENT_DATE - INTERVAL '9 months',  NULL, NULL, 'admin_001'),

  -- Delhi NCR doctors (10-14)
  (10, 6, 'HOD',           'Cardiology',                TRUE,  CURRENT_DATE - INTERVAL '48 months', NULL, 'AIIMS Cardiology HOD. Top national KOL.', 'admin_001'),
  (10, 7, 'visiting',      'Cardiology Cath Lab',       FALSE, CURRENT_DATE - INTERVAL '24 months', NULL, 'Saturdays at Max Saket cath lab.', 'admin_001'),
  (11, 7, 'consultant',    'Neurology',                 TRUE,  CURRENT_DATE - INTERVAL '15 months', NULL, NULL, 'admin_001'),
  (12, 6, 'OPD consultant', 'General Medicine',         TRUE,  CURRENT_DATE - INTERVAL '10 months', NULL, NULL, 'admin_001'),
  (13, 7, 'consultant',    'Endocrinology',             TRUE,  CURRENT_DATE - INTERVAL '16 months', NULL, NULL, 'admin_001'),

  -- Closed historical affiliation: Dr. Rakesh Mishra previously at Sunrise, now primary at AIIMS.
  -- Demonstrates the history view (effective_until set means this is no longer active).
  (14, 10, 'attending',    'Internal Medicine',         FALSE, CURRENT_DATE - INTERVAL '30 months', CURRENT_DATE - INTERVAL '4 months',
   'Moved to AIIMS in early 2026 — see active row.', 'admin_001'),
  (14, 6, 'consultant',    'Internal Medicine',         TRUE,  CURRENT_DATE - INTERVAL '4 months',  NULL, 'Recent transfer.', 'admin_001');
