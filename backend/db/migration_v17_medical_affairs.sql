-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V17 — Medical Affairs (Phase C.2 — final sub-phase of Phase C)
--
-- Adds:
--   - medical_queries        : scientific questions captured from doctors via
--                              MRs, routed to a medical reviewer, answered
--                              with citations. Append-only audit trail of
--                              draft → reviewed → sent.
--   - kol_profiles           : KOL-specific fields hanging off doctor_profiles
--                              (1:1). Kept separate so non-KOL doctors stay
--                              clean. Tier (T1/T2/T3), advisory boards,
--                              publication count, speaker bureau membership,
--                              last engagement, sentiment.
--   - medical_engagements    : advisory boards / speaker programs / ad hoc
--                              consultations. Long-lived event records with
--                              topic, agenda, location, sponsor.
--   - engagement_attendees   : many-to-many doctors ↔ engagement, with
--                              role (attendee/speaker/chair) and outcomes.
--
-- Run AFTER: migration_v16_hcp_master.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── medical_queries ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_queries (
  id                  SERIAL        PRIMARY KEY,
  org_id              UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                    REFERENCES organizations(id) ON DELETE RESTRICT,
  -- Origin: which doctor asked, and which MR captured it (the MR is optional —
  -- queries can also arrive directly via doctor portal in future).
  doctor_id           INT           REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  doctor_name         TEXT          NOT NULL,             -- denormalised for record-keeping if doctor row deleted
  captured_by         TEXT,                                -- user_id of MR/manager who logged it
  captured_via        VARCHAR(20)   NOT NULL DEFAULT 'mr_visit'
                                    CHECK (captured_via IN ('mr_visit','phone','email','portal','event','other')),
  product             VARCHAR(200),                        -- product the query is about (FK-soft for now)
  -- The question
  question            TEXT          NOT NULL,
  category            VARCHAR(40)                          -- 'efficacy','safety','dosing','interaction','off_label','clinical_data','other'
                                    CHECK (category IS NULL OR category IN (
                                      'efficacy','safety','dosing','interaction',
                                      'off_label','clinical_data','administration','other'
                                    )),
  urgency             VARCHAR(20)   NOT NULL DEFAULT 'standard'
                                    CHECK (urgency IN ('low','standard','high','critical')),
  -- AI draft (auto-generated on capture)
  ai_draft_answer     TEXT,
  ai_draft_citations  JSONB,                               -- array of {source_doc_id, snippet, score}
  ai_drafted_at       TIMESTAMPTZ,
  -- Human review
  status              VARCHAR(20)   NOT NULL DEFAULT 'open'
                                    CHECK (status IN (
                                      'open',              -- captured, awaiting review
                                      'in_review',         -- reviewer has claimed it
                                      'answered',          -- final answer ready to send
                                      'sent',              -- delivered to doctor
                                      'closed_no_action'   -- e.g. duplicate, withdrawn
                                    )),
  reviewer_user_id    TEXT,                                -- medical_reviewer who took it
  final_answer        TEXT,
  final_citations     JSONB,                               -- structured by reviewer; same shape as ai_draft_citations
  reviewed_at         TIMESTAMPTZ,
  sent_at             TIMESTAMPTZ,
  send_method         VARCHAR(20),                         -- 'email','letter','mr_callback','portal'
  -- Provenance
  created_at          TIMESTAMPTZ   DEFAULT NOW(),
  updated_at          TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_queries_org_status
  ON medical_queries (org_id, status, urgency);
CREATE INDEX IF NOT EXISTS idx_med_queries_org_reviewer
  ON medical_queries (org_id, reviewer_user_id) WHERE reviewer_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_med_queries_org_doctor
  ON medical_queries (org_id, doctor_id) WHERE doctor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_med_queries_org_created
  ON medical_queries (org_id, created_at DESC);

-- ── kol_profiles (1:1 extension of doctor_profiles for KOLs) ────────────────
CREATE TABLE IF NOT EXISTS kol_profiles (
  id                       SERIAL        PRIMARY KEY,
  org_id                   UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                         REFERENCES organizations(id) ON DELETE RESTRICT,
  doctor_id                INT           NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  -- KOL classification
  kol_tier                 VARCHAR(10)   CHECK (kol_tier IS NULL OR kol_tier IN ('T1','T2','T3','emerging')),
  influence_score          NUMERIC(5,2)  CHECK (influence_score IS NULL OR (influence_score >= 0 AND influence_score <= 100)),
  -- Activity signals
  advisory_board_member    BOOLEAN       DEFAULT FALSE,
  speaker_bureau           BOOLEAN       DEFAULT FALSE,
  publication_count        INT           DEFAULT 0 CHECK (publication_count >= 0),
  -- Sentiment toward our products: -2 strongly negative ... +2 strongly positive
  sentiment_score          INT           CHECK (sentiment_score IS NULL OR (sentiment_score BETWEEN -2 AND 2)),
  sentiment_evidence       TEXT,
  -- Engagement
  last_engagement_at       TIMESTAMPTZ,
  last_engagement_type     VARCHAR(40),                    -- 'advisory_board','speaker_program','consultation','event'
  -- Provenance: AI suggestions vs human-confirmed
  identified_by            VARCHAR(20)   NOT NULL DEFAULT 'human'
                                         CHECK (identified_by IN ('human','ai')),
  identified_at            TIMESTAMPTZ   DEFAULT NOW(),
  notes                    TEXT,
  created_by               TEXT,
  created_at               TIMESTAMPTZ   DEFAULT NOW(),
  updated_at               TIMESTAMPTZ   DEFAULT NOW(),
  -- One KOL row per doctor per org. Re-identifying a doctor as KOL UPDATEs.
  UNIQUE (org_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_kol_profiles_org_tier
  ON kol_profiles (org_id, kol_tier);
CREATE INDEX IF NOT EXISTS idx_kol_profiles_org_score
  ON kol_profiles (org_id, influence_score DESC NULLS LAST);

-- ── medical_engagements ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS medical_engagements (
  id                SERIAL         PRIMARY KEY,
  org_id            UUID           NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                   REFERENCES organizations(id) ON DELETE RESTRICT,
  title             VARCHAR(200)   NOT NULL,
  engagement_type   VARCHAR(40)    NOT NULL
                                   CHECK (engagement_type IN (
                                     'advisory_board',
                                     'speaker_program',
                                     'symposium',
                                     'consultation',
                                     'investigator_meeting',
                                     'roundtable',
                                     'other'
                                   )),
  product           VARCHAR(200),
  topic             TEXT,
  agenda            TEXT,
  location          VARCHAR(200),
  scheduled_at      TIMESTAMPTZ,
  duration_minutes  INT            CHECK (duration_minutes IS NULL OR duration_minutes >= 0),
  sponsor_user_id   TEXT,                                  -- medical affairs lead who organised it
  status            VARCHAR(20)    NOT NULL DEFAULT 'planned'
                                   CHECK (status IN ('planned','confirmed','completed','cancelled')),
  outcomes_summary  TEXT,                                  -- what happened, key takeaways
  created_at        TIMESTAMPTZ    DEFAULT NOW(),
  updated_at        TIMESTAMPTZ    DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_med_engagements_org_type_time
  ON medical_engagements (org_id, engagement_type, scheduled_at DESC);
CREATE INDEX IF NOT EXISTS idx_med_engagements_org_status
  ON medical_engagements (org_id, status);

-- ── engagement_attendees (m:m) ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS engagement_attendees (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  engagement_id   INT           NOT NULL REFERENCES medical_engagements(id) ON DELETE CASCADE,
  doctor_id       INT           NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  attendee_role   VARCHAR(40)   NOT NULL DEFAULT 'attendee'
                                CHECK (attendee_role IN ('attendee','speaker','chair','panelist','organiser')),
  attended        BOOLEAN,                                 -- TRUE/FALSE after the event; NULL until then
  honorarium_amt  NUMERIC(12,2)  CHECK (honorarium_amt IS NULL OR honorarium_amt >= 0),
  honorarium_ccy  VARCHAR(3)     DEFAULT 'INR',
  feedback        TEXT,
  added_at        TIMESTAMPTZ    DEFAULT NOW(),
  -- Each doctor appears once per engagement (role can be edited; not duplicated)
  UNIQUE (engagement_id, doctor_id)
);

CREATE INDEX IF NOT EXISTS idx_engagement_attendees_org_doctor
  ON engagement_attendees (org_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_engagement_attendees_org_engagement
  ON engagement_attendees (org_id, engagement_id);

-- ── RLS placeholder policies (matches v7–v16 pattern) ──────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'medical_queries',
    'kol_profiles',
    'medical_engagements',
    'engagement_attendees'
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

-- ── updated_at triggers ─────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_medical_queries_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_medical_queries_updated_at ON medical_queries;
CREATE TRIGGER set_medical_queries_updated_at
  BEFORE UPDATE ON medical_queries FOR EACH ROW
  EXECUTE FUNCTION trigger_set_medical_queries_updated_at();

CREATE OR REPLACE FUNCTION trigger_set_kol_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_kol_profiles_updated_at ON kol_profiles;
CREATE TRIGGER set_kol_profiles_updated_at
  BEFORE UPDATE ON kol_profiles FOR EACH ROW
  EXECUTE FUNCTION trigger_set_kol_profiles_updated_at();

CREATE OR REPLACE FUNCTION trigger_set_medical_engagements_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS set_medical_engagements_updated_at ON medical_engagements;
CREATE TRIGGER set_medical_engagements_updated_at
  BEFORE UPDATE ON medical_engagements FOR EACH ROW
  EXECUTE FUNCTION trigger_set_medical_engagements_updated_at();
