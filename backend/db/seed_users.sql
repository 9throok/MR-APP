-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Users
-- Default password for all users: "password123"
-- bcrypt hash generated with 10 salt rounds
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO users (username, email, password_hash, role, name, territory, user_id)
VALUES
  ('rahul', 'rahul.sharma@zenrac.com', '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS', 'mr', 'Rahul Sharma', 'Mumbai North', 'mr_rahul_001'),
  ('priya', 'priya.patel@zenrac.com', '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS', 'mr', 'Priya Patel', 'Mumbai South', 'mr_priya_002'),
  ('robert', 'robert.johnson@zenrac.com', '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS', 'mr', 'Robert Johnson', 'Delhi NCR', 'mr_robert_003'),
  ('manager1', 'manager@zenrac.com', '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS', 'manager', 'Vikram Singh', 'All', 'mgr_vikram_001'),
  ('admin', 'admin@zenrac.com', '$2b$10$iIiAmrnclY.ZTRkxftd/C.6yLWiN3DJVGwEt2vB1dkrWiUWz75HSS', 'admin', 'Admin User', 'All', 'admin_001')
ON CONFLICT (org_id, username) DO NOTHING;
