INSERT INTO products (name) VALUES
('Derise 10mg'),
('Derise 20mg'),
('Derise 50mg'),
('Rilast Tablet'),
('Rilast Capsule'),
('Rilast Syrup'),
('Bevaas 5mg'),
('Bevaas 10mg'),
('Bevaas 20mg');

INSERT INTO dcr (user_id,name,date,product,samples,call_summary,doctor_feedback) VALUES

-- ============================================================================
-- RAHUL SHARMA (mr_rahul_001) — IDs 1-10
-- ============================================================================

-- ID 1: Dr. Anil Mehta, CURRENT_DATE-2, Derise 10mg
('mr_rahul_001','Dr. Anil Mehta',(CURRENT_DATE-2),'Derise 10mg',
'[{"id":1,"name":"Derise 10mg","quantity":3}]',
'Presented Derise 10mg non-sedating advantage for allergy OPD. Doctor currently prescribing cetirizine (Zyrtec) to ~40 patients/month. Highlighted DREAM trial data showing 0.7% drowsiness vs cetirizine 3.1%. Doctor agreed to trial Derise in 10 patients who complained of daytime sedation on cetirizine.',
'Patients reporting less drowsiness is compelling. Will trial with morning-shift workers first who cannot afford sedation.'),

-- ID 2: Dr. Anil Mehta, CURRENT_DATE-18, Derise 20mg
('mr_rahul_001','Dr. Anil Mehta',(CURRENT_DATE-18),'Derise 20mg',
'[{"id":1,"name":"Derise 20mg","quantity":2}]',
'Doctor evaluating Derise 20mg for resistant allergic rhinitis cases not responding to 10mg. Currently using Allegra (fexofenadine) 180mg as step-up, but patients report incomplete symptom control. Shared COMPASS study data showing 71% hive reduction at 20mg. Doctor skeptical about cost difference vs generic fexofenadine.',
'Need to see cost-benefit analysis. Generic fexofenadine is half the price — patients in this area are price-sensitive.'),

-- ID 3: Dr. Sunita Verma, CURRENT_DATE-5, Rilast Tablet
('mr_rahul_001','Dr. Sunita Verma',(CURRENT_DATE-5),'Rilast Tablet',
'[{"id":2,"name":"Rilast Tablet","quantity":4}]',
'Discussed Rilast Tablet as add-on therapy for 15 chronic asthma patients currently on ICS alone. Doctor using Singulair (branded montelukast) for some patients but finds it expensive. Presented Rilast pricing advantage — 40% lower than Singulair with same bioequivalence data. Doctor concerned about FDA neuropsychiatric boxed warning.',
'Worried about the mood-related side effects after reading the FDA update. Need reassurance with local safety data.'),

-- ID 4: Dr. Sunita Verma, CURRENT_DATE-21, Rilast Syrup
('mr_rahul_001','Dr. Sunita Verma',(CURRENT_DATE-21),'Rilast Syrup',
'[{"id":3,"name":"Rilast Syrup","quantity":3}]',
'Discussed Rilast Syrup for paediatric asthma patients aged 3-8. Doctor manages ~25 paediatric asthma cases. Many parents are asking about Ayurvedic alternatives like Vasaka and Tulsi syrups. Explained that Rilast works on leukotriene pathway which herbal remedies do not target. Doctor wants palatability feedback from parents.',
'Parents reported improved nighttime breathing within 10 days. Taste is acceptable — better than competitor syrup.'),

-- ID 5: Dr. Pradeep Joshi, CURRENT_DATE-18, Bevaas 5mg
('mr_rahul_001','Dr. Pradeep Joshi',(CURRENT_DATE-18),'Bevaas 5mg',
'[{"id":4,"name":"Bevaas 5mg","quantity":5}]',
'Doctor treating 30+ mild hypertension patients. Currently using Telmisartan (ARB) as first-line for most patients. Presented Bevaas 5mg as alternative first-line CCB with ASCOT trial evidence. Doctor prefers ARBs for renoprotective benefit in diabetic patients. Discussed that Bevaas is better suited for isolated systolic hypertension in elderly.',
'BP reduction seen within 2 weeks in 3 elderly patients I tried Bevaas on. But I still prefer Telmisartan for my diabetic population.'),

