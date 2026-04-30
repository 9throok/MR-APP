-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V14 — Content Recommendations daily cache
--
-- Phase B Week 2 — caches the AI-generated CLM-NBA output per (org, MR, date)
-- so we don't re-spend LLM tokens on every page load. Mirrors the established
-- nba_recommendations pattern (migration_v2.sql) so future code review is
-- one-glance familiar.
--
-- Run AFTER: migration_v13_clm_mlr.sql
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS content_recommendations (
  id              SERIAL       PRIMARY KEY,
  org_id          UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         TEXT         NOT NULL,
  date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  recommendations JSONB        NOT NULL,
  generated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (org_id, user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_content_recommendations_org_user_date
  ON content_recommendations (org_id, user_id, date DESC);

-- ── RLS placeholder (matches v7–v13 pattern) ────────────────────────────────
DO $$
BEGIN
  EXECUTE 'ALTER TABLE content_recommendations ENABLE ROW LEVEL SECURITY';
  EXECUTE 'ALTER TABLE content_recommendations FORCE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS p_content_recommendations_permissive ON content_recommendations';
  EXECUTE 'CREATE POLICY p_content_recommendations_permissive ON content_recommendations FOR ALL USING (true) WITH CHECK (true)';
END $$;
