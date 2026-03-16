-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V3
-- Adds: rcpa (Retail Chemist Prescription Audit) table
-- ─────────────────────────────────────────────────────────────────────────────

-- ── RCPA ──────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS rcpa (
  id              SERIAL       PRIMARY KEY,
  user_id         TEXT         NOT NULL,
  pharmacy        TEXT         NOT NULL,
  doctor_name     TEXT,
  our_brand       TEXT         NOT NULL,
  our_value       NUMERIC(10,2) DEFAULT 0,
  competitor_brand TEXT        NOT NULL,
  competitor_company TEXT,
  competitor_value NUMERIC(10,2) DEFAULT 0,
  date            DATE         DEFAULT CURRENT_DATE,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_rcpa_user ON rcpa (user_id);
CREATE INDEX IF NOT EXISTS idx_rcpa_date ON rcpa (date DESC);
CREATE INDEX IF NOT EXISTS idx_rcpa_competitor ON rcpa (competitor_brand);
CREATE INDEX IF NOT EXISTS idx_rcpa_competitor_company ON rcpa (competitor_company);
CREATE INDEX IF NOT EXISTS idx_rcpa_our_brand ON rcpa (our_brand);