-- ID 6: Dr. Pradeep Joshi, CURRENT_DATE-26, Bevaas 10mg
('mr_rahul_001','Dr. Pradeep Joshi',(CURRENT_DATE-26),'Bevaas 10mg',
'[{"id":5,"name":"Bevaas 10mg","quantity":3}]',
'Discussed step-up from Bevaas 5mg to 10mg for 5 patients not achieving BP target (<140/90). Doctor raised concern about ankle edema reported by 2 patients at 5mg dose. Suggested combining with low-dose ACE inhibitor (Ramipril 2.5mg) to counteract edema — ASCOT regimen. Doctor also asked about Cipla amlodipine pricing vs Bevaas.',
'Edema is a real concern for my patients — they stop taking the medication. Cipla brand is ₹2 cheaper per strip. Need better pricing.'),

-- ID 7: Dr. Kavita Rao, CURRENT_DATE-22, Derise 50mg
('mr_rahul_001','Dr. Kavita Rao',(CURRENT_DATE-22),'Derise 50mg',
'[{"id":6,"name":"Derise 50mg","quantity":2}]',
'Reviewed Derise 50mg outcomes in 8 severe chronic urticaria patients. Doctor is a dermatology specialist treating refractory cases. 6 patients showed >70% improvement in DLQI scores. One patient reported unusual drowsiness at 50mg — doctor reduced to 20mg. Doctor asked about omalizumab as next step for 2 non-responders.',
'Works well in chronic urticaria — better than hydroxyzine which knocks patients out. But 50mg sedation in that one case concerns me.'),

-- ID 8: Dr. Kavita Rao, CURRENT_DATE-34, Rilast Capsule
('mr_rahul_001','Dr. Kavita Rao',(CURRENT_DATE-34),'Rilast Capsule',
'[{"id":7,"name":"Rilast Capsule","quantity":4}]',
'Introduced Rilast Capsule (sustained-release) for adult asthma patients with early morning wheeze. Doctor currently uses Rilast Tablet but patients complain of symptoms breaking through at 4-5 AM. Capsule provides steadier plasma levels overnight. Doctor wants head-to-head pharmacokinetic comparison data before switching existing patients.',
'Interesting concept — early morning wheeze is a real problem. Send me the PK comparison study. Will not switch patients without evidence.'),

-- ID 9: Dr. Ramesh Patil, CURRENT_DATE-35, Bevaas 20mg
('mr_rahul_001','Dr. Ramesh Patil',(CURRENT_DATE-35),'Bevaas 20mg',
'[{"id":8,"name":"Bevaas 20mg","quantity":3}]',
'Discussed Bevaas 5mg for newly diagnosed hypertensives in OPD. Doctor treats 30+ hypertension patients monthly. Currently using Sun Pharma amlodipine brand. Open to switching if pricing is competitive. Presented Zenrac-BEV-002 real-world data showing 72% BP goal achievement at 24 weeks.',
'Open to switching if pricing is competitive. Wants samples for trial in 10 new patients next month.'),

-- ID 10: Dr. Ramesh Patil, CURRENT_DATE-42, Derise 10mg
('mr_rahul_001','Dr. Ramesh Patil',(CURRENT_DATE-42),'Derise 10mg',
'[{"id":1,"name":"Derise 10mg","quantity":3}]',
'Initial visit to introduce Derise 10mg for allergy OPD. Doctor was using levocetirizine as first-line antihistamine. Shared ARIA trial data showing Derise superior onset of action (1.25 hours for nasal symptoms). Doctor concerned about formulary restrictions at the attached government hospital — needs to justify new drug additions.',
'Levocetirizine works fine for me. Will consider Derise only if you can get it on the hospital formulary list.'),

