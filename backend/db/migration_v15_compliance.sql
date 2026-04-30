-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V15 — Compliance / Vault-lite (Phase C.1)
--
-- The "trust unlock" phase. Adds the compliance backbone that pharma buyers
-- demand before switching off Veeva: a tamper-evident audit trail, doctor
-- consent management, regulatory document repo, and an AI Compliance Watchdog
-- ledger that complements the existing AE detection pipeline.
--
-- Adds:
--   - audit_log               : append-only ledger of CREATE/UPDATE/DELETE on
--                               regulated tables. Captures actor, timestamp,
--                               before/after JSONB snapshots, and an optional
--                               reason / source-route field. The middleware in
--                               backend/middleware/auditLog.js writes here.
--   - consent_records         : per-doctor consent per channel (marketing
--                               emails, marketing visits, sample distribution).
--                               Append-only — every grant/revoke/update is a
--                               new row. The "current" status per
--                               (doctor, channel) is the latest by recorded_at.
--   - regulatory_documents    : long-lived identity per regulated doc (drug
--                               label, IFU, MoH approval). Versions hang off.
--   - regulatory_document_versions : every upload = new version, with
--                               jurisdiction + effective/expiry dates.
--   - compliance_findings     : AI Compliance Watchdog ledger. One row per
--                               finding (off-label promotion, missing
--                               fair-balance, gift-value-over-threshold,
--                               unconsented contact, etc.). Linked to the
--                               source record (DCR, expense, content).
--
-- Run AFTER: migration_v14_content_recommendations.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── audit_log (universal append-only ledger) ────────────────────────────────
CREATE TABLE IF NOT EXISTS audit_log (
  id              BIGSERIAL    PRIMARY KEY,
  org_id          UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id) ON DELETE RESTRICT,
  -- actor (the user whose JWT performed the action; NULL for system actions)
  actor_user_id   TEXT,
  actor_role      VARCHAR(40),
  -- target row
  table_name      VARCHAR(80)  NOT NULL,
  row_id          TEXT         NOT NULL,           -- TEXT so int + uuid + composite ids all fit
  action          VARCHAR(10)  NOT NULL CHECK (action IN ('CREATE','UPDATE','DELETE')),
  -- before/after snapshots (NULL for CREATE.before and DELETE.after)
  before_data     JSONB,
  after_data      JSONB,
  -- request context
  route_path      VARCHAR(255),
  http_method     VARCHAR(10),
  ip_address      VARCHAR(64),
  reason          TEXT,                            -- optional, e.g. "manager override per ticket #123"
  occurred_at     TIMESTAMPTZ  DEFAULT NOW()
);

