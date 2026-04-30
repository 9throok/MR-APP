-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V16 — HCP Master Data Layer (Phase C.3)
--
-- Replaces the "single string territory + free-text specialty + free-text
-- hospital" model with a proper master data layer:
--
--   - institutions             : hospitals + clinics + medical centers (single
--                                table, type-discriminated). Separate from
--                                pharmacy_profiles which is channel-side.
--   - hcp_specialties_taxonomy : controlled vocab for doctor specialties.
--                                Replaces free-text over time — doctor_profiles
--                                gains a nullable specialty_code FK; the
--                                existing string column stays for back-compat
--                                until all rows are mapped.
--   - hcp_affiliations         : many-to-many doctor ↔ institution with role
--                                + effective dates. A doctor can practice at
--                                multiple hospitals; an institution has many
--                                affiliated doctors.
--   - territory_alignments     : versioned MR↔territory assignment. Today
--                                users.territory is a single string with no
--                                history; this gives "who covered which
--                                territory between dates X and Y" for
--                                attribution + audit.
--
-- Doctor profile extensions (regulatory + enrichment):
--   - npi_number               : National Provider Identifier (US) — unique within org if set
--   - mci_number               : Medical Council of India registration
--   - email                    : doctor email for marketing_email channel
--   - practice_address         : free-text mailing/practice address
--   - last_enriched_at         : timestamp of last AI HCP Enrichment run
--   - enrichment_metadata      : JSONB with raw enrichment payload + sources
--   - specialty_code           : FK → hcp_specialties_taxonomy.code (nullable)
--
-- Run AFTER: migration_v15_compliance.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── institutions (hospitals, clinics, medical centers) ──────────────────────
CREATE TABLE IF NOT EXISTS institutions (
  id                  SERIAL       PRIMARY KEY,
  org_id              UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                   REFERENCES organizations(id) ON DELETE RESTRICT,
  name                VARCHAR(200) NOT NULL,
  institution_type    VARCHAR(40)  NOT NULL
                                   CHECK (institution_type IN (
                                     'hospital_public',
                                     'hospital_private',
                                     'clinic',
                                     'nursing_home',
                                     'medical_center',
                                     'diagnostic_center',
                                     'other'
                                   )),
  bed_count           INT          CHECK (bed_count IS NULL OR bed_count >= 0),
  city                VARCHAR(100),
  state               VARCHAR(100),
  country             VARCHAR(100) DEFAULT 'IN',
  pincode             VARCHAR(20),
  address             TEXT,
  phone               VARCHAR(50),
  website             VARCHAR(255),
  -- Ops metadata
  tier                VARCHAR(10)  DEFAULT 'B'
                                   CHECK (tier IN ('A','B','C')),
  territory           VARCHAR(200),
  notes               TEXT,
  -- Provenance
  created_by          TEXT,
  created_at          TIMESTAMPTZ  DEFAULT NOW(),
  updated_at          TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_institutions_org_type
  ON institutions (org_id, institution_type);
CREATE INDEX IF NOT EXISTS idx_institutions_org_territory
  ON institutions (org_id, territory);
CREATE INDEX IF NOT EXISTS idx_institutions_org_city
  ON institutions (org_id, city);
-- Case-insensitive uniqueness on (org_id, lower(name), city) avoids trivial dupes
-- without blocking legitimate multi-branch chains in different cities.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_institutions_org_name_city
  ON institutions (org_id, LOWER(name), COALESCE(LOWER(city), ''));

-- ── hcp_specialties_taxonomy (controlled vocab) ─────────────────────────────
-- Codes follow ISCO/MCI-style short identifiers. Display labels are localised
-- via the existing language layer (frontend). The seed file populates ~30
-- common Indian-market specialties.
CREATE TABLE IF NOT EXISTS hcp_specialties_taxonomy (
  code         VARCHAR(40)  PRIMARY KEY,
  display      VARCHAR(120) NOT NULL,
  category     VARCHAR(40)  NOT NULL  -- e.g. 'medical', 'surgical', 'diagnostic'
                            CHECK (category IN ('medical','surgical','diagnostic','primary_care','dental','allied','other')),
  description  TEXT,
  active       BOOLEAN      DEFAULT TRUE,
  created_at   TIMESTAMPTZ  DEFAULT NOW()
);

-- Seed the taxonomy in this same migration so the FK from doctor_profiles
-- has something to point at. Idempotent — re-running is safe.
INSERT INTO hcp_specialties_taxonomy (code, display, category) VALUES
  ('cardiology',          'Cardiology',                       'medical'),
  ('endocrinology',       'Endocrinology',                    'medical'),
  ('gastroenterology',    'Gastroenterology',                 'medical'),
  ('neurology',           'Neurology',                        'medical'),
  ('nephrology',          'Nephrology',                       'medical'),
  ('oncology_med',        'Medical Oncology',                 'medical'),
  ('pulmonology',         'Pulmonology',                      'medical'),
  ('rheumatology',        'Rheumatology',                     'medical'),
  ('dermatology',         'Dermatology',                      'medical'),
  ('psychiatry',          'Psychiatry',                       'medical'),
  ('paediatrics',         'Paediatrics',                      'medical'),
  ('geriatrics',          'Geriatrics',                       'medical'),
  ('hematology',          'Hematology',                       'medical'),
  ('infectious_disease',  'Infectious Diseases',              'medical'),
  ('general_medicine',    'General Medicine / Internal Med',  'medical'),
  ('surgery_general',     'General Surgery',                  'surgical'),
  ('surgery_ortho',       'Orthopaedic Surgery',              'surgical'),
  ('surgery_neuro',       'Neurosurgery',                     'surgical'),
  ('surgery_cardiac',     'Cardiothoracic Surgery',           'surgical'),
  ('surgery_plastic',     'Plastic Surgery',                  'surgical'),
  ('obs_gyn',             'Obstetrics & Gynaecology',         'surgical'),
  ('ophthalmology',       'Ophthalmology',                    'surgical'),
  ('ent',                 'ENT (Otolaryngology)',             'surgical'),
  ('urology',             'Urology',                          'surgical'),
  ('radiology',           'Radiology',                        'diagnostic'),
  ('pathology',           'Pathology',                        'diagnostic'),
  ('anesthesiology',      'Anesthesiology',                   'allied'),
  ('emergency',           'Emergency Medicine',               'medical'),
  ('family_medicine',     'Family Medicine',                  'primary_care'),
  ('gp',                  'General Practitioner',             'primary_care'),
  ('dental',              'Dental / Dentistry',               'dental'),
  ('other',               'Other',                            'other')
ON CONFLICT (code) DO NOTHING;

-- ── hcp_affiliations (many-to-many doctor ↔ institution) ────────────────────
CREATE TABLE IF NOT EXISTS hcp_affiliations (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  doctor_id       INT           NOT NULL REFERENCES doctor_profiles(id) ON DELETE CASCADE,
  institution_id  INT           NOT NULL REFERENCES institutions(id) ON DELETE CASCADE,
  role            VARCHAR(80),                          -- 'consultant','HOD','visiting','resident','intern','OPD','admitting'
  department      VARCHAR(100),                         -- free-text, e.g. 'Cardiology Dept'
  is_primary      BOOLEAN       DEFAULT FALSE,          -- primary practice site for the doctor
  effective_from  DATE,
  effective_until DATE,                                 -- nullable = currently active
  notes           TEXT,
  created_by      TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  -- Same (doctor, institution, role) shouldn't have overlapping active rows.
  -- Enforced lightly: unique on (doctor_id, institution_id, role, effective_from)
  -- so re-recording the same affiliation start date is rejected. Closing one
  -- (set effective_until) and re-opening with a new effective_from is fine.
  UNIQUE (doctor_id, institution_id, role, effective_from)
);

CREATE INDEX IF NOT EXISTS idx_hcp_affiliations_org_doctor
  ON hcp_affiliations (org_id, doctor_id);
CREATE INDEX IF NOT EXISTS idx_hcp_affiliations_org_institution
  ON hcp_affiliations (org_id, institution_id);
-- Active-only fast lookup (effective_until IS NULL = current)
CREATE INDEX IF NOT EXISTS idx_hcp_affiliations_active
  ON hcp_affiliations (org_id, doctor_id) WHERE effective_until IS NULL;
CREATE INDEX IF NOT EXISTS idx_hcp_affiliations_primary
  ON hcp_affiliations (org_id, doctor_id) WHERE is_primary = TRUE;

-- ── territory_alignments (versioned MR ↔ territory) ─────────────────────────
-- users.territory is a denormalised point-in-time string. This table gives
-- proper history — "who covered Mumbai-North between 2024-01 and 2024-09".
-- The current alignment per user is the row with effective_until IS NULL.
CREATE TABLE IF NOT EXISTS territory_alignments (
  id              SERIAL        PRIMARY KEY,
  org_id          UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                                REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         TEXT          NOT NULL,
  territory       VARCHAR(200)  NOT NULL,
  role_at_time    VARCHAR(40),                           -- snapshot: 'mr','manager' (users.role can change too)
  effective_from  DATE          NOT NULL,
  effective_until DATE,                                  -- NULL = current
  assigned_by     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  -- A user shouldn't have two open alignments at once.
  CONSTRAINT chk_territory_align_dates
    CHECK (effective_until IS NULL OR effective_until >= effective_from)
);

CREATE INDEX IF NOT EXISTS idx_territory_align_org_user
  ON territory_alignments (org_id, user_id, effective_from DESC);
CREATE INDEX IF NOT EXISTS idx_territory_align_org_terr
  ON territory_alignments (org_id, territory);
CREATE INDEX IF NOT EXISTS idx_territory_align_active
  ON territory_alignments (org_id, user_id) WHERE effective_until IS NULL;
-- One open alignment per user per org. Partial unique index does the work.
CREATE UNIQUE INDEX IF NOT EXISTS uniq_territory_align_open_per_user
  ON territory_alignments (org_id, user_id) WHERE effective_until IS NULL;

-- ── doctor_profiles extensions ──────────────────────────────────────────────
-- Add the regulatory + enrichment fields. specialty_code FK is NULLable; the
-- existing string `specialty` column stays for back-compat. A future migration
-- can drop the string once all rows are mapped.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='npi_number') THEN
    ALTER TABLE doctor_profiles ADD COLUMN npi_number VARCHAR(40);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='mci_number') THEN
    ALTER TABLE doctor_profiles ADD COLUMN mci_number VARCHAR(40);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='email') THEN
    ALTER TABLE doctor_profiles ADD COLUMN email VARCHAR(200);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='practice_address') THEN
    ALTER TABLE doctor_profiles ADD COLUMN practice_address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='last_enriched_at') THEN
    ALTER TABLE doctor_profiles ADD COLUMN last_enriched_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='enrichment_metadata') THEN
    ALTER TABLE doctor_profiles ADD COLUMN enrichment_metadata JSONB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='doctor_profiles' AND column_name='specialty_code') THEN
    ALTER TABLE doctor_profiles ADD COLUMN specialty_code VARCHAR(40)
      REFERENCES hcp_specialties_taxonomy(code) ON DELETE SET NULL;
  END IF;
