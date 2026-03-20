-- Migration V6: Sales Module (distributors, secondary_sales, mr_targets)
-- Run AFTER migration_v5_doctor_requests.sql

-- ── Distributors (reference table) ──
CREATE TABLE IF NOT EXISTS distributors (
  id          SERIAL       PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  territory   VARCHAR(200) NOT NULL,
  code        VARCHAR(50)  UNIQUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_distributors_territory ON distributors (territory);

-- ── Secondary Sales (managed by manager, viewed by MR) ──
CREATE TABLE IF NOT EXISTS secondary_sales (
  id              BIGSERIAL     PRIMARY KEY,
  user_id         TEXT          NOT NULL,
  territory       VARCHAR(200)  NOT NULL,
  distributor_id  INTEGER       REFERENCES distributors(id),
  product_id      INTEGER       REFERENCES products(id),
  sale_date       DATE          NOT NULL,
  quantity        INTEGER       NOT NULL CHECK (quantity > 0),
  value           NUMERIC(12,2) NOT NULL CHECK (value >= 0),
  batch_number    VARCHAR(100),
  notes           TEXT,
  uploaded_by     TEXT          NOT NULL,
  upload_batch_id VARCHAR(50),
  created_at      TIMESTAMPTZ   DEFAULT NOW(),
  updated_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ss_user_id     ON secondary_sales (user_id);
CREATE INDEX IF NOT EXISTS idx_ss_territory   ON secondary_sales (territory);
CREATE INDEX IF NOT EXISTS idx_ss_sale_date   ON secondary_sales (sale_date DESC);
CREATE INDEX IF NOT EXISTS idx_ss_product_id  ON secondary_sales (product_id);
CREATE INDEX IF NOT EXISTS idx_ss_distributor ON secondary_sales (distributor_id);
CREATE INDEX IF NOT EXISTS idx_ss_upload      ON secondary_sales (upload_batch_id);

-- ── MR Targets (monthly, per product — managed by manager) ──
CREATE TABLE IF NOT EXISTS mr_targets (
  id           BIGSERIAL     PRIMARY KEY,
  user_id      TEXT          NOT NULL,
  product_id   INTEGER       REFERENCES products(id),
  period       VARCHAR(7)    NOT NULL,
  target_qty   INTEGER       NOT NULL CHECK (target_qty >= 0),
  target_value NUMERIC(12,2) NOT NULL CHECK (target_value >= 0),
  set_by       TEXT          NOT NULL,
  created_at   TIMESTAMPTZ   DEFAULT NOW(),
  updated_at   TIMESTAMPTZ   DEFAULT NOW(),
  UNIQUE(user_id, product_id, period)
);

CREATE INDEX IF NOT EXISTS idx_mt_user_id    ON mr_targets (user_id);
CREATE INDEX IF NOT EXISTS idx_mt_period     ON mr_targets (period);
CREATE INDEX IF NOT EXISTS idx_mt_product_id ON mr_targets (product_id);