-- ============================================================================
-- PRIYA MEHTA (mr_priya_002) — IDs 11-18
-- ============================================================================

-- ID 11: Dr. Meena Shah, CURRENT_DATE-1, Derise 20mg
('mr_priya_002','Dr. Meena Shah',(CURRENT_DATE-1),'Derise 20mg',
'[{"id":1,"name":"Derise 20mg","quantity":5}]',
'Derise 20mg follow-up in allergy OPD. Doctor now prescribing to 20+ patients regularly. Compliance at 88% based on refill data. Patients prefer once-daily convenience over twice-daily cetirizine. Doctor asking for patient education pamphlets in Hindi and Marathi for low-literacy patients.',
'Patients prefer once daily dosing. Best antihistamine compliance I have seen. Get me those pamphlets.'),

-- ID 12: Dr. Meena Shah, CURRENT_DATE-16, Derise 10mg
('mr_priya_002','Dr. Meena Shah',(CURRENT_DATE-16),'Derise 10mg',
'[{"id":2,"name":"Derise 10mg","quantity":4}]',
'Discussed Derise 10mg for mild seasonal allergic rhinitis. Doctor raised concern about a 45-year-old female patient who developed persistent dry mouth on Derise 10mg. Reviewed adverse effect profile — dry mouth occurs in 3.1% of patients. Suggested taking with water before bedtime. Doctor also comparing with Bilastine (newer antihistamine) that a competitor MR is pushing hard.',
'Bilastine rep is offering free CME sponsorship. Your pricing is good but Bilastine claims faster onset. Need comparative data.'),

-- ID 13: Dr. Vikram Desai, CURRENT_DATE-25, Rilast Tablet
('mr_priya_002','Dr. Vikram Desai',(CURRENT_DATE-25),'Rilast Tablet',
'[{"id":3,"name":"Rilast Tablet","quantity":3}]',
'Doctor reviewing Rilast Tablet for 12 adult asthma patients as step-up from ICS monotherapy. Doctor is a pulmonologist with special interest in severe asthma. Wants long-term (>1 year) efficacy data on reduction of exacerbations. Discussed real-world adherence advantage of oral tablet vs additional inhaler. Competitor Montair (Cipla) currently dominates this doctor''s prescriptions.',
'Montair has been reliable for years. Why should I switch? Show me 52-week exacerbation reduction data.'),

-- ID 14: Dr. Vikram Desai, CURRENT_DATE-36, Rilast Capsule
('mr_priya_002','Dr. Vikram Desai',(CURRENT_DATE-36),'Rilast Capsule',
'[{"id":4,"name":"Rilast Capsule","quantity":2}]',
'Introduced Rilast Capsule sustained-release formulation for adult asthma patients with nocturnal symptoms. Doctor trialing in 5 patients with poor symptom control on standard tablet. Discussed that some patients are also using homeopathic Arsenicum Album for wheezing — explained that montelukast mechanism (CysLT1 blockade) is complementary, not conflicting, but efficacy of homeopathic remedies is unproven.',
'Patients ask me about homeopathy all the time. I do not recommend it but I need to know about interactions. Trial capsules look promising — let me see how 4-AM wheeze control improves.'),

-- ID 15: Dr. Rajesh Kapoor, CURRENT_DATE-35, Bevaas 5mg (cold — last visit 35+ days ago)
('mr_priya_002','Dr. Rajesh Kapoor',(CURRENT_DATE-35),'Bevaas 5mg',
'[{"id":5,"name":"Bevaas 5mg","quantity":5}]',
'Doctor treating newly diagnosed hypertension in a semi-urban clinic. Patient population is mostly 45-65 age group, many with diabetes comorbidity. Doctor currently prefers Losartan (ARB) as first-line due to renoprotective benefits. Presented ALLHAT trial data where amlodipine was comparable to diuretics for CV outcomes. Doctor skeptical — feels CCBs cause too much edema in hot climate.',
'Good response in 3 early cases but ankle swelling in hot weather is a dealbreaker for outdoor workers. I will keep Losartan as my first choice.'),

