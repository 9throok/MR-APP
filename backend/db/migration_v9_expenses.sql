-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V9 — Expense Claims (MR field expense reimbursement)
--
-- Adds:
--   - expense_claims      : header per MR per period, with submit/approve flow
--   - expense_line_items  : one row per line, wide schema covering all 4 claim
--                           types (Local Conveyance, Travel Allowance, General
--                           Expense, Daily Allowance). Type-specific columns
--                           are nullable; CHECK constraints ensure required
--                           fields are present per claim_type.
--
-- Run AFTER: migration_v8_tour_plans.sql
--
-- Tenant model: every row carries org_id (default org for backfill / pre-multi
-- tenant inserts), with RLS-forced + permissive policy matching v7 conventions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Expense Claims (header) ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS expense_claims (
  id            SERIAL       PRIMARY KEY,
  org_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                             REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id       TEXT         NOT NULL,
  -- Period this claim covers (typically a calendar month, but free-form to
  -- accommodate weekly / fortnightly cycles too).
  period_start  DATE         NOT NULL,
  period_end    DATE         NOT NULL,
  currency      VARCHAR(3)   NOT NULL DEFAULT 'INR',
  -- Total is denormalised — recomputed app-side on save and on line-item
  -- mutations. Stored so we can show "claim total" in the list view without
  -- re-aggregating every row.
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'draft'
                             CHECK (status IN ('draft','submitted','approved','rejected')),
  submitted_at  TIMESTAMPTZ,
  reviewed_by   TEXT,
  reviewed_at   TIMESTAMPTZ,
  review_notes  TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_expense_claims_period
    CHECK (period_end >= period_start),
  CONSTRAINT chk_expense_claims_total
    CHECK (total_amount >= 0)
);

CREATE INDEX IF NOT EXISTS idx_expense_claims_org_user_period
  ON expense_claims (org_id, user_id, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_expense_claims_org_status
  ON expense_claims (org_id, status);

-- ── Expense Line Items (wide schema, claim_type discriminator) ──────────────
CREATE TABLE IF NOT EXISTS expense_line_items (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  claim_id        INT           NOT NULL REFERENCES expense_claims(id) ON DELETE CASCADE,
  claim_type      VARCHAR(40)   NOT NULL
                                CHECK (claim_type IN (
                                  'local_conveyance', 'travel_allowance',
                                  'general_expense',  'daily_allowance'
                                )),
  -- Common fields ────────────────────────────────────────────────────────────
  expense_date    DATE,                       -- single-day expenses
  from_date       DATE,                       -- multi-day (travel allowance)
  to_date         DATE,
  amount          NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  currency        VARCHAR(3)    NOT NULL DEFAULT 'INR',
  description     TEXT,
  remark          TEXT,
  attachment_url  TEXT,
  -- Doctor link — for entertainment-of-HCP records that compliance/Phase C
  -- needs to surface. Nullable; manager can add it post-hoc.
  doctor_id       INT           REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  -- Local Conveyance / Travel Allowance fields ──────────────────────────────
  conveyance_mode VARCHAR(40),                -- bike, car, taxi, train, flight, etc.
  distance_km     NUMERIC(8,2),               -- for conveyance reimbursement
  rate_per_km     NUMERIC(8,2),               -- snapshotted at claim time
  from_place      VARCHAR(200),
  to_place        VARCHAR(200),
  transport_class VARCHAR(40),                -- AC / non-AC, economy, etc.
  -- Daily Allowance fields ──────────────────────────────────────────────────
  allowance_type  VARCHAR(40),                -- HQ / EX-HQ / out-station
  city            VARCHAR(100),
  days            NUMERIC(5,1),               -- supports half-days
  daily_rate      NUMERIC(10,2),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),

  -- Date-shape coherence: either a single expense_date OR a from/to range,
  -- never both, and never neither.
  CONSTRAINT chk_expense_line_dates CHECK (
    (expense_date IS NOT NULL AND from_date IS NULL AND to_date IS NULL)
    OR (expense_date IS NULL AND from_date IS NOT NULL AND to_date IS NOT NULL AND to_date >= from_date)
  ),
  -- Type-specific required fields. Each branch enforces what THAT claim_type
  -- needs. Other type-specific cols may be NULL.
  CONSTRAINT chk_expense_line_type_fields CHECK (
    (claim_type = 'local_conveyance' AND conveyance_mode IS NOT NULL)
    OR (claim_type = 'travel_allowance' AND from_place IS NOT NULL AND to_place IS NOT NULL)
    OR (claim_type = 'general_expense')
    OR (claim_type = 'daily_allowance' AND allowance_type IS NOT NULL AND days IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_expense_lines_org_claim
  ON expense_line_items (org_id, claim_id);
CREATE INDEX IF NOT EXISTS idx_expense_lines_org_type_date
  ON expense_line_items (org_id, claim_type, COALESCE(expense_date, from_date) DESC);
CREATE INDEX IF NOT EXISTS idx_expense_lines_org_doctor
  ON expense_line_items (org_id, doctor_id) WHERE doctor_id IS NOT NULL;

-- ── RLS placeholder policies (matches v7 / v8 pattern) ──────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['expense_claims', 'expense_line_items'];
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

-- ── updated_at trigger for expense_claims (reuse v8 helper if compatible,
--    define our own to be self-contained) ──────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_expense_claims_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_expense_claims_updated_at ON expense_claims;
CREATE TRIGGER set_expense_claims_updated_at
  BEFORE UPDATE ON expense_claims
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_expense_claims_updated_at();
