-- ─────────────────────────────────────────────────────────────────────────────
-- RCPA Dummy Data — Competitor prescription audit from pharmacies
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO rcpa (user_id, pharmacy, doctor_name, our_brand, our_value, competitor_brand, competitor_company, competitor_value, date) VALUES

-- ── Rahul Sharma (mr_rahul_001) — Mumbai North ─────────────────────────────

-- CVS Pharmacy — Dr. Anil Mehta prescriptions
('mr_rahul_001', 'CVS Pharmacy', 'Dr. Anil Mehta', 'Derise 10mg', 45, 'Zyrtec (Cetirizine)', 'Johnson & Johnson', 120, CURRENT_DATE - 5),
('mr_rahul_001', 'CVS Pharmacy', 'Dr. Anil Mehta', 'Derise 10mg', 45, 'Allegra 180mg', 'Sanofi', 80, CURRENT_DATE - 5),
('mr_rahul_001', 'CVS Pharmacy', 'Dr. Anil Mehta', 'Derise 20mg', 20, 'Xyzal (Levocetirizine)', 'Sanofi', 55, CURRENT_DATE - 5),

-- Walgreens — Dr. Sunita Verma prescriptions
('mr_rahul_001', 'Walgreens', 'Dr. Sunita Verma', 'Rilast Tablet', 30, 'Montair (Montelukast)', 'Cipla', 85, CURRENT_DATE - 8),
('mr_rahul_001', 'Walgreens', 'Dr. Sunita Verma', 'Rilast Syrup', 25, 'Singulair Syrup', 'MSD', 40, CURRENT_DATE - 8),

-- Rite Aid — Dr. Pradeep Joshi prescriptions
('mr_rahul_001', 'Rite Aid', 'Dr. Pradeep Joshi', 'Bevaas 5mg', 35, 'Amlokind 5mg', 'USV', 60, CURRENT_DATE - 3),
('mr_rahul_001', 'Rite Aid', 'Dr. Pradeep Joshi', 'Bevaas 10mg', 15, 'Amtas 10mg', 'Cipla', 45, CURRENT_DATE - 3),
('mr_rahul_001', 'Rite Aid', 'Dr. Pradeep Joshi', 'Bevaas 5mg', 35, 'Stamlo 5mg', 'Sun Pharma', 50, CURRENT_DATE - 3),

-- Walmart Pharmacy — Dr. Ramesh Patil prescriptions
('mr_rahul_001', 'Walmart Pharmacy', 'Dr. Ramesh Patil', 'Bevaas 10mg', 20, 'Stamlo 10mg', 'Sun Pharma', 70, CURRENT_DATE - 10),
('mr_rahul_001', 'Walmart Pharmacy', 'Dr. Ramesh Patil', 'Derise 10mg', 30, 'Okacet (Cetirizine)', 'Cipla', 55, CURRENT_DATE - 10),

-- ── Priya Patel (mr_priya_002) — Mumbai South ──────────────────────────────

-- CVS Pharmacy — Dr. Meena Shah prescriptions
('mr_priya_002', 'CVS Pharmacy', 'Dr. Meena Shah', 'Derise 20mg', 60, 'Bilastine 20mg', 'Menarini', 35, CURRENT_DATE - 2),
('mr_priya_002', 'CVS Pharmacy', 'Dr. Meena Shah', 'Derise 10mg', 40, 'Alerid (Cetirizine)', 'Cipla', 90, CURRENT_DATE - 2),

-- Kroger Pharmacy — Dr. Vikram Desai prescriptions
('mr_priya_002', 'Kroger Pharmacy', 'Dr. Vikram Desai', 'Rilast Tablet', 25, 'Montair 10mg', 'Cipla', 95, CURRENT_DATE - 12),
('mr_priya_002', 'Kroger Pharmacy', 'Dr. Vikram Desai', 'Rilast Capsule', 10, 'Singulair 10mg', 'MSD', 30, CURRENT_DATE - 12),