-- ID 16: Dr. Rajesh Kapoor, CURRENT_DATE-28, Bevaas 10mg
('mr_priya_002','Dr. Rajesh Kapoor',(CURRENT_DATE-28),'Bevaas 10mg',
'[{"id":6,"name":"Bevaas 10mg","quantity":4}]',
'Follow-up on Bevaas usage. Doctor had started 5 patients on Bevaas 5mg last month — 3 needed step-up to 10mg. One 60-year-old male patient with aortic stenosis was started on Bevaas 10mg — flagged as contraindicated per prescribing info. Counseled doctor on aortic stenosis contraindication. Doctor was unaware and agreed to switch that patient to a different class.',
'Thank you for catching that. I did not realize aortic stenosis was a contraindication. Will switch that patient to an ARB. The other 4 patients are doing well on 10mg.'),

-- ID 17: Dr. Anita Patel, CURRENT_DATE-55, Derise 50mg
('mr_priya_002','Dr. Anita Patel',(CURRENT_DATE-55),'Derise 50mg',
'[{"id":7,"name":"Derise 50mg","quantity":3}]',
'Introduced Derise 50mg for severe allergic dermatitis cases. Doctor is a senior dermatologist seeing 15+ severe allergy cases weekly. Currently using hydroxyzine 25mg which causes significant sedation. Presented Derise 50mg as non-sedating alternative for daytime use. Doctor requested Zenrac-DER-001 post-marketing surveillance data from India before prescribing high-strength formulation.',
'Fast symptom relief observed in 2 trial patients. But I need the Indian post-marketing data — Western trial data may not reflect our patient population.'),

-- ID 18: Dr. Anita Patel, CURRENT_DATE-48, Rilast Syrup
('mr_priya_002','Dr. Anita Patel',(CURRENT_DATE-48),'Rilast Syrup',
'[{"id":8,"name":"Rilast Syrup","quantity":4}]',
'Cross-sold Rilast Syrup for doctor''s paediatric allergy patients (ages 4-10) who also have asthma component. Doctor had not considered montelukast for allergic skin conditions with respiratory overlap. Discussed dual mechanism benefit — both anti-leukotriene and anti-allergic. Doctor concerned about neuropsychiatric warnings in children. One parent asked about giving Chyawanprash alongside Rilast.',
'I am cautious with montelukast in children after the FDA warning. But the dual benefit is interesting. Chyawanprash should be fine — no known interaction.'),

-- ============================================================================
-- ROBERT (mr_robert_003) — IDs 19-28
-- ============================================================================

-- ID 19: Dr. Neha Sharma, CURRENT_DATE-2, Derise 10mg
('mr_robert_003','Dr. Neha Sharma',(CURRENT_DATE-2),'Derise 10mg',
'[{"id":1,"name":"Derise 10mg","quantity":5}]',
'Detailed Derise 10mg for seasonal allergy patients. Doctor showed strong interest in non-sedating profile. Shared ARIA trial data showing 38% TSS reduction vs placebo. Doctor currently prescribing cetirizine but 5 patients complained of drowsiness affecting work performance. Doctor plans to switch those 5 patients from cetirizine to Derise first.',
'Impressed by drowsiness data. Will trial with morning-shift workers first who cannot afford sedation at work.'),

-- ID 20: Dr. Neha Sharma, CURRENT_DATE-19, Derise 20mg
('mr_robert_003','Dr. Neha Sharma',(CURRENT_DATE-19),'Derise 20mg',
'[{"id":2,"name":"Derise 20mg","quantity":3}]',
'Follow-up visit. Derise 20mg working well for moderate allergic rhinitis patients. Doctor now prescribing to 12+ patients regularly. 3 patients switched from Allegra 180mg report better 24-hour coverage. Doctor raised question about pregnancy safety — has 2 pregnant patients with severe rhinitis. Explained Category B status and advised use only if clearly needed.',
'Once-daily dosing is the key differentiator. Patients prefer it over twice-daily alternatives. I need clear guidelines for my pregnant patients.'),

