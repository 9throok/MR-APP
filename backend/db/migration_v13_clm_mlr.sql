-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V13 — CLM (Closed-Loop Marketing) + MLR (Medical/Legal/Regulatory)
--
-- Phase B "deal-making module" per the strategic plan.
--
-- Adds:
--   - content_assets        : long-lived marketing asset identity (e.g. "Derise
--                             10mg detail aid"). Versions hang off this.
--   - content_versions      : every upload creates a new version row, with
--                             status workflow draft → in_review → approved →
--                             published / changes_requested / retired. AI
--                             pre-review notes land in the JSONB column here.
--   - mlr_reviews           : one row per (version × reviewer_role). All 3
--                             roles must approve before the version flips to
--                             approved.
--   - content_distributions : which versions are pushed to which audience
--                             (mr / territory / role / all).
--   - content_views         : the CLM tracker — every slide/page view by an
--                             MR during a doctor visit. High-volume; analytics
--                             goldmine.
--   - content_claims        : extracted marketing claims + their substantiation
--                             status (auto-cited / needs_citation / dismissed).
--
-- Also extends users.role CHECK to add medical_reviewer / legal_reviewer /
-- regulatory_reviewer so the MLR queue can route by role.
--
-- Run AFTER: migration_v12_samples.sql
--
-- Tenant model: every row carries org_id (default org for backfill / pre-multi
-- tenant inserts), with RLS-forced + permissive policy matching v7 conventions.
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Extend users.role CHECK to include MLR reviewer roles ──────────────────
-- The original CHECK constraint is named users_role_check (Postgres default)
-- and lives on the users table. Drop it and re-add with the expanded set.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'users_role_check'
      AND conrelid = 'public.users'::regclass
  ) THEN
    ALTER TABLE users DROP CONSTRAINT users_role_check;
  END IF;
END $$;

ALTER TABLE users
  ADD CONSTRAINT users_role_check
  CHECK (role IN (
    'mr', 'manager', 'admin',
    'medical_reviewer', 'legal_reviewer', 'regulatory_reviewer'
  ));

