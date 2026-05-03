-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Territory Alignments — versioned MR ↔ territory history
--
-- Each MR has either an open current alignment, or a closed historical one
-- followed by an open current one. Demonstrates the "who covered which
-- territory between dates" history that a flat users.territory string can't
-- answer.
--
-- Constraint: at most one OPEN (effective_until IS NULL) alignment per user.
-- Run AFTER: migration_v16_hcp_master.sql + seed_users.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE territory_alignments RESTART IDENTITY CASCADE;

INSERT INTO territory_alignments
  (user_id, territory, role_at_time, effective_from, effective_until, assigned_by, notes)
VALUES
  -- Rahul: started in Mumbai South, moved to Mumbai North 6 months ago.
  ('mr_rahul_001', 'Mumbai South', 'mr', CURRENT_DATE - INTERVAL '18 months', CURRENT_DATE - INTERVAL '7 months',
   'mgr_vikram_001', 'Initial onboarding territory.'),
  ('mr_rahul_001', 'Mumbai North', 'mr', CURRENT_DATE - INTERVAL '6 months',  NULL,
   'mgr_vikram_001', 'Reassigned to Mumbai North after Q3 2025 reorg.'),

  -- Priya: started in Delhi NCR, moved to Mumbai South 12 months ago.
  ('mr_priya_002', 'Delhi NCR',    'mr', CURRENT_DATE - INTERVAL '24 months', CURRENT_DATE - INTERVAL '13 months',
   'mgr_vikram_001', 'Started covering Delhi NCR.'),
  ('mr_priya_002', 'Mumbai South', 'mr', CURRENT_DATE - INTERVAL '12 months', NULL,
   'mgr_vikram_001', 'Promoted to Tier-A territory — Mumbai South.'),

  -- Robert: only ever covered Delhi NCR.
  ('mr_robert_003', 'Delhi NCR',   'mr', CURRENT_DATE - INTERVAL '9 months',  NULL,
   'mgr_vikram_001', 'New hire, single territory since onboarding.'),

  -- Manager: covered "All" since the company started.
  ('mgr_vikram_001', 'All',        'manager', CURRENT_DATE - INTERVAL '36 months', NULL,
   'admin_001', 'Founding regional manager. Covers all Indian territories.'),

  -- Admin: HQ-coverage alignment for visibility into regional reports.
  ('admin_001', 'All',             'admin',   CURRENT_DATE - INTERVAL '36 months', NULL,
   'admin_001', 'Self-assigned. Admin oversight only.');