-- ID 21: Dr. Suresh Kumar, CURRENT_DATE-4, Rilast Tablet
('mr_robert_003','Dr. Suresh Kumar',(CURRENT_DATE-4),'Rilast Tablet',
'[{"id":3,"name":"Rilast Tablet","quantity":4}]',
'Discussed Rilast Tablet efficacy for chronic asthma add-on therapy. Doctor currently using competitor Montair (Cipla montelukast) for most patients. Presented compliance advantage of once-daily evening dosing and 40% pricing benefit over Montair. Doctor has 8 patients on Montair and is willing to switch 3 to Rilast on next refill to compare.',
'Wants to see head-to-head data vs Montair. Positive about oral route for non-compliant patients who struggle with inhaler technique.'),

-- ID 22: Dr. Suresh Kumar, CURRENT_DATE-24, Rilast Capsule
('mr_robert_003','Dr. Suresh Kumar',(CURRENT_DATE-24),'Rilast Capsule',
'[{"id":4,"name":"Rilast Capsule","quantity":3}]',
'Discussed Rilast Capsule sustained-release advantages for patients with early morning wheeze. Doctor comparing with tablet formulation and competitor Singulair. One patient on Rilast Tablet reported abdominal pain — reviewed that this is common (2.9%) and usually resolves. Doctor wants to try capsule for patients with GI sensitivity as sustained-release may reduce peak plasma levels.',
'Interested in capsule for patients with early morning wheeze and GI issues. Send me the clinical comparison data vs tablet.'),

-- ID 23: Dr. Amit Gupta, CURRENT_DATE-38, Bevaas 5mg
('mr_robert_003','Dr. Amit Gupta',(CURRENT_DATE-38),'Bevaas 5mg',
'[{"id":5,"name":"Bevaas 5mg","quantity":5}]',
'Follow-up on Bevaas 5mg initiation in elderly hypertensives (>65 years). Doctor manages a geriatric clinic with 40+ hypertension patients. Reports 3 out of 5 patients achieved BP goal (<140/90) within 3 weeks. Discussed step-up to 10mg for remaining 2. Doctor asked about interaction with Ashwagandha supplements — several elderly patients take it for general wellness. No known interaction documented.',
'Good tolerance in elderly. Minimal edema at 5mg. Will step up cautiously. Ashwagandha question comes up often — good to know there is no interaction.'),

-- ID 24: Dr. Amit Gupta, CURRENT_DATE-31, Bevaas 10mg
('mr_robert_003','Dr. Amit Gupta',(CURRENT_DATE-31),'Bevaas 10mg',
'[{"id":6,"name":"Bevaas 10mg","quantity":3}]',
'Bevaas 10mg efficacy review across 15 patients. Mean SBP reduction 22 mmHg systolic at 8 weeks. One patient switched to 20mg for resistant hypertension. Doctor evaluating adding HCTZ 12.5mg as fixed-dose combination for patients needing dual therapy. Asked about Zenrac plans for a Bevaas+HCTZ combo tablet. Competitor Amtas-AT (amlodipine+atenolol) from Cipla being promoted aggressively.',
'Consistent BP reduction. Edema manageable with ACE-I combination. Would prefer a fixed-dose combo if available — Amtas-AT is convenient but I prefer CCB+diuretic.'),

-- ID 25: Dr. Pooja Singh, CURRENT_DATE-52, Bevaas 20mg
('mr_robert_003','Dr. Pooja Singh',(CURRENT_DATE-52),'Bevaas 20mg',
'[{"id":7,"name":"Bevaas 20mg","quantity":2}]',
'Reviewed Bevaas 20mg outcomes for resistant hypertension. Doctor is a cardiologist using triple combination (Bevaas + ACE-I + diuretic) in 6 patients. 4 of 6 now at target BP. One patient had syncope episode on day 3 — triple combination was likely excessive for an elderly patient with aortic stenosis. Doctor wants pharmacovigilance follow-up on that case.',
'Effective in combination. One patient had syncope episode — needs AE review. Overall satisfied but high-dose requires careful patient selection.'),

