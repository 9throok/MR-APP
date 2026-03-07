-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Database Schema
-- Compatible with: local PostgreSQL (Docker) and Supabase (production)
--
-- For local Docker: this file is auto-run on first container start
-- For Supabase: run in SQL Editor (Project → SQL Editor → New query)
-- ─────────────────────────────────────────────────────────────────────────────


-- ── Products ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id    SERIAL      PRIMARY KEY,
  name  VARCHAR(100) NOT NULL
);

-- ── DCR (Daily Call Report) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dcr (
  id              BIGSERIAL   PRIMARY KEY,
  user_id         TEXT        NOT NULL,
  name            TEXT        NOT NULL,
  date            DATE,
  visit_time      TIMESTAMPTZ,
  product         TEXT        NOT NULL,
  samples         JSONB,
  call_summary    TEXT,
  doctor_feedback TEXT,
  edetailing      JSONB,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_dcr_user_id      ON dcr (user_id);
CREATE INDEX IF NOT EXISTS idx_dcr_date         ON dcr (date DESC);
CREATE INDEX IF NOT EXISTS idx_dcr_user_doctor  ON dcr (user_id, name);
CREATE INDEX IF NOT EXISTS idx_dcr_product      ON dcr (product);

-- ─────────────────────────────────────────────────────────────────────────────
-- Supabase-only: Row Level Security
-- Only run these in Supabase (SQL Editor). Skip for local Docker Postgres.
-- ─────────────────────────────────────────────────────────────────────────────
-- ALTER TABLE dcr ENABLE ROW LEVEL SECURITY;
--
-- CREATE POLICY "MR can read own DCRs"
--   ON dcr FOR SELECT USING (auth.uid()::text = user_id);
--
-- CREATE POLICY "MR can insert own DCRs"
--   ON dcr FOR INSERT WITH CHECK (auth.uid()::text = user_id);
