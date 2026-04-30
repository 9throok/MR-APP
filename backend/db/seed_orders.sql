-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Orders — demo bookings across personas, customer types, and statuses
--
-- Run AFTER: migration_v11_orders.sql + seed_users.sql + seed_doctors.sql
--           + seed_pharmacies.sql + seed_sales_data.sql (for distributors)
--           + dummy_data.sql (for products)
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE orders RESTART IDENTITY CASCADE;

-- ── Rahul (Mumbai North): FULFILLED order to a doctor (placed last week) ───
INSERT INTO orders
  (user_id, customer_type, doctor_id, customer_name, order_date, status, currency, total_amount, notes)
VALUES
  ('mr_rahul_001', 'doctor', 1, 'Dr. Anil Mehta',
   CURRENT_DATE - INTERVAL '7 days', 'fulfilled', 'INR', 0,
   'Trial pack for new patients');

INSERT INTO order_line_items
  (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
VALUES
  (1, 1, 'Derise 10mg', 'DER-10', 100, 8.00, 800.00),
  (1, 2, 'Derise 20mg', 'DER-20', 50,  14.00, 700.00);

UPDATE orders SET total_amount = (SELECT SUM(line_total) FROM order_line_items WHERE order_id = 1)
 WHERE id = 1;

-- ── Priya (Mumbai South): PLACED order to a pharmacy ──────────────────────
INSERT INTO orders
  (user_id, customer_type, pharmacy_id, customer_name, order_date, status, currency, total_amount, notes)
VALUES
  ('mr_priya_002', 'pharmacy', 1,
   (SELECT name FROM pharmacy_profiles WHERE id = 1),
   CURRENT_DATE - INTERVAL '2 days', 'placed', 'INR', 0,
   'Restock for South Mumbai chain');

INSERT INTO order_line_items
  (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
VALUES
  (2, 4, 'Rilast Tablet',  'RIL-T',  200, 12.00, 2400.00),
  (2, 5, 'Rilast Capsule', 'RIL-C',  150, 18.00, 2700.00),
  (2, 7, 'Bevaas 5mg',     'BEV-5',  100, 22.00, 2200.00);

UPDATE orders SET total_amount = (SELECT SUM(line_total) FROM order_line_items WHERE order_id = 2)
 WHERE id = 2;

-- ── Robert (Delhi NCR): PLACED order to a distributor ─────────────────────
-- Only insert if a distributor exists (depends on seed_sales_data.sql being run)
INSERT INTO orders
  (user_id, customer_type, distributor_id, customer_name, order_date, status, currency, total_amount, notes)
SELECT
  'mr_robert_003', 'distributor', d.id, d.name,
  CURRENT_DATE - INTERVAL '1 day', 'placed', 'INR', 0,
  'Q2 distributor stock'
FROM distributors d
WHERE d.territory = 'Delhi NCR'
LIMIT 1;

INSERT INTO order_line_items
  (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
SELECT 3, 7, 'Bevaas 5mg',  'BEV-5',  500, 22.00, 11000.00 FROM orders WHERE id = 3
UNION ALL
SELECT 3, 8, 'Bevaas 10mg', 'BEV-10', 300, 32.00, 9600.00  FROM orders WHERE id = 3;

UPDATE orders SET total_amount = (SELECT COALESCE(SUM(line_total), 0) FROM order_line_items WHERE order_id = 3)
 WHERE id = 3;

-- ── Robert: DRAFT order being assembled ──────────────────────────────────
INSERT INTO orders
  (user_id, customer_type, doctor_id, customer_name, order_date, status, currency, total_amount, notes)
VALUES
  ('mr_robert_003', 'doctor', 13,
   (SELECT name FROM doctor_profiles WHERE id = 13),
   CURRENT_DATE, 'draft', 'INR', 0,
   'Building this order — still confirming quantities');

INSERT INTO order_line_items
  (order_id, product_id, product_name, sku, quantity, unit_price, line_total)
VALUES
  (4, 7, 'Bevaas 5mg', 'BEV-5', 50, 22.00, 1100.00);

UPDATE orders SET total_amount = (SELECT SUM(line_total) FROM order_line_items WHERE order_id = 4)
 WHERE id = 4;
