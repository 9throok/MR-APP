-- ─────────────────────────────────────────────────────────────────────────────
-- Seed KOL Profiles
--
-- 8 KOLs across all 4 tiers (T1/T2/T3/emerging), both identified_by values
-- (human/ai), sentiment range -2..+2, mix of advisory_board / speaker_bureau
-- flags. Each row includes realistic AI-style sentiment_evidence and notes
-- (the kind of prose the KOL Identifier prompt would output) so the demo
-- looks fully populated without needing a live LLM call.
--
-- Cross-references:
--   - KOLs in seed_medical_engagements.sql attendee rows get their
--     last_engagement_at / last_engagement_type stamped here to match.
--   - Doctor IDs map to seed_doctors.sql (1-14).
--
-- Run AFTER: migration_v17_medical_affairs.sql + seed_doctors.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE kol_profiles RESTART IDENTITY CASCADE;

INSERT INTO kol_profiles
  (doctor_id, kol_tier, influence_score, advisory_board_member, speaker_bureau, publication_count,
   sentiment_score, sentiment_evidence, last_engagement_at, last_engagement_type,
   identified_by, identified_at, notes, created_by)
VALUES
  -- ── Dr. Anil Mehta (id=1, Cardiology, Mumbai N) — T1 flagship KOL ──────
  (1, 'T1', 88.00, TRUE, TRUE, 14,
   2,
   'Routinely cites our Phase III Derise data in conferences. Co-authored the 2025 ICC consensus statement on combination therapy with positive references to our drug class.',
   NOW() - INTERVAL '21 days', 'roundtable',
   'human', NOW() - INTERVAL '24 months',
   'Senior interventional cardiologist at Lilavati. Confirmed advisory board member since 2023. High RCPA prescription volume in Mumbai North. Peer-cited in regional cardiology guidelines. Speaker at multiple ICC and CSI annual conferences. Flagship KOL — protect this relationship.',
   'mgr_vikram_001'),

  -- ── Dr. Pradeep Joshi (id=3, Nephrology, Mumbai N) — T2 ────────────────
  (3, 'T2', 72.00, TRUE, FALSE, 6,
   1,
   'Regular advisory board attendee. Provides constructive feedback on renal dosing labels. Has not yet spoken publicly for us but referenced our trial data in a recent ISN webinar.',
   NOW() - INTERVAL '21 days', 'roundtable',
   'human', NOW() - INTERVAL '20 months',
   'HOD Nephrology at Lilavati. Strong regional reach across Maharashtra nephrology community. Six peer-reviewed publications on CKD progression. Good candidate for elevation to T1 if speaker engagement increases.',
   'mgr_vikram_001'),

  -- ── Dr. Rajesh Kapoor (id=6, Neurology, Mumbai S) — T2, AI-suggested ───
  (6, 'T2', 68.00, FALSE, TRUE, 9,
   1,
   'Speaker at the 2026 Mumbai Movement Disorders Symposium. Cited our Bevaas data in his keynote with neutral-positive framing.',
   NOW() - INTERVAL '10 days', 'symposium',
   'ai', NOW() - INTERVAL '90 days',
   'AI-identified KOL based on speaker activity, publication count, and DCR pattern. Manager confirmed tier in Q1 2026. Active in IAN and MDS-India. Secondary affiliation at KEM teaching hospital extends reach into the public sector.',
   'mgr_vikram_001'),

  -- ── Dr. Suresh Kumar (id=10, Cardiology, Delhi NCR) — T1 ───────────────
  (10, 'T1', 91.00, TRUE, TRUE, 22,
   2,
   'Lead author on three of our pivotal trials (Derise CARDIO-IV and CARDIO-V, plus the 2024 dosing study). Headlined our 2025 ICC keynote with strong positive framing on Derise outcomes data.',
   NOW() - INTERVAL '28 days', 'speaker_program',
   'human', NOW() - INTERVAL '36 months',
   'AIIMS Cardiology HOD. India''s most cited interventional cardiology KOL. 22 peer-reviewed publications. Drives prescribing patterns across the National Capital Region and beyond. Long-standing relationship — protect at all costs. Considered for global advisory board nomination.',
   'admin_001'),

  -- ── Dr. Pooja Singh (id=13, Endocrinology, Delhi NCR) — T2 ─────────────
  (13, 'T2', 70.00, FALSE, FALSE, 4,
   1,
   'Quoted our Phase III diabetes-comorbidity sub-analysis in a Delhi endocrine society lecture. Has not yet committed to advisory board or speaker bureau but receptive.',
   NULL, NULL,
   'human', NOW() - INTERVAL '14 months',
   'Endocrinologist at Max Saket. Growing influence in Delhi NCR endocrinology community. Four publications, two on diabetes-cardiovascular co-management. Recent DPDP withdrawal complicates email outreach — pivot to direct visits and event invites.',
   'mgr_vikram_001'),

  -- ── Dr. Vikram Desai (id=8, Cardiology, Mumbai S) — T3, AI-suggested ───
  (8, 'T3', 52.00, FALSE, FALSE, 2,
   0,
   'Neutral stance overall. Prescribes our products at moderate volume but has not publicly advocated. Mentioned in two regional CME proceedings.',
   NOW() - INTERVAL '14 days', 'advisory_board',
   'ai', NOW() - INTERVAL '60 days',
   'AI-identified emerging-to-T3 KOL. Local influence in Mumbai South cardiology cluster around Hinduja and Breach Candy. Two early-career publications. Worth nurturing — invite to advisory boards as panelist.',
   'mgr_vikram_001'),

  -- ── Dr. Neha Sharma (id=11, Neurology, Delhi NCR) — emerging ───────────
  (11, 'emerging', 45.00, FALSE, FALSE, 1,
   1,
   'Single peer-reviewed publication (case series). Recent attendance at the Neurology Symposium suggests growing engagement. No public advocacy yet.',
   NOW() - INTERVAL '10 days', 'symposium',
   'ai', NOW() - INTERVAL '30 days',
   'AI-identified emerging KOL. Recent move to Max Saket as consultant has raised her profile. Still early career. Promising trajectory; revisit tier in 6 months. First major event participation was the 2026 Mumbai Neurology Symposium.',
   'mgr_vikram_001'),

  -- ── Dr. Kavita Rao (id=4, Endocrinology, Mumbai N) — T3, NEGATIVE sentiment
  (4, 'T3', 48.00, FALSE, FALSE, 3,
   -1,
   'Raised concerns about a hepatotoxicity signal in Bevaas at the Q1 2026 advisory board. Has paused new prescriptions pending updated safety data. We are watching this closely — see compliance_findings #8.',
   NULL, NULL,
   'human', NOW() - INTERVAL '8 months',
   'Endocrinologist at Kokilaben. Influential locally but currently in a critical-but-engaged stance toward our portfolio. Recent visit-revoke (see consent_register) reflects the safety concern. Recovery plan: provide updated hepatotoxicity safety bulletin and re-engage via medical-affairs Q&A, not field-rep visit.',
   'mgr_vikram_001');
