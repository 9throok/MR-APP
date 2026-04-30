-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V7 — Multi-tenancy foundation
--
-- Adds:
--   - organizations table
--   - org_id column on every existing tenant table (17 tables)
--   - Backfills all existing rows into a single "default" organization
--   - FKs + indexes
--   - RLS policies enabled but PERMISSIVE (placeholders) — defense-in-depth
--     enforcement comes in a follow-up once db.query() is refactored to
--     per-request clients. App-level WHERE org_id = $X filtering is the
--     primary isolation mechanism in this phase.
--
-- Run AFTER: migration_v6_sales.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Organizations ───────────────────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS pgcrypto;  -- for gen_random_uuid()

CREATE TABLE IF NOT EXISTS organizations (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  name        VARCHAR(200) NOT NULL,
  slug        VARCHAR(100) NOT NULL UNIQUE,
  plan        VARCHAR(50)  DEFAULT 'free',
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

-- Default org for backfilling all existing rows. Slug is the identifier the
-- app falls back to when no JWT-supplied org is present (e.g., during
-- migration grace period). Must exist before any FK is added.
INSERT INTO organizations (id, name, slug, plan)
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Organization', 'default', 'free')
ON CONFLICT (slug) DO NOTHING;

-- ── Helper: add org_id to a table, backfill, NOT NULL, FK, index ────────────
-- Idempotent block: each table is wrapped so re-running the migration is safe.

DO $$
DECLARE
  default_org_id UUID := '00000000-0000-0000-0000-000000000001';
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'products', 'dcr', 'users', 'follow_up_tasks', 'drug_knowledge',
    'knowledge_chunks', 'chat_sessions', 'chat_messages', 'adverse_events',
    'doctor_profiles', 'doctor_requests', 'nba_recommendations', 'rcpa',
    'pharmacy_profiles', 'distributors', 'secondary_sales', 'mr_targets'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Add column (nullable initially so backfill can succeed)
    EXECUTE format(
      'ALTER TABLE %I ADD COLUMN IF NOT EXISTS org_id UUID',
      tbl
    );

    -- Backfill any NULL rows to the default org
    EXECUTE format(
      'UPDATE %I SET org_id = $1 WHERE org_id IS NULL',
      tbl
    ) USING default_org_id;

    -- Enforce NOT NULL once backfilled
    EXECUTE format(
      'ALTER TABLE %I ALTER COLUMN org_id SET NOT NULL',
      tbl
    );

    -- (Default value for new rows is set in the explicit per-table block
    --  below — Postgres can't use a parameter inside a SET DEFAULT clause
    --  invoked through EXECUTE format(), so the literal must be inlined.)

    -- FK to organizations(id). Use a fixed name so re-runs don't duplicate.
    EXECUTE format($f$
      DO $inner$ BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint
          WHERE conname = 'fk_%s_org'
        ) THEN
          ALTER TABLE %I
            ADD CONSTRAINT fk_%s_org
            FOREIGN KEY (org_id) REFERENCES organizations(id) ON DELETE RESTRICT;
        END IF;
      END $inner$;
    $f$, tbl, tbl, tbl);

    -- Index on org_id (every tenant query starts here)
    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS idx_%s_org ON %I (org_id)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- The DEFAULT clause above accepts a plain UUID literal more cleanly than
-- a parameterised one inside dynamic SQL. Re-issue without the placeholder
-- to be sure every table has the right default literal recorded.
ALTER TABLE products            ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE dcr                 ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE users               ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE follow_up_tasks     ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE drug_knowledge      ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE knowledge_chunks    ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE chat_sessions       ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE chat_messages       ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE adverse_events      ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE doctor_profiles     ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE doctor_requests     ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE nba_recommendations ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE rcpa                ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE pharmacy_profiles   ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE distributors        ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE secondary_sales     ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';
ALTER TABLE mr_targets          ALTER COLUMN org_id SET DEFAULT '00000000-0000-0000-0000-000000000001';

-- ── Composite indexes for common (org_id, X) queries ────────────────────────
-- Single-column org_id index is fine for "list all in org", but most real
-- queries also filter by user_id or date. Add a few high-value composites.
CREATE INDEX IF NOT EXISTS idx_dcr_org_user        ON dcr (org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_dcr_org_date        ON dcr (org_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_org_user      ON follow_up_tasks (org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ae_org_status       ON adverse_events (org_id, status);
CREATE INDEX IF NOT EXISTS idx_doctor_org_terr     ON doctor_profiles (org_id, territory);
CREATE INDEX IF NOT EXISTS idx_rcpa_org_user       ON rcpa (org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_ss_org_user_date    ON secondary_sales (org_id, user_id, sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_users_org_role      ON users (org_id, role);

-- ── Unique constraints that need to become per-org ──────────────────────────
-- users.username and users.user_id are currently UNIQUE globally. In a
-- multi-tenant setup, two orgs can have a user named "rahul". Drop the global
-- UNIQUE and re-add as (org_id, username) and (org_id, user_id).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_username_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_username_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_user_id_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_user_id_key;
  END IF;
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN
    ALTER TABLE users DROP CONSTRAINT users_email_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_org_username ON users (org_id, username);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_org_user_id  ON users (org_id, user_id);
-- email left as a per-org optional unique (nullable column, partial index)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_users_org_email
  ON users (org_id, email) WHERE email IS NOT NULL;

-- distributors.code was global UNIQUE; same treatment
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'distributors_code_key') THEN
    ALTER TABLE distributors DROP CONSTRAINT distributors_code_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_distributors_org_code
  ON distributors (org_id, code) WHERE code IS NOT NULL;

-- nba_recommendations had UNIQUE(user_id, date); make per-org
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'nba_recommendations_user_id_date_key') THEN
    ALTER TABLE nba_recommendations DROP CONSTRAINT nba_recommendations_user_id_date_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_nba_org_user_date
  ON nba_recommendations (org_id, user_id, date);

-- mr_targets had UNIQUE(user_id, product_id, period); make per-org
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'mr_targets_user_id_product_id_period_key') THEN
    ALTER TABLE mr_targets DROP CONSTRAINT mr_targets_user_id_product_id_period_key;
  END IF;
END $$;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_targets_org_user_prod_period
  ON mr_targets (org_id, user_id, product_id, period);

-- ── RLS — placeholders only (PERMISSIVE) ────────────────────────────────────
-- Enable RLS on every tenant table so future strict policies attach
-- automatically. Add a permissive USING(true) policy now so existing
-- queries (which don't yet pass an org context to Postgres) keep working.
--
-- Strict enforcement = follow-up: replace USING(true) with
--   USING (org_id = current_setting('app.org_id', true)::uuid)
-- once backend/config/db.js routes queries through per-request clients.
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'products', 'dcr', 'users', 'follow_up_tasks', 'drug_knowledge',
    'knowledge_chunks', 'chat_sessions', 'chat_messages', 'adverse_events',
    'doctor_profiles', 'doctor_requests', 'nba_recommendations', 'rcpa',
    'pharmacy_profiles', 'distributors', 'secondary_sales', 'mr_targets',
    'organizations'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    -- Drop existing permissive policy (if re-running) so we don't stack
    EXECUTE format('DROP POLICY IF EXISTS p_%s_permissive ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY p_%s_permissive ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;