-- ID 26: Dr. Pooja Singh, CURRENT_DATE-29, Derise 50mg
('mr_robert_003','Dr. Pooja Singh',(CURRENT_DATE-29),'Derise 50mg',
'[{"id":8,"name":"Derise 50mg","quantity":3}]',
'Reviewed Derise 50mg use in severe allergic dermatitis. One patient (45M) reported drowsiness at 50mg — unusual for desloratadine. Doctor reduced to 20mg and symptoms resolved. Doctor raised concern about off-label high-dose prescribing liability. Also noted a competitor rep from Glenmark promoting Desloratadine+Montelukast combo tablet — wants to know if Zenrac has a similar FDC planned.',
'Concerned about sedation at 50mg. Glenmark combo looks interesting — fixed-dose combinations are the future. Most patients do well but this case needs AE reporting.'),

-- ID 27: Dr. Rakesh Mishra, CURRENT_DATE-60, Rilast Syrup
('mr_robert_003','Dr. Rakesh Mishra',(CURRENT_DATE-60),'Rilast Syrup',
'[{"id":9,"name":"Rilast Syrup","quantity":4}]',
'Delivered Rilast Syrup samples to paediatric ward. Doctor manages a 20-bed paediatric unit seeing monsoon-season surge in respiratory cases. Discussed dosing for 2-5 age group (4mg/5mL once daily evening). Parents of current patients reporting improved nighttime breathing within 7-10 days. Doctor flagged that 2 parents are giving Dabur Honitus (Ayurvedic cough syrup) alongside Rilast — no contraindication but efficacy of herbal remedy is unproven.',
'Parents very positive about Rilast. Compliance better than nebulizer which children resist. Wants more stock for monsoon season. Honitus interaction concern addressed.'),

-- ID 28: Dr. Rakesh Mishra, CURRENT_DATE-40, Rilast Tablet
('mr_robert_003','Dr. Rakesh Mishra',(CURRENT_DATE-40),'Rilast Tablet',
'[{"id":10,"name":"Rilast Tablet","quantity":3}]',
'Rilast Tablet long-term follow-up for adult asthma patients. Doctor managing 20+ patients on Rilast for 6+ months. Significant reduction in rescue inhaler (salbutamol) use — from avg 4x/week to 1x/week. Doctor asked about step-down therapy protocol — can patients reduce dose after 6 months of stability? Also mentioned a CME request for a respiratory medicine workshop — wants Zenrac sponsorship.',
'Satisfied with long-term outcomes. No neuropsychiatric issues in my adult patients. Will continue prescribing. Please process the CME sponsorship request.');

-- ============================================================================
-- ADDITIONAL VISITS WITH VISIT_TIME — IDs 29-38
-- ============================================================================

INSERT INTO dcr (user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback) VALUES

-- Rahul Sharma extra visits (IDs 29-33)

-- ID 29: Dr. Anil Mehta, CURRENT_DATE-1, Bevaas 5mg
('mr_rahul_001','Dr. Anil Mehta', CURRENT_DATE-1, '2026-03-01 10:30:00+00', 'Bevaas 5mg',
 '[{"id":11,"name":"Bevaas 5mg","quantity":2}]',
 'Discussed Bevaas 5mg + Telmisartan 40mg combination for 4 resistant hypertension patients not controlled on ARB monotherapy. Doctor sees value in CCB+ARB dual therapy based on ONTARGET trial principles. Asked about renal function monitoring protocol for dual blockade. Also flagged that Abbott''s Telma-AM (telmisartan+amlodipine combo) is heavily discounted — ₹3/tablet vs our separate prescriptions costing ₹5 combined.',
 'Combination works but Abbott Telma-AM is cheaper as a single pill. Patients prefer one tablet over two. Consider launching an FDC.'),

