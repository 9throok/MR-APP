-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V8 — Tour Plans (daily MR plans + visits)
--
-- Adds:
--   - tour_plans      : one row per MR per planned day, with submit/approve flow
--   - tour_plan_visits: child rows (one per planned doctor visit), ordered
--
-- Run AFTER: migration_v7_multitenancy.sql
--
-- Tenant model: every row carries org_id (default org for backfill / pre-multi-tenant
-- inserts), with RLS-forced + permissive policy matching v7 conventions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Tour Plans ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_plans (
  id            SERIAL       PRIMARY KEY,
  org_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                             REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id       TEXT         NOT NULL,
  plan_date     DATE         NOT NULL,
  type_of_tour  VARCHAR(30)  NOT NULL DEFAULT 'field_work'
                             CHECK (type_of_tour IN ('field_work','meeting','training','conference','other')),
  station       VARCHAR(100),
  start_time    TIME,
  end_time      TIME,
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','submitted','approved','rejected')),
  submitted_at  TIMESTAMPTZ,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_tour_plans_time_order
    CHECK (end_time IS NULL OR start_time IS NULL OR end_time > start_time)
);

-- One MR can only have one tour plan per day per org
CREATE UNIQUE INDEX IF NOT EXISTS uniq_tour_plans_org_user_date
  ON tour_plans (org_id, user_id, plan_date);

CREATE INDEX IF NOT EXISTS idx_tour_plans_org_user_date
  ON tour_plans (org_id, user_id, plan_date DESC);

CREATE INDEX IF NOT EXISTS idx_tour_plans_org_status
  ON tour_plans (org_id, status);

-- ── Tour Plan Visits ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tour_plan_visits (
  id            SERIAL       PRIMARY KEY,
  org_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                             REFERENCES organizations(id) ON DELETE RESTRICT,
  tour_plan_id  INT          NOT NULL REFERENCES tour_plans(id) ON DELETE CASCADE,
  doctor_id     INT          REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  doctor_name   TEXT         NOT NULL,
  visit_order   INT          NOT NULL,
  status        VARCHAR(20)  NOT NULL DEFAULT 'planned'
                             CHECK (status IN ('planned','completed','missed','cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_tour_plan_visits_doctor
    CHECK (doctor_id IS NOT NULL OR doctor_name IS NOT NULL)
);

CREATE INDEX IF NOT EXISTS idx_tour_plan_visits_org_plan
  ON tour_plan_visits (org_id, tour_plan_id, visit_order);

CREATE INDEX IF NOT EXISTS idx_tour_plan_visits_org_doctor
  ON tour_plan_visits (org_id, doctor_id) WHERE doctor_id IS NOT NULL;

-- ── RLS — placeholder permissive policies (matches v7 pattern) ──────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['tour_plans', 'tour_plan_visits'];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_permissive ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY p_%s_permissive ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ── updated_at trigger for tour_plans ───────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_tour_plans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_tour_plans_updated_at ON tour_plans;
CREATE TRIGGER set_tour_plans_updated_at
  BEFORE UPDATE ON tour_plans
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_tour_plans_updated_at();
