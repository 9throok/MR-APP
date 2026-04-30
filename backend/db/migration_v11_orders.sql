-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Migration V11 — Order Booking
--
-- Adds:
--   - orders            : header per order (one customer, one date, MR who booked)
--   - order_line_items  : product lines (qty × unit_price = line_total)
--
-- Customer can be a doctor, pharmacy, or distributor. We use a discriminator
-- (customer_type) + a single nullable customer_id, with a CHECK that exactly
-- one of the three FK columns is set. This keeps queries simple and lets the
-- LEFT JOIN pattern work for any customer type.
--
-- Run AFTER: migration_v10_leaves.sql
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Orders (header) ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            SERIAL       PRIMARY KEY,
  org_id        UUID         NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                             REFERENCES organizations(id) ON DELETE RESTRICT,
  user_id       TEXT         NOT NULL,                          -- MR who booked
  order_date    DATE         NOT NULL DEFAULT CURRENT_DATE,
  customer_type VARCHAR(20)  NOT NULL
                             CHECK (customer_type IN ('doctor', 'pharmacy', 'distributor')),
  doctor_id      INT         REFERENCES doctor_profiles(id)   ON DELETE SET NULL,
  pharmacy_id    INT         REFERENCES pharmacy_profiles(id) ON DELETE SET NULL,
  distributor_id INT         REFERENCES distributors(id)      ON DELETE SET NULL,
  -- Snapshotted name so the order list still reads cleanly even if the FK
  -- target is later deleted (FKs go to NULL on DELETE SET NULL).
  customer_name TEXT         NOT NULL,
  currency      VARCHAR(3)   NOT NULL DEFAULT 'INR',
  total_amount  NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        VARCHAR(20)  NOT NULL DEFAULT 'placed'
                             CHECK (status IN ('draft', 'placed', 'fulfilled', 'cancelled')),
  notes         TEXT,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW(),
  CONSTRAINT chk_orders_total
    CHECK (total_amount >= 0),
  -- Exactly one customer FK matches the customer_type
  CONSTRAINT chk_orders_customer_fk CHECK (
    (customer_type = 'doctor'      AND doctor_id      IS NOT NULL AND pharmacy_id IS NULL AND distributor_id IS NULL)
    OR (customer_type = 'pharmacy'    AND pharmacy_id    IS NOT NULL AND doctor_id   IS NULL AND distributor_id IS NULL)
    OR (customer_type = 'distributor' AND distributor_id IS NOT NULL AND doctor_id   IS NULL AND pharmacy_id    IS NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_orders_org_user_date
  ON orders (org_id, user_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_orders_org_status
  ON orders (org_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_org_customer
  ON orders (org_id, customer_type, COALESCE(doctor_id, pharmacy_id, distributor_id));

-- ── Order Line Items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS order_line_items (
  id            SERIAL        PRIMARY KEY,
  org_id        UUID          NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001'
                              REFERENCES organizations(id) ON DELETE RESTRICT,
  order_id      INT           NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id    INT           REFERENCES products(id) ON DELETE SET NULL,
  -- Snapshot of product name + SKU at order time so historical line reads
  -- don't break if the catalog row is renamed/deleted.
  product_name  TEXT          NOT NULL,
  sku           VARCHAR(100),
  quantity      INT           NOT NULL CHECK (quantity > 0),
  unit_price    NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
  -- line_total is computed but stored (read-perf vs eternal recompute);
  -- app maintains it on insert/update for consistency with header total.
  line_total    NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
  created_at    TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_lines_org_order
  ON order_line_items (org_id, order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_org_product
  ON order_line_items (org_id, product_id) WHERE product_id IS NOT NULL;

-- ── RLS placeholder policies ────────────────────────────────────────────────
DO $$
DECLARE
  tbl TEXT;
  tables TEXT[] := ARRAY['orders', 'order_line_items'];
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

-- ── updated_at trigger for orders ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION trigger_set_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_orders_updated_at ON orders;
CREATE TRIGGER set_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION trigger_set_orders_updated_at();