-- ID 30: Dr. Sunita Verma, CURRENT_DATE-3, Derise 10mg
('mr_rahul_001','Dr. Sunita Verma', CURRENT_DATE-3, '2026-03-03 15:45:00+00', 'Derise 10mg',
 '[{"id":12,"name":"Derise 10mg","quantity":4}]',
 'Follow-up on allergic rhinitis cases treated with Derise 10mg. 8 out of 10 patients report good symptom control. 2 patients had inadequate response — doctor considering stepping up to 20mg. One patient is a competitive athlete (marathon runner) who needs documentation that Derise is not on WADA banned substance list for anti-doping compliance.',
 'Patient response improving steadily. The athlete case is interesting — please confirm WADA status and provide a letter for the sports federation.'),

-- ID 31: Dr. Pradeep Joshi, CURRENT_DATE-18, Rilast Syrup
('mr_rahul_001','Dr. Pradeep Joshi', CURRENT_DATE-18, '2026-02-27 09:15:00+00', 'Rilast Syrup',
 '[{"id":13,"name":"Rilast Syrup","quantity":3}]',
 'Paediatric asthma follow-up with Dr. Pradeep Joshi. 3 children (ages 4, 6, 7) on Rilast Syrup for 4 weeks showing good response. Doctor wants to discuss step-down protocol — can dose be reduced after 3 months of stability? Also, one parent reported child having vivid dreams — doctor concerned about neuropsychiatric side effect in children per FDA boxed warning. Reassured that incidence is rare (<1%) and to monitor.',
 'Good efficacy in children. The vivid dreams case worries the parents. I will monitor closely and report if worsens. Need step-down guidelines.'),

-- ID 32: Dr. Ramesh Patil, CURRENT_DATE-35, Bevaas 10mg
('mr_rahul_001','Dr. Ramesh Patil', CURRENT_DATE-35, '2026-02-10 11:00:00+00', 'Bevaas 10mg',
 '[{"id":14,"name":"Bevaas 10mg","quantity":2}]',
 'Dosage optimization visit. 8 patients on Bevaas 5mg for 6+ weeks — 3 need step-up to 10mg. Doctor discussed a 72-year-old female patient with mild CKD (eGFR 55) and hypertension — asked about dose adjustment in renal impairment. Confirmed amlodipine does not require renal dose adjustment as it is hepatically metabolized. Doctor was also considering adding HCTZ but concerned about electrolyte monitoring in elderly.',
 'BP under control in most patients. Good to know about renal safety. Will step up the 3 patients to 10mg next week. The CKD patient is my main concern.'),

-- ID 33: Dr. Kavita Rao, CURRENT_DATE-22, Derise 20mg
('mr_rahul_001','Dr. Kavita Rao', CURRENT_DATE-22, '2026-02-23 14:20:00+00', 'Derise 20mg',
 '[{"id":15,"name":"Derise 20mg","quantity":3}]',
 'Discussed Derise 20mg for moderate-severe chronic urticaria patients not responding to 10mg. Doctor managing 6 refractory cases — 4 already on 20mg with good response. Doctor asked about Derise use during lactation — has a breastfeeding mother with severe urticaria. Explained that desloratadine is excreted in breast milk and should be used with caution. Also noted Mankind Pharma is offering aggressive trade margins on their desloratadine brand.',
 'Mankind is offering 25% better margins to chemists. Your product quality is better but pharmacists push what gives them better profit. Address this.'),

-- Priya Mehta extra visits (IDs 34-36)

-- ID 34: Dr. Meena Shah, CURRENT_DATE-2, Bevaas 5mg
('mr_priya_002','Dr. Meena Shah', CURRENT_DATE-2, '2026-03-02 10:00:00+00', 'Bevaas 5mg',
 '[{"id":16,"name":"Bevaas 5mg","quantity":3}]',
 'Bevaas 5mg initiation in 6 newly diagnosed hypertensives. Doctor running a wellness screening camp — identified 15 new hypertension cases last month. Wants bulk samples for camp patients. Discussed lifestyle modification counseling alongside pharmacotherapy. Doctor expressed frustration that many patients try Patanjali Divya Mukta Vati (Ayurvedic BP remedy) first and present late with uncontrolled BP.',
 'Good BP control observed in early starters. The patients who tried Ayurvedic remedies first came with BP 170/110. We need patient awareness materials about dangers of delaying allopathic treatment.'),

