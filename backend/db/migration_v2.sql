-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V2
-- Adds: users, follow_up_tasks, drug_knowledge, adverse_events,
--        doctor_profiles, nba_recommendations
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Users (JWT Auth) ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL       PRIMARY KEY,
  username      VARCHAR(100) NOT NULL UNIQUE,
  email         VARCHAR(255) UNIQUE,
  password_hash TEXT         NOT NULL,
  role          VARCHAR(20)  NOT NULL DEFAULT 'mr' CHECK (role IN ('mr', 'manager', 'admin')),
  name          VARCHAR(200) NOT NULL,
  territory     VARCHAR(200),
  user_id       TEXT         UNIQUE NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_users_user_id ON users (user_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

-- ── Follow-up Tasks (Post-Call Automation) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS follow_up_tasks (
  id          SERIAL       PRIMARY KEY,
  dcr_id      BIGINT       REFERENCES dcr(id) ON DELETE CASCADE,
  user_id     TEXT         NOT NULL,
  doctor_name TEXT         NOT NULL,
  task        TEXT         NOT NULL,
  due_date    DATE,
  status      VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'overdue')),
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON follow_up_tasks (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON follow_up_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON follow_up_tasks (status);

-- ── Drug Knowledge Base (Clinical Assistant) ────────────────────────────────
CREATE TABLE IF NOT EXISTS drug_knowledge (
  id          SERIAL       PRIMARY KEY,
  product_id  INT          REFERENCES products(id) ON DELETE CASCADE,
  filename    TEXT         NOT NULL,
  content     TEXT         NOT NULL,
  category    VARCHAR(100),
  uploaded_by TEXT,
  uploaded_at TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_knowledge_product ON drug_knowledge (product_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_category ON drug_knowledge (category);
CREATE INDEX IF NOT EXISTS idx_knowledge_content_fts
  ON drug_knowledge USING GIN (to_tsvector('english', content));

-- ── Adverse Events ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS adverse_events (
  id            SERIAL       PRIMARY KEY,
  dcr_id        BIGINT       REFERENCES dcr(id) ON DELETE SET NULL,
  user_id       TEXT         NOT NULL,
  doctor_name   TEXT,
  drug          TEXT         NOT NULL,
  symptoms      TEXT[]       NOT NULL,
  severity      VARCHAR(20)  NOT NULL CHECK (severity IN ('mild', 'moderate', 'severe', 'critical')),
  patient_info  JSONB,
  timeline      TEXT,
  status        VARCHAR(20)  DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'confirmed', 'dismissed')),
  detected_at   TIMESTAMPTZ  DEFAULT NOW(),
  reviewed_by   TEXT,
  review_notes  TEXT,
  reviewed_at   TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ae_dcr ON adverse_events (dcr_id);
CREATE INDEX IF NOT EXISTS idx_ae_status ON adverse_events (status);
CREATE INDEX IF NOT EXISTS idx_ae_severity ON adverse_events (severity);
CREATE INDEX IF NOT EXISTS idx_ae_user ON adverse_events (user_id);

-- ── Doctor Profiles ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS doctor_profiles (
  id                  SERIAL       PRIMARY KEY,
  name                TEXT         NOT NULL,
  specialty           VARCHAR(200),
  tier                VARCHAR(10)  DEFAULT 'B' CHECK (tier IN ('A', 'B', 'C')),
  territory           VARCHAR(200),
  preferred_visit_day VARCHAR(20),
  hospital            TEXT,
  phone               VARCHAR(50),
  notes               TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_doctor_name ON doctor_profiles (name);
CREATE INDEX IF NOT EXISTS idx_doctor_territory ON doctor_profiles (territory);
CREATE INDEX IF NOT EXISTS idx_doctor_tier ON doctor_profiles (tier);

-- ── NBA Recommendations ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nba_recommendations (
  id              SERIAL       PRIMARY KEY,
  user_id         TEXT         NOT NULL,
  date            DATE         NOT NULL DEFAULT CURRENT_DATE,
  recommendations JSONB        NOT NULL,
  generated_at    TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(user_id, date)
);
CREATE INDEX IF NOT EXISTS idx_nba_user_date ON nba_recommendations (user_id, date);
