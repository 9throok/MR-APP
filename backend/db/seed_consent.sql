-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Consent Records — per-doctor consent history
--
-- Append-only by design: latest row per (doctor_id, channel) by recorded_at
-- is the current state. Demos every channel × every status, includes one
-- doctor with a withdrawn-then-regranted history (depth), and one doctor
-- with a revoked marketing_email that the unconsented_contact compliance
-- finding (in seed_compliance_findings.sql) will reference.
--
-- Run AFTER: migration_v15_compliance.sql + seed_doctors.sql + seed_users.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE consent_records RESTART IDENTITY CASCADE;

INSERT INTO consent_records
  (doctor_id, channel, status, recorded_by, source, notes, effective_from, recorded_at)
VALUES
  -- ── Dr. Anil Mehta (id=1) — clean grant on all 4 channels + history depth on email
  -- Granted everything 18mo ago. Then briefly withdrew email 6mo ago. Re-granted email 4mo ago.
  (1, 'marketing_visit',     'granted', 'mr_rahul_001',   'verbal',
   'Verbal consent during onboarding visit at Lilavati.',
   CURRENT_DATE - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  (1, 'marketing_email',     'granted', 'mr_rahul_001',   'written',
   'Signed marketing-email opt-in form.',
   CURRENT_DATE - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  (1, 'sample_distribution', 'granted', 'mr_rahul_001',   'verbal',
   'OK to leave sample packs at the clinic reception.',
   CURRENT_DATE - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  (1, 'data_processing',     'granted', 'mr_rahul_001',   'digital_signature',
   'E-signed during onboarding via tablet.',
   CURRENT_DATE - INTERVAL '18 months', NOW() - INTERVAL '18 months'),
  -- Briefly withdrew email 6mo ago (too many emails complaint)
  (1, 'marketing_email',     'withdrawn', 'mr_rahul_001', 'verbal',
   'Doctor felt email volume was too high, asked to pause.',
   CURRENT_DATE - INTERVAL '6 months',  NOW() - INTERVAL '6 months'),
  -- Re-granted email 4mo ago after frequency reduction promise
  (1, 'marketing_email',     'granted', 'mr_rahul_001',   'verbal',
   'Re-opted in after we agreed to monthly cadence cap.',
   CURRENT_DATE - INTERVAL '4 months',  NOW() - INTERVAL '4 months'),

  -- ── Dr. Pradeep Joshi (id=3) — REVOKED email (drives unconsented_contact finding)
  (3, 'marketing_visit',     'granted', 'mr_rahul_001',   'verbal',
   'Verbal consent during nephrology rounds.',
   CURRENT_DATE - INTERVAL '14 months', NOW() - INTERVAL '14 months'),
  (3, 'sample_distribution', 'granted', 'mr_rahul_001',   'written',
   'Signed off on sample distribution at Lilavati.',
   CURRENT_DATE - INTERVAL '14 months', NOW() - INTERVAL '14 months'),
  (3, 'marketing_email',     'granted', 'mr_rahul_001',   'verbal',
   'Initial email opt-in.',
   CURRENT_DATE - INTERVAL '14 months', NOW() - INTERVAL '14 months'),
  -- Revoked email recently. The watchdog rule will flag any visit/email after this date.
  (3, 'marketing_email',     'revoked', 'mgr_vikram_001', 'written',
   'Doctor wrote in to formally revoke email opt-in. Cite GDPR-equivalent local rule.',
   CURRENT_DATE - INTERVAL '20 days',   NOW() - INTERVAL '20 days'),

  -- ── Dr. Suresh Kumar (id=10) — clean state, all channels granted
  (10, 'marketing_visit',     'granted', 'mr_robert_003', 'verbal',
   'AIIMS Cardiology HOD. Consents to monthly visits.',
   CURRENT_DATE - INTERVAL '8 months', NOW() - INTERVAL '8 months'),
  (10, 'marketing_email',     'granted', 'mr_robert_003', 'digital_signature',
   'E-signed at advisory board onboarding.',
   CURRENT_DATE - INTERVAL '8 months', NOW() - INTERVAL '8 months'),
  (10, 'sample_distribution', 'granted', 'mr_robert_003', 'written',
   'Approved sample distribution to AIIMS cath lab.',
   CURRENT_DATE - INTERVAL '8 months', NOW() - INTERVAL '8 months'),
  (10, 'data_processing',     'granted', 'mr_robert_003', 'digital_signature',
   'Standard e-sign during AIIMS protocol agreement.',
   CURRENT_DATE - INTERVAL '8 months', NOW() - INTERVAL '8 months'),

  -- ── Dr. Pooja Singh (id=13) — DPDP-style data_processing withdrawal
  (13, 'marketing_visit',     'granted', 'mr_robert_003', 'verbal',
   'Endocrinology rounds at Max Saket.',
   CURRENT_DATE - INTERVAL '11 months', NOW() - INTERVAL '11 months'),
  (13, 'marketing_email',     'granted', 'mr_robert_003', 'written',
   'Email opt-in during Q4 2025 visit.',
   CURRENT_DATE - INTERVAL '11 months', NOW() - INTERVAL '11 months'),
  (13, 'data_processing',     'granted', 'mr_robert_003', 'digital_signature',
   'Initial e-sign for data processing.',
   CURRENT_DATE - INTERVAL '11 months', NOW() - INTERVAL '11 months'),
  -- Recently withdrew (DPDP Act compliance demo)
  (13, 'data_processing',     'withdrawn', 'admin_001',   'written',
   'Formal withdrawal under India DPDP Act. Profile data must be archived.',
   CURRENT_DATE - INTERVAL '8 days',  NOW() - INTERVAL '8 days'),

  -- ── Dr. Rajesh Kapoor (id=6) — Mumbai South, Tier A — visit + email only
  (6, 'marketing_visit',      'granted', 'mr_priya_002', 'verbal',
   'Verbal at Hinduja neurology rounds.',
   CURRENT_DATE - INTERVAL '15 months', NOW() - INTERVAL '15 months'),
  (6, 'marketing_email',      'granted', 'mr_priya_002', 'digital_signature',
   'Speaker bureau onboarding e-sign.',
   CURRENT_DATE - INTERVAL '15 months', NOW() - INTERVAL '15 months'),

  -- ── Dr. Vikram Desai (id=8) — newer doctor, only marketing_visit so far
  (8, 'marketing_visit',      'granted', 'mr_priya_002', 'verbal',
   'Initial consent at Hinduja cardiology.',
   CURRENT_DATE - INTERVAL '5 months',  NOW() - INTERVAL '5 months'),

  -- ── Dr. Neha Sharma (id=11) — Delhi NCR emerging KOL — imported from old CRM
  (11, 'marketing_visit',     'granted', 'mr_robert_003', 'imported',
   'Imported from legacy CRM during 2025 migration.',
   CURRENT_DATE - INTERVAL '7 months',  NOW() - INTERVAL '7 months'),
  (11, 'sample_distribution', 'granted', 'mr_robert_003', 'imported',
   'Imported from legacy CRM.',
   CURRENT_DATE - INTERVAL '7 months',  NOW() - INTERVAL '7 months'),

  -- ── Dr. Kavita Rao (id=4) — Mumbai N — clean grants except recent revoke on visits
  -- (Different from Joshi's revoke — uses 'revoked' on visits, not email.)
  (4, 'marketing_visit',      'granted', 'mr_rahul_001', 'verbal',
   'Initial endocrinology rounds.',
   CURRENT_DATE - INTERVAL '10 months', NOW() - INTERVAL '10 months'),
  (4, 'marketing_email',      'granted', 'mr_rahul_001', 'written',
   'Initial email opt-in.',
   CURRENT_DATE - INTERVAL '10 months', NOW() - INTERVAL '10 months'),
  (4, 'marketing_visit',      'revoked', 'mr_rahul_001', 'verbal',
   'Asked us to pause physical visits — concerned about safety profile of recent product.',
   CURRENT_DATE - INTERVAL '15 days',   NOW() - INTERVAL '15 days');