END $$;

-- Within an org, NPI/MCI must be unique if set (regulatory IDs are unique)
CREATE UNIQUE INDEX IF NOT EXISTS uniq_doctor_org_npi
  ON doctor_profiles (org_id, npi_number) WHERE npi_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uniq_doctor_org_mci
  ON doctor_profiles (org_id, mci_number) WHERE mci_number IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_doctor_specialty_code
  ON doctor_profiles (org_id, specialty_code);

-- ── RLS placeholder policies (matches v7–v15 pattern) ──────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY[
    'institutions',
    'hcp_specialties_taxonomy',
    'hcp_affiliations',
    'territory_alignments'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    -- Specialties taxonomy is org-shared (no org_id), but enabling RLS with a
    -- permissive policy keeps the convention uniform; future strict mode can
    -- substitute a "true for everyone" policy here unchanged.
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', tbl);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', tbl);
    EXECUTE format('DROP POLICY IF EXISTS p_%s_permissive ON %I', tbl, tbl);
    EXECUTE format(
      'CREATE POLICY p_%s_permissive ON %I FOR ALL USING (true) WITH CHECK (true)',
      tbl, tbl
    );
  END LOOP;
END $$;

-- ── updated_at trigger for institutions ─────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_institutions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_institutions_updated_at ON institutions;
CREATE TRIGGER set_institutions_updated_at
  BEFORE UPDATE ON institutions
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_institutions_updated_at();
