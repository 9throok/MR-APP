-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V5 — Doctor Requests (MR → Manager approval workflow)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS doctor_requests (
  id                  SERIAL       PRIMARY KEY,
  requested_by        TEXT         NOT NULL,
  name                TEXT         NOT NULL,
  specialty           VARCHAR(200),
  tier                VARCHAR(10)  DEFAULT 'B' CHECK (tier IN ('A', 'B', 'C')),
  territory           VARCHAR(200),
  preferred_visit_day VARCHAR(20),
  hospital            TEXT,
  phone               VARCHAR(50),
  notes               TEXT,
  status              VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by         TEXT,
  review_notes        TEXT,
  reviewed_at         TIMESTAMPTZ,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dr_requested_by ON doctor_requests (requested_by);
CREATE INDEX IF NOT EXISTS idx_dr_status ON doctor_requests (status);
