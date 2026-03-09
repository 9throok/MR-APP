-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Doctor Profiles
-- Extracted from existing DCR data + additional profiles
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO doctor_profiles (name, specialty, tier, territory, preferred_visit_day, hospital, notes)
VALUES
  -- Mumbai North territory (Rahul's doctors)
  ('Dr. Anil Mehta', 'Cardiology', 'A', 'Mumbai North', 'Monday', 'Lilavati Hospital', 'High prescriber, prefers morning visits'),
  ('Dr. Sunita Verma', 'General Medicine', 'B', 'Mumbai North', 'Wednesday', 'Nanavati Hospital', 'Interested in new formulations'),
  ('Dr. Pradeep Joshi', 'Nephrology', 'A', 'Mumbai North', 'Tuesday', 'Kokilaben Hospital', 'Key opinion leader'),
  ('Dr. Kavita Rao', 'Endocrinology', 'B', 'Mumbai North', 'Thursday', 'Hinduja Hospital', NULL),

  -- Mumbai South territory (Priya's doctors)
  ('Dr. Rajesh Kapoor', 'Neurology', 'A', 'Mumbai South', 'Tuesday', 'Breach Candy Hospital', 'Prefers clinical data'),
  ('Dr. Meena Shah', 'Internal Medicine', 'B', 'Mumbai South', 'Monday', 'Jaslok Hospital', NULL),
  ('Dr. Vikram Desai', 'Cardiology', 'B', 'Mumbai South', 'Friday', 'Wockhardt Hospital', 'Interested in Bevaas'),
  ('Dr. Anita Patel', 'General Medicine', 'C', 'Mumbai South', 'Wednesday', 'Global Hospital', NULL),

  -- Delhi NCR territory (Robert's doctors)
  ('Dr. Suresh Kumar', 'Cardiology', 'A', 'Delhi NCR', 'Monday', 'Max Hospital', 'Top prescriber in territory'),
  ('Dr. Neha Sharma', 'Neurology', 'B', 'Delhi NCR', 'Thursday', 'Fortis Hospital', NULL),
  ('Dr. Amit Gupta', 'General Medicine', 'B', 'Delhi NCR', 'Tuesday', 'Apollo Hospital', 'Receptive to samples'),
  ('Dr. Pooja Singh', 'Endocrinology', 'A', 'Delhi NCR', 'Wednesday', 'AIIMS', 'Academic KOL'),
  ('Dr. Rakesh Mishra', 'Internal Medicine', 'C', 'Delhi NCR', 'Friday', 'Medanta Hospital', NULL)
ON CONFLICT DO NOTHING;