-- ID 35: Dr. Vikram Desai, CURRENT_DATE-25, Derise 50mg
('mr_priya_002','Dr. Vikram Desai', CURRENT_DATE-25, '2026-03-04 16:30:00+00', 'Derise 50mg',
 '[{"id":17,"name":"Derise 50mg","quantity":2}]',
 'Bevaas 10mg review with cardiologist. Doctor has 40+ patients on Bevaas across 5mg, 10mg, and 20mg strengths. Discussed ASCOT-BPLA trial outcomes — 24% CV mortality reduction and 30% lower new-onset diabetes. Doctor impressed but flagged that 3 patients developed gingival hyperplasia (rare side effect). Referred those patients to periodontist. Competitor Stamlo (Sun Pharma amlodipine) has similar issue — not brand-specific.',
 'Strong evidence base. Recommending to colleagues in cardiology department. Gingival hyperplasia is annoying but rare — same with any amlodipine brand.'),

-- ID 36: Dr. Meena Shah, CURRENT_DATE-5, Rilast Capsule
('mr_priya_002','Dr. Meena Shah', CURRENT_DATE-5, '2026-03-05 11:50:00+00', 'Rilast Capsule',
 '[{"id":20,"name":"Rilast Capsule","quantity":3}]',
 'Rilast Capsule trial for 4 adult asthma patients with nocturnal breakthrough symptoms on Rilast Tablet. Doctor noticed that 2 patients who switched to capsule report better 4-6 AM symptom control. However, one patient accidentally crushed the capsule (should be swallowed whole) — re-educated on correct administration. Doctor also asked about drug interaction with theophylline which 2 patients are concurrently taking.',
 'Patient adherence good with capsule. Nocturnal control definitely better. Please confirm theophylline interaction status — important for my combination therapy patients.'),

-- Robert extra visits (IDs 37-38)

-- ID 37: Dr. Neha Sharma, CURRENT_DATE-3, Bevaas 5mg
('mr_robert_003','Dr. Neha Sharma', CURRENT_DATE-3, '2026-03-03 10:10:00+00', 'Bevaas 5mg',
 '[{"id":21,"name":"Bevaas 5mg","quantity":3}]',
 'Cross-category discussion — introduced Bevaas 5mg to Dr. Neha Sharma who primarily prescribes antihistamines. Doctor sees 10-15 hypertensive patients weekly in general OPD but has been referring them to cardiologist for initiation. Explained that Bevaas 5mg is safe for GP initiation in uncomplicated Stage 1 hypertension. Doctor hesitant — prefers referring out. Competitor USV''s Amlokind is already stocked in the attached pharmacy.',
 'I am primarily an allergy specialist but I do see hypertension. I usually refer out — not confident starting antihypertensives myself. Amlokind is already available in our pharmacy.'),

-- ID 38: Dr. Suresh Kumar, CURRENT_DATE-20, Derise 20mg
('mr_robert_003','Dr. Suresh Kumar', CURRENT_DATE-20, '2026-03-05 14:30:00+00', 'Derise 20mg',
 '[{"id":22,"name":"Derise 20mg","quantity":2}]',
 'Discussed Derise 20mg for Dr. Suresh Kumar''s allergy patients alongside respiratory practice. Doctor treats both asthma and allergic rhinitis — ideal for cross-selling Derise with Rilast. 4 patients with asthma+rhinitis overlap currently on levocetirizine for allergy component. Presented Derise 20mg as upgrade with less sedation. Doctor asked about hepatic impairment dosing — has 1 patient with chronic liver disease.',
 'Good idea to combine Derise with Rilast for my overlap patients. But the liver disease patient needs dose adjustment guidance — send me the hepatic dosing recommendations.');
