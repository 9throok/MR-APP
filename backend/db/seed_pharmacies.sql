-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Pharmacy Profiles
-- Names match RCPA dummy data pharmacies for data consistency
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO pharmacy_profiles (name, type, tier, territory, preferred_visit_day, address, phone, contact_person, notes)
VALUES
  -- Mumbai North territory (Rahul's pharmacies)
  ('CVS Pharmacy', 'chain', 'A', 'Mumbai North', 'Monday', 'Shop 12, MG Road, Andheri West', '+91 98765 43220', 'Mr. Ramesh Gupta', 'High footfall, key RCPA audit point'),
  ('Walgreens', 'chain', 'B', 'Mumbai North', 'Wednesday', '45 Link Road, Malad West', '+91 98765 43221', 'Mr. Sunil Jain', 'Good for Rilast range'),
  ('Rite Aid', 'retail', 'B', 'Mumbai North', 'Friday', '78 Station Road, Borivali', '+91 98765 43222', 'Mr. Deepak Shah', 'Strong Bevaas sales territory'),
  ('Walmart Pharmacy', 'chain', 'A', 'Mumbai North', 'Tuesday', '23 SV Road, Goregaon', '+91 98765 43223', 'Mr. Arun Patel', 'Large order volumes'),

  -- Mumbai South territory (Priya's pharmacies)
  ('Kroger Pharmacy', 'chain', 'B', 'Mumbai South', 'Tuesday', '101 Colaba Causeway, Colaba', '+91 98765 43224', 'Mr. Nikhil Desai', 'Specialist prescriptions area'),
  ('Target Pharmacy', 'retail', 'B', 'Mumbai South', 'Thursday', '55 Hill Road, Bandra West', '+91 98765 43225', 'Mrs. Prerna Mehta', 'Good Bevaas demand'),
  ('Costco Pharmacy', 'chain', 'A', 'Mumbai South', 'Monday', '200 Marine Drive, Churchgate', '+91 98765 43226', 'Mr. Vivek Sharma', 'Premium clientele, high-value orders'),

  -- Delhi NCR territory (Robert's pharmacies)
  ('Safeway Pharmacy', 'retail', 'B', 'Delhi NCR', 'Wednesday', '34 Connaught Place, New Delhi', '+91 98765 43227', 'Mr. Rajiv Khanna', 'Good paediatric Rilast Syrup sales'),
  ('MedPlus Pharmacy', 'chain', 'A', 'Delhi NCR', 'Monday', '12 Nehru Place, New Delhi', '+91 98765 43228', 'Mr. Sanjay Kumar', 'High prescription volume, key account'),
  ('Apollo Pharmacy', 'chain', 'A', 'Delhi NCR', 'Thursday', '88 Karol Bagh, New Delhi', '+91 98765 43229', 'Mrs. Anita Singh', 'Hospital-adjacent, strong footfall'),
  ('Wellness Forever Pharmacy', 'chain', 'B', 'Delhi NCR', 'Tuesday', '56 Rajouri Garden, New Delhi', '+91 98765 43230', 'Mr. Vikash Tiwari', 'Growing chain, good generic stocking')
ON CONFLICT DO NOTHING;
