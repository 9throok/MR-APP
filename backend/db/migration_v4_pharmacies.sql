-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V4
-- Adds: pharmacy_profiles for NBA visit recommendations
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pharmacy_profiles (
  id                  SERIAL       PRIMARY KEY,
  name                TEXT         NOT NULL,
  type                VARCHAR(50)  DEFAULT 'retail' CHECK (type IN ('retail', 'hospital', 'chain')),
  tier                VARCHAR(10)  DEFAULT 'B' CHECK (tier IN ('A', 'B', 'C')),
  territory           VARCHAR(200),
  preferred_visit_day VARCHAR(20),
  address             TEXT,
  phone               VARCHAR(50),
  contact_person      TEXT,
  notes               TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_pharmacy_name ON pharmacy_profiles (name);
CREATE INDEX IF NOT EXISTS idx_pharmacy_territory ON pharmacy_profiles (territory);