-- Lookup hot paths: per-table audit (compliance officer scrolling through
-- DCR history), per-actor (insider-investigation), recency.
CREATE INDEX IF NOT EXISTS idx_audit_log_org_table_time
  ON audit_log (org_id, table_name, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_actor_time
  ON audit_log (org_id, actor_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_org_row
  ON audit_log (org_id, table_name, row_id);

-- ── consent_records (per-doctor, per-channel, append-only) ──────────────────
-- Append-only by design. To "revoke" consent, we INSERT a new row with
-- status='revoked'. The latest row per (doctor_id, channel) is the active
-- state. This gives free history.
CREATE TABLE IF NOT EXISTS consent_records (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  doctor_id       INT           NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  channel         VARCHAR(40)   NOT NULL
                                CHECK (channel IN (
                                  'marketing_email',
                                  'marketing_visit',
                                  'sample_distribution',
                                  'data_processing'
                                )),
  status          VARCHAR(20)   NOT NULL
                                CHECK (status IN ('granted','revoked','withdrawn')),
  recorded_by     TEXT          NOT NULL,            -- user_id of the MR/manager who recorded it
  source          VARCHAR(40),                       -- 'verbal','written','digital_signature','imported'
  notes           TEXT,
  effective_from  DATE          DEFAULT CURRENT_DATE,
  effective_until DATE,                              -- nullable; revoke creates a new row, no need to fill this
  recorded_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_records_org_doctor_channel_time
  ON consent_records (org_id, doctor_id, channel, recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_consent_records_org_status
  ON consent_records (org_id, status);

-- ── regulatory_documents (long-lived identity) ──────────────────────────────
CREATE TABLE IF NOT EXISTS regulatory_documents (
  id                   SERIAL       PRIMARY KEY,
  org_id               UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                    REFERENCES organizations(id) ON DELETE RESTRICT,
  title                VARCHAR(200) NOT NULL,
  doc_type             VARCHAR(40)  NOT NULL
                                    CHECK (doc_type IN (
                                      'drug_label',         -- prescribing information / package insert
                                      'ifu',                -- instructions for use
                                      'moh_approval',       -- ministry-of-health approval letter
                                      'safety_communication',
                                      'sop',                -- standard operating procedure
                                      'training_material',
                                      'other'
                                    )),
  product_id           INT          REFERENCES products(id) ON DELETE SET NULL,
  jurisdiction         VARCHAR(80),                    -- e.g. 'IN', 'EU', 'US-FDA', 'global'
  description          TEXT,
  current_version_id   INT,                            -- FK added below (circular, like content_assets)
  owner_user_id        TEXT         NOT NULL,
  created_at           TIMESTAMPTZ  DEFAULT NOW(),
  updated_at           TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regulatory_documents_org_type_jurisdiction
  ON regulatory_documents (org_id, doc_type, jurisdiction);
CREATE INDEX IF NOT EXISTS idx_regulatory_documents_org_product
  ON regulatory_documents (org_id, product_id);

-- ── regulatory_document_versions (every upload = new row) ───────────────────
CREATE TABLE IF NOT EXISTS regulatory_document_versions (
  id                  SERIAL       PRIMARY KEY,
  org_id              UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                   REFERENCES organizations(id) ON DELETE RESTRICT,
  document_id         INT          NOT NULL REFERENCES regulatory_documents(id) ON DELETE CASCADE,
  version_number      INT          NOT NULL CHECK (version_number > 0),
  file_url            TEXT         NOT NULL,
  mime_type           VARCHAR(100),
  file_size_bytes     BIGINT       CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
  effective_date      DATE,                            -- when this version becomes authoritative
  expiry_date         DATE,                            -- when this version is no longer authoritative
  status              VARCHAR(20)  NOT NULL DEFAULT 'active'
                                   CHECK (status IN ('active','superseded','retired','archived')),
  uploaded_by         TEXT,
  change_notes        TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE (document_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_regdoc_versions_org_status_expiry
  ON regulatory_document_versions (org_id, status, expiry_date);
CREATE INDEX IF NOT EXISTS idx_regdoc_versions_org_doc
  ON regulatory_document_versions (org_id, document_id, version_number DESC);

-- Circular FK from regulatory_documents.current_version_id → versions
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_regulatory_documents_current_version'
  ) THEN
    ALTER TABLE regulatory_documents
      ADD CONSTRAINT fk_regulatory_documents_current_version
      FOREIGN KEY (current_version_id) REFERENCES regulatory_document_versions(id)
      ON DELETE SET NULL
      DEFERRABLE INITIALLY DEFERRED;
  END IF;
END $$;

-- ── compliance_findings (AI Watchdog ledger) ────────────────────────────────
-- One row per finding. The watchdog scans DCR call notes (and later, content
-- assets and expense receipts) and writes findings here. Reviewers acknowledge
-- or dismiss them. Mirrors the adverse_events shape so the UI can render both
-- in a unified Compliance Inbox if we want later.
CREATE TABLE IF NOT EXISTS compliance_findings (
  id                SERIAL        PRIMARY KEY,
  org_id            UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                  REFERENCES organizations(id) ON DELETE RESTRICT,
  -- what kind of compliance issue
  finding_type      VARCHAR(40)   NOT NULL
                                  CHECK (finding_type IN (
                                    'off_label_promotion',
                                    'missing_fair_balance',
                                    'gift_value_threshold',
                                    'unconsented_contact',
                                    'unsubstantiated_claim',
                                    'duplicate_ae_report',
                                    'other'
                                  )),
  severity          VARCHAR(20)   NOT NULL DEFAULT 'medium'
                                  CHECK (severity IN ('low','medium','high','critical')),
  -- source record this finding came from. Polymorphic — we record both the
  -- table_name and row_id so a single index serves all entity types.
  source_table      VARCHAR(80)   NOT NULL,           -- 'dcr','content_versions','expense_claims'...
  source_row_id     TEXT          NOT NULL,
  user_id           TEXT,                              -- the actor whose record triggered the finding
  -- finding payload
  description       TEXT          NOT NULL,
  evidence_quote    TEXT,                              -- verbatim phrase that triggered it
  recommendation    TEXT,
  -- review state
  status            VARCHAR(20)   NOT NULL DEFAULT 'open'
                                  CHECK (status IN ('open','acknowledged','dismissed','escalated','resolved')),
  reviewed_by       TEXT,
  reviewed_at       TIMESTAMPTZ,
  review_notes      TEXT,
  -- provenance
  detected_by       VARCHAR(20)   NOT NULL DEFAULT 'ai'
                                  CHECK (detected_by IN ('ai','human','rule')),
  created_at        TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_compliance_findings_org_status_severity
  ON compliance_findings (org_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_compliance_findings_org_source
  ON compliance_findings (org_id, source_table, source_row_id);
CREATE INDEX IF NOT EXISTS idx_compliance_findings_org_user_time
  ON compliance_findings (org_id, user_id, created_at DESC);

-- ── RLS placeholder policies (matches v7–v14 pattern) ──────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'audit_log',
    'consent_records',
    'regulatory_documents',
    'regulatory_document_versions',
    'compliance_findings'
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

-- ── updated_at trigger for regulatory_documents ─────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_regulatory_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_regulatory_documents_updated_at ON regulatory_documents;
CREATE TRIGGER set_regulatory_documents_updated_at
  BEFORE UPDATE ON regulatory_documents
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_regulatory_documents_updated_at();