-- Target Pharmacy — Dr. Rajesh Kapoor prescriptions
('mr_priya_002', 'Target Pharmacy', 'Dr. Rajesh Kapoor', 'Bevaas 5mg', 20, 'Amlokind 5mg', 'USV', 75, CURRENT_DATE - 6),
('mr_priya_002', 'Target Pharmacy', 'Dr. Rajesh Kapoor', 'Bevaas 10mg', 10, 'Telma-AM', 'Abbott', 50, CURRENT_DATE - 6),

-- Costco Pharmacy — Dr. Anita Patel prescriptions
('mr_priya_002', 'Costco Pharmacy', 'Dr. Anita Patel', 'Derise 50mg', 15, 'Hydroxyzine 25mg', 'Various', 40, CURRENT_DATE - 15),
('mr_priya_002', 'Costco Pharmacy', 'Dr. Anita Patel', 'Rilast Syrup', 20, 'Montair LC Kid', 'Cipla', 35, CURRENT_DATE - 15),

-- ── Robert Johnson (mr_robert_003) — Delhi NCR ─────────────────────────────

-- MedPlus Pharmacy — Dr. Neha Sharma prescriptions
('mr_robert_003', 'MedPlus Pharmacy', 'Dr. Neha Sharma', 'Derise 10mg', 55, 'Zyrtec (Cetirizine)', 'Johnson & Johnson', 100, CURRENT_DATE - 4),
('mr_robert_003', 'MedPlus Pharmacy', 'Dr. Neha Sharma', 'Derise 20mg', 25, 'Allegra 180mg', 'Sanofi', 45, CURRENT_DATE - 4),
('mr_robert_003', 'MedPlus Pharmacy', 'Dr. Neha Sharma', 'Bevaas 5mg', 10, 'Amlokind 5mg', 'USV', 30, CURRENT_DATE - 4),

-- Apollo Pharmacy — Dr. Suresh Kumar prescriptions
('mr_robert_003', 'Apollo Pharmacy', 'Dr. Suresh Kumar', 'Rilast Tablet', 35, 'Montair 10mg', 'Cipla', 80, CURRENT_DATE - 7),
('mr_robert_003', 'Apollo Pharmacy', 'Dr. Suresh Kumar', 'Rilast Capsule', 20, 'Singulair 10mg', 'MSD', 25, CURRENT_DATE - 7),
('mr_robert_003', 'Apollo Pharmacy', 'Dr. Suresh Kumar', 'Derise 20mg', 15, 'Deslor (Desloratadine)', 'Glenmark', 20, CURRENT_DATE - 7),

-- Wellness Forever Pharmacy — Dr. Amit Gupta prescriptions
('mr_robert_003', 'Wellness Forever Pharmacy', 'Dr. Amit Gupta', 'Bevaas 10mg', 30, 'Amtas-AT', 'Cipla', 65, CURRENT_DATE - 9),
('mr_robert_003', 'Wellness Forever Pharmacy', 'Dr. Amit Gupta', 'Bevaas 5mg', 25, 'Stamlo 5mg', 'Sun Pharma', 40, CURRENT_DATE - 9),

-- Safeway Pharmacy — Dr. Pooja Singh prescriptions
('mr_robert_003', 'Safeway Pharmacy', 'Dr. Pooja Singh', 'Bevaas 20mg', 10, 'Amtas 10mg', 'Cipla', 35, CURRENT_DATE - 14),
('mr_robert_003', 'Safeway Pharmacy', 'Dr. Pooja Singh', 'Derise 50mg', 8, 'Deslor Plus', 'Glenmark', 15, CURRENT_DATE - 14),

-- MedPlus Pharmacy — Dr. Rakesh Mishra prescriptions
('mr_robert_003', 'MedPlus Pharmacy', 'Dr. Rakesh Mishra', 'Rilast Syrup', 40, 'Montair LC Kid', 'Cipla', 55, CURRENT_DATE - 11),
('mr_robert_003', 'MedPlus Pharmacy', 'Dr. Rakesh Mishra', 'Rilast Tablet', 20, 'Montair 10mg', 'Cipla', 30, CURRENT_DATE - 11);
