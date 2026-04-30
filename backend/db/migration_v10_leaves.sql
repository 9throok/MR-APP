-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V10 — Leaves (apply / approve workflow + balance ledger)
--
-- Adds:
--   - leaves          : one row per leave application with submit/approve flow
--   - leave_balances  : per-user-per-year-per-type balance ledger
--                       (initial allocation - approved-leave-days = remaining)
--
-- Run AFTER: migration_v9_expenses.sql
--
-- Tenant model: every row carries org_id (default org for backfill / pre-multi
-- tenant inserts), with RLS-forced + permissive policy matching v7 conventions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Leaves (applications) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS leaves (
  id              SERIAL       PRIMARY KEY,
  org_id          UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         TEXT         NOT NULL,
  leave_type      VARCHAR(40)  NOT NULL
                               CHECK (leave_type IN (
                                 'earned_leave', 'loss_of_pay', 'comp_off',
                                 'sabbatical_leave', 'sick_leave', 'casual_leave',
                                 'maternity_leave', 'paternity_leave'
                               )),
  from_date       DATE         NOT NULL,
  to_date         DATE         NOT NULL,
  -- Half-day support: which session(s) the leave covers on the boundary days.
  -- Session 1 = first half (e.g. morning), Session 2 = second half.
  -- For a multi-day leave: from_session is on the first day, to_session is on the last day.
  -- For a same-day leave: from_session must equal to_session for a half-day,
  -- or use 'full' for a whole-day leave.
  from_session    VARCHAR(20)  NOT NULL DEFAULT 'full'
                               CHECK (from_session IN ('full', 'session_1', 'session_2')),
  to_session      VARCHAR(20)  NOT NULL DEFAULT 'full'
                               CHECK (to_session IN ('full', 'session_1', 'session_2')),
  -- Computed at apply time, denormalised so balance recompute doesn't have to
  -- re-derive from session math. App computes this on insert / update.
  total_days      NUMERIC(4,1) NOT NULL CHECK (total_days > 0),
  reason          TEXT         NOT NULL,
  contact_details TEXT,
  attachment_url  TEXT,
  status          VARCHAR(20)  NOT NULL DEFAULT 'pending'
                               CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  reviewed_by     TEXT,
  reviewed_at     TIMESTAMPTZ,
  review_notes    TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_leaves_date_range CHECK (to_date >= from_date)
);

CREATE INDEX IF NOT EXISTS idx_leaves_org_user_dates
  ON leaves (org_id, user_id, from_date DESC);
CREATE INDEX IF NOT EXISTS idx_leaves_org_status
  ON leaves (org_id, status);
CREATE INDEX IF NOT EXISTS idx_leaves_org_type
  ON leaves (org_id, leave_type);

-- ── Leave Balances (per-user-per-year-per-type) ─────────────────────────────
-- Each row: how many days of a leave_type were ALLOCATED for the year,
-- how many have been USED (sum of approved leaves' total_days), and the
-- remaining = allocated - used. Used + remaining is recomputed app-side
-- whenever a leave moves to approved (or back out).
CREATE TABLE IF NOT EXISTS leave_balances (
  id              SERIAL       PRIMARY KEY,
  org_id          UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         TEXT         NOT NULL,
  year            INT          NOT NULL CHECK (year BETWEEN 2000 AND 3000),
  leave_type      VARCHAR(40)  NOT NULL
                               CHECK (leave_type IN (
                                 'earned_leave', 'loss_of_pay', 'comp_off',
                                 'sabbatical_leave', 'sick_leave', 'casual_leave',
                                 'maternity_leave', 'paternity_leave'
                               )),
  allocated_days  NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (allocated_days >= 0),
  used_days       NUMERIC(5,1) NOT NULL DEFAULT 0 CHECK (used_days >= 0),
  -- Generated column so 'remaining' is always consistent with the inputs.
  remaining_days  NUMERIC(5,1) GENERATED ALWAYS AS (allocated_days - used_days) STORED,
  updated_at      TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (org_id, user_id, year, leave_type)
);

CREATE INDEX IF NOT EXISTS idx_leave_balances_org_user_year
  ON leave_balances (org_id, user_id, year);

-- ── RLS placeholder policies (matches v7 / v8 / v9 pattern) ─────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['leaves', 'leave_balances'];
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

-- ── updated_at trigger for leaves ───────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_leaves_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_leaves_updated_at ON leaves;
CREATE TRIGGER set_leaves_updated_at
  BEFORE UPDATE ON leaves
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_leaves_updated_at();
