-- ─────────────────────────────────────────────────────────────────────────────
-- ZenApp Seed Data
-- 2 MRs, 6 doctors, 3 products, ~60 days of DCR history
--
-- MR IDs (use these in API calls):
--   mr_rahul_001   → Rahul Sharma
--   mr_priya_002   → Priya Mehta
--
-- Run against local Docker:
--   docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed.sql
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE TABLE dcr RESTART IDENTITY CASCADE;

INSERT INTO dcr (user_id, name, date, product, samples, call_summary, rating) VALUES

-- ─────────────────────────────────────────────────────────────────────────────
-- MR: Rahul Sharma (mr_rahul_001)
-- Territory: Mumbai — visits Dr. Kapoor, Dr. Nair, Dr. Sinha
-- ─────────────────────────────────────────────────────────────────────────────

-- Dr. Kapoor — frequent, engaged, but raised side effect concerns twice
('mr_rahul_001', 'Dr. Kapoor',  CURRENT_DATE - 2,  'Cardiozen', 3, 'Good visit. Dr. Kapoor is seeing positive outcomes in hypertensive patients on Cardiozen. Asked about long-term renal impact — I did not have data ready. Need to follow up.', 4),
('mr_rahul_001', 'Dr. Kapoor',  CURRENT_DATE - 18, 'Cardiozen', 2, 'Dr. Kapoor raised concerns about side effects in elderly patients. He wants clinical trial data for patients over 70. Promising lead but needs more evidence.', 3),
('mr_rahul_001', 'Dr. Kapoor',  CURRENT_DATE - 35, 'Cardiozen', 4, 'Introduced Cardiozen. Dr. Kapoor was receptive. Prescribed for 2 patients already. He prefers once-daily dosing — highlighted that feature.', 5),
('mr_rahul_001', 'Dr. Kapoor',  CURRENT_DATE - 52, 'Lipidex',   2, 'Discussed Lipidex as adjunct to statins. Dr. Kapoor said he is happy with current statin brand. Did not take samples.', 2),

-- Dr. Nair — going cold, last visit was 40 days ago, low rating trend
('mr_rahul_001', 'Dr. Nair',    CURRENT_DATE - 40, 'Cardiozen', 1, 'Dr. Nair seemed disengaged. Said he is not seeing the efficacy Cardiozen claims in his patient population. Mentioned a competitor product. Visit was cut short.', 2),
('mr_rahul_001', 'Dr. Nair',    CURRENT_DATE - 58, 'Cardiozen', 3, 'Decent visit. Dr. Nair took samples and said he would trial on new patients. Follow up in 3 weeks.', 3),
('mr_rahul_001', 'Dr. Nair',    CURRENT_DATE - 72, 'Lipidex',   2, 'Introduced Lipidex. Dr. Nair asked about pricing. Did not seem very interested.', 3),

-- Dr. Sinha — new contact, only visited once 5 days ago
('mr_rahul_001', 'Dr. Sinha',   CURRENT_DATE - 5,  'Gluco-R',   4, 'First visit. Dr. Sinha is a diabetologist with a large patient base. Very interested in Gluco-R. Asked for more samples and a clinical study. High potential doctor.', 5),

-- ─────────────────────────────────────────────────────────────────────────────
-- MR: Priya Mehta (mr_priya_002)
-- Territory: Pune — visits Dr. Shah, Dr. Desai, Dr. Joshi
-- ─────────────────────────────────────────────────────────────────────────────

-- Dr. Shah — consistent high performer, strong relationship
('mr_priya_002', 'Dr. Shah',    CURRENT_DATE - 3,  'Gluco-R',   5, 'Excellent visit. Dr. Shah has now prescribed Gluco-R to over 20 patients. Reports very good HbA1c improvements. Asked if we have a paediatric formulation in pipeline.', 5),
('mr_priya_002', 'Dr. Shah',    CURRENT_DATE - 17, 'Gluco-R',   4, 'Dr. Shah is a strong advocate. He recommended Gluco-R to two colleagues at a conference. Requested patient education materials.', 5),
('mr_priya_002', 'Dr. Shah',    CURRENT_DATE - 31, 'Gluco-R',   5, 'Dr. Shah shared positive case study — patient reduced insulin dose after starting Gluco-R. Wants to co-author a case report.', 5),
('mr_priya_002', 'Dr. Shah',    CURRENT_DATE - 45, 'Lipidex',   3, 'Discussed Lipidex. Dr. Shah is open but wants to see lipid panel outcomes data. Will review and get back.', 4),
('mr_priya_002', 'Dr. Shah',    CURRENT_DATE - 60, 'Gluco-R',   3, 'Initial pitch of Gluco-R. Dr. Shah was cautious but curious. Said he would try on 2-3 stable patients first.', 4),

-- Dr. Desai — mixed results, objection on pricing, last visited 22 days ago
('mr_priya_002', 'Dr. Desai',   CURRENT_DATE - 22, 'Lipidex',   2, 'Dr. Desai raised affordability concern — patients in his practice cannot afford branded Lipidex. Suggested offering samples for 3 months. Needs pricing discussion.', 3),
('mr_priya_002', 'Dr. Desai',   CURRENT_DATE - 38, 'Lipidex',   4, 'Moderate visit. Dr. Desai trialled Lipidex on 5 patients. Reports 2 had mild GI issues. Said tolerability needs improvement.', 3),
('mr_priya_002', 'Dr. Desai',   CURRENT_DATE - 55, 'Lipidex',   3, 'First visit with Dr. Desai. Introduced Lipidex. He seems high-volume but price-sensitive.', 3),

-- Dr. Joshi — completely cold, not visited in 50 days, was high-rating before
('mr_priya_002', 'Dr. Joshi',   CURRENT_DATE - 50, 'Cardiozen', 2, 'Dr. Joshi was unavailable for most of the visit. Left samples with receptionist. No real engagement.', 2),
('mr_priya_002', 'Dr. Joshi',   CURRENT_DATE - 65, 'Cardiozen', 3, 'Dr. Joshi was enthusiastic about Cardiozen initially. Said he would prescribe for post-MI patients. Requested 10 samples.', 4),
('mr_priya_002', 'Dr. Joshi',   CURRENT_DATE - 80, 'Cardiozen', 4, 'Great first interaction. Dr. Joshi runs a busy cardiology clinic. Very open to Cardiozen. High potential.', 5);
