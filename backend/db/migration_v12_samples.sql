-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V12 — Sample Inventory + Movements
--
-- Two tables that together form the chain-of-custody for physical drug samples
-- distributed by MRs. This is a Phase A.6 deliverable but it also feeds Phase C
-- compliance (sample chain-of-custody is regulated in most jurisdictions).
--
--   - sample_stock      : current quantity per (MR, product, lot). One row per
--                         lot per MR — each lot has its own expiry date and is
--                         tracked separately.
--   - sample_movements  : append-only ledger of every change to stock:
--                         allocation (manager → MR), distribution (MR → doctor),
--                         return (MR → manager), adjustment (correction),
--                         expiry (lot expired in MR's possession).
--
-- The stock row's quantity = SUM of movements for that (user_id, product_id,
-- lot_number) where movement_type 'allocation' / 'return' (incoming) is +qty
-- and 'distribution' / 'expiry' is -qty. The app maintains the cached
-- quantity on every movement insert.
--
-- Run AFTER: migration_v11_orders.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Sample Stock (current balance per MR per lot) ──────────────────────────
CREATE TABLE IF NOT EXISTS sample_stock (
  id            SERIAL       PRIMARY KEY,
  org_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                             REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id       TEXT         NOT NULL,
  product_id    INT          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  -- Lot/batch identifier from the manufacturer. Different lots = different rows.
  lot_number    VARCHAR(100) NOT NULL,
  expiry_date   DATE,
  -- Cached current balance, recomputed on each movement insert.
  quantity      INT          NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  last_updated  TIMESTAMPTZ  DEFAULT NOW(),
  -- One row per (org, user, product, lot) — that combination is the
  -- canonical "stock SKU" an MR holds.
  UNIQUE (org_id, user_id, product_id, lot_number)
);

CREATE INDEX IF NOT EXISTS idx_sample_stock_org_user
  ON sample_stock (org_id, user_id);
CREATE INDEX IF NOT EXISTS idx_sample_stock_org_product
  ON sample_stock (org_id, product_id);
CREATE INDEX IF NOT EXISTS idx_sample_stock_expiry
  ON sample_stock (org_id, expiry_date) WHERE expiry_date IS NOT NULL;

-- ── Sample Movements (append-only ledger) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS sample_movements (
  id              SERIAL       PRIMARY KEY,
  org_id          UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                               REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id         TEXT         NOT NULL,
  product_id      INT          NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  lot_number      VARCHAR(100) NOT NULL,
  movement_type   VARCHAR(20)  NOT NULL
                               CHECK (movement_type IN (
                                 'allocation', 'distribution', 'return',
                                 'adjustment', 'expiry'
                               )),
  -- Quantity is always recorded as a positive number; the SIGN of the
  -- movement is implied by movement_type. The app applies the sign when
  -- updating sample_stock. This keeps the audit trail human-readable.
  quantity        INT          NOT NULL CHECK (quantity > 0),
  -- Source / target of the movement, depending on type:
  --   allocation   → recorded_by = manager who allocated, ref_user_id NULL
  --   distribution → ref_dcr_id + ref_doctor_id set (or doctor_name)
  --   return       → recorded_by = manager who received
  --   adjustment   → recorded_by = whoever corrected
  --   expiry       → automatic, recorded_by NULL
  ref_dcr_id      BIGINT       REFERENCES dcr(id)             ON DELETE SET NULL,
  ref_doctor_id   INT          REFERENCES doctor_profiles(id) ON DELETE SET NULL,
  doctor_name     TEXT,
  recorded_by     TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sample_movements_org_user_date
  ON sample_movements (org_id, user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sample_movements_org_product_lot
  ON sample_movements (org_id, product_id, lot_number, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sample_movements_type
  ON sample_movements (org_id, movement_type);
CREATE INDEX IF NOT EXISTS idx_sample_movements_dcr
  ON sample_movements (ref_dcr_id) WHERE ref_dcr_id IS NOT NULL;

-- ── RLS placeholder policies ────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['sample_stock', 'sample_movements'];
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