-- ── content_assets (parent identity) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS content_assets (
  id                  SERIAL       PRIMARY KEY,
  org_id              UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                   REFERENCES organizations(id) ON DELETE RESTRICT,
  title               VARCHAR(200) NOT NULL,
  asset_type          VARCHAR(30)  NOT NULL
                                   CHECK (asset_type IN ('slide_deck','video','pdf','detail_aid','brochure')),
  product_id          INT          REFERENCES products(id) ON DELETE SET NULL,
  therapeutic_area    VARCHAR(100),
  description         TEXT,
  -- current_version_id is set by the publish flow (route handler). FK is
  -- circular — content_versions.asset_id → content_assets, and this →
  -- content_versions. So we add the FK as a deferrable constraint AFTER
  -- the table exists, and let it stay nullable until first publish.
  current_version_id  INT,
  owner_user_id       TEXT         NOT NULL,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_assets_org_product_type
  ON content_assets (org_id, product_id, asset_type);
CREATE INDEX IF NOT EXISTS idx_content_assets_org_owner
  ON content_assets (org_id, owner_user_id);

-- ── content_versions (every upload = new row) ───────────────────────────────
CREATE TABLE IF NOT EXISTS content_versions (
  id                    SERIAL       PRIMARY KEY,
  org_id                UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                     REFERENCES organizations(id) ON DELETE RESTRICT,
  asset_id              INT          NOT NULL REFERENCES content_assets(id) ON DELETE CASCADE,
  version_number        INT          NOT NULL CHECK (version_number > 0),
  file_url              TEXT         NOT NULL,
  mime_type             VARCHAR(100),
  file_size_bytes       BIGINT       CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  status                VARCHAR(30)  NOT NULL DEFAULT 'draft'
                                     CHECK (status IN (
                                       'draft','in_review','changes_requested',
                                       'approved','published','retired'
                                     )),
  expiry_date           DATE,
  submitted_by          TEXT,
  submitted_at          TIMESTAMPTZ,
  published_at          TIMESTAMPTZ,
  retired_at            TIMESTAMPTZ,
  change_notes          TEXT,
  -- AI pre-review snapshot. Single JSONB column rather than a separate table
  -- because pre-review is a one-shot snapshot per version, not a ledger.
  ai_pre_review_notes   JSONB,
  created_at            TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (asset_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_content_versions_org_status
  ON content_versions (org_id, status);
CREATE INDEX IF NOT EXISTS idx_content_versions_org_asset_ver
  ON content_versions (org_id, asset_id, version_number DESC);

-- Now that content_versions exists, add the FK from content_assets
-- pointing at content_versions(id). DEFERRABLE so a transaction can update
-- both sides cleanly (publish flow updates current_version_id and the
-- version's status in one BEGIN/COMMIT).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_content_assets_current_version'
  ) THEN
    ALTER TABLE content_assets
      ADD CONSTRAINT fk_content_assets_current_version
      FOREIGN KEY (current_version_id) REFERENCES content_versions(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ── mlr_reviews (one row per (version × reviewer_role)) ─────────────────────
CREATE TABLE IF NOT EXISTS mlr_reviews (
  id                SERIAL        PRIMARY KEY,
  org_id            UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                  REFERENCES organizations(id) ON DELETE RESTRICT,
  version_id        INT           NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  reviewer_role     VARCHAR(20)   NOT NULL
                                  CHECK (reviewer_role IN ('medical','legal','regulatory')),
  reviewer_user_id  TEXT,
  decision          VARCHAR(20)   NOT NULL DEFAULT 'pending'
                                  CHECK (decision IN ('pending','approved','changes_requested','rejected')),
  decision_notes    TEXT,
  reviewed_at       TIMESTAMPTZ,
  created_at        TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE (version_id, reviewer_role)
);

CREATE INDEX IF NOT EXISTS idx_mlr_reviews_org_decision
  ON mlr_reviews (org_id, decision);
CREATE INDEX IF NOT EXISTS idx_mlr_reviews_role_decision
  ON mlr_reviews (org_id, reviewer_role, decision);

-- ── content_distributions (audience targeting) ──────────────────────────────
CREATE TABLE IF NOT EXISTS content_distributions (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  version_id      INT           NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  target_type     VARCHAR(20)   NOT NULL
                                CHECK (target_type IN ('mr','territory','role','all')),
  target_id       TEXT,
  distributed_by  TEXT          NOT NULL,
  distributed_at  TIMESTAMPTZ   DEFAULT NOW(),
  -- target_id is NULL only when target_type='all', non-NULL otherwise.
  CONSTRAINT chk_content_dist_target
    CHECK (
      (target_type = 'all'  AND target_id IS NULL) OR
      (target_type <> 'all' AND target_id IS NOT NULL)
    )
);

CREATE INDEX IF NOT EXISTS idx_content_distributions_org_target
  ON content_distributions (org_id, target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_content_distributions_version
  ON content_distributions (org_id, version_id);

-- ── content_views (high-volume CLM tracker ledger) ──────────────────────────
CREATE TABLE IF NOT EXISTS content_views (
  id                BIGSERIAL     PRIMARY KEY,
  org_id            UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                  REFERENCES organizations(id) ON DELETE RESTRICT,
  version_id        INT           NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  user_id           TEXT          NOT NULL,
  doctor_id         INT           REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  dcr_id            BIGINT        REFERENCES dcr(id) ON DELETE SET NULL,
  slide_index       INT           CHECK (slide_index IS NULL OR slide_index >= 0),
  duration_seconds  NUMERIC(8,2)  CHECK (duration_seconds IS NULL OR duration_seconds >= 0),
  viewed_at         TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_views_org_version_time
  ON content_views (org_id, version_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_views_org_user_time
  ON content_views (org_id, user_id, viewed_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_views_org_doctor
  ON content_views (org_id, doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_content_views_dcr
  ON content_views (dcr_id) WHERE dcr_id IS NOT NULL;

-- ── content_claims (claim substantiation ledger) ────────────────────────────
CREATE TABLE IF NOT EXISTS content_claims (
  id                SERIAL        PRIMARY KEY,
  org_id            UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                  REFERENCES organizations(id) ON DELETE RESTRICT,
  version_id        INT           NOT NULL REFERENCES content_versions(id) ON DELETE CASCADE,
  claim_text        TEXT          NOT NULL,
  source_doc_id     INT           REFERENCES drug_knowledge(id) ON DELETE SET NULL,
  reviewer_status   VARCHAR(20)   NOT NULL DEFAULT 'auto'
                                  CHECK (reviewer_status IN ('auto','confirmed','needs_citation','dismissed')),
  extracted_by      VARCHAR(20)   NOT NULL DEFAULT 'ai'
                                  CHECK (extracted_by IN ('ai','human')),
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_claims_org_version
  ON content_claims (org_id, version_id);
CREATE INDEX IF NOT EXISTS idx_content_claims_org_status
  ON content_claims (org_id, reviewer_status);

-- ── RLS placeholder policies (matches v7–v12 pattern) ──────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'content_assets', 'content_versions', 'mlr_reviews',
    'content_distributions', 'content_views', 'content_claims'
  ];
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

-- ── updated_at trigger for content_assets ──────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_content_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_content_assets_updated_at ON content_assets;
CREATE TRIGGER set_content_assets_updated_at
  BEFORE UPDATE ON content_assets
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_content_assets_updated_at();
