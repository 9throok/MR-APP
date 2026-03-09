-- Seed knowledge base with sample drug information
-- Run after dummy_data.sql (needs products) and seed_users.sql (needs users)
-- Usage: docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_knowledge.sql

-- Clear existing knowledge entries (idempotent)
DELETE FROM drug_knowledge;

-- Derise 10mg — Prescribing Info
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(1, 'derise_prescribing_info.txt',
'DERISE (Desloratadine) — Prescribing Information
=================================================

BRAND NAME: Derise
GENERIC NAME: Desloratadine
MANUFACTURER: Zenrac Pharmaceuticals Pvt. Ltd.
THERAPEUTIC CLASS: Second-generation antihistamine (H1 receptor antagonist)

AVAILABLE STRENGTHS:
- Derise 10mg tablets
- Derise 20mg tablets
- Derise 50mg tablets (for severe allergic conditions)

INDICATIONS:
- Allergic rhinitis (seasonal and perennial)
- Chronic idiopathic urticaria
- Allergic dermatitis
- Allergic conjunctivitis
- Pruritus associated with allergic skin conditions

MECHANISM OF ACTION:
Desloratadine is a long-acting, non-sedating, selective H1-receptor antagonist. It inhibits histamine release from mast cells and basophils, reducing allergic symptoms. Unlike first-generation antihistamines, it has minimal CNS penetration, resulting in significantly less drowsiness.

DOSAGE AND ADMINISTRATION:
- Derise 10mg: One tablet once daily for mild-to-moderate allergic rhinitis and urticaria.
- Derise 20mg: One tablet once daily for moderate allergic conditions.
- Derise 50mg: One tablet once daily for severe allergic reactions. Use under specialist supervision.

CONTRAINDICATIONS:
- Known hypersensitivity to desloratadine, loratadine, or any excipient
- Severe hepatic impairment (CrCl < 30 mL/min)
- Children under 6 years (tablet formulation)
- Concurrent use with strong CYP3A4 inhibitors (ketoconazole, erythromycin) — monitor closely
- Pregnancy Category B — use only if clearly needed
- Lactation — excreted in breast milk, use with caution

ADVERSE EFFECTS:
Common (>1%): Headache, dry mouth, fatigue, dizziness
Uncommon (0.1-1%): Nausea, myalgia, somnolence
Rare (<0.1%): Tachycardia, elevated liver enzymes, hypersensitivity reactions

DRUG INTERACTIONS:
- Ketoconazole: Increases desloratadine plasma levels
- Erythromycin: May increase plasma levels
- Alcohol: No significant potentiation of CNS depression (advantage over first-gen)

CLINICAL ADVANTAGES:
- Once-daily dosing improves compliance
- Non-sedating profile — suitable for daytime use
- Rapid onset of action (within 1 hour)
- 24-hour duration of effect
- Patients report less drowsiness compared to first-generation antihistamines',
'prescribing_info', 'admin');

-- Derise 10mg — Clinical Trials
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(1, 'derise_clinical_trials.txt',
'DERISE (Desloratadine) — Clinical Trial Summary

TRIAL 1: ARIA Study — Efficacy in Seasonal Allergic Rhinitis
Randomized, double-blind, placebo-controlled, 924 adults, 4 weeks.
- Desloratadine 10mg reduced Total Symptom Score by 38% vs placebo (p<0.001)
- Desloratadine 20mg reduced TSS by 42% vs placebo (p<0.001)
- Onset of action within 1.25 hours for nasal symptoms
- Patient satisfaction: 78% reported good or excellent relief with 10mg

TRIAL 2: COMPASS Study — Chronic Urticaria
Randomized, double-blind, 416 adults, 6 weeks.
- Both 10mg and 20mg significantly reduced pruritus severity score vs placebo (p<0.001)
- Mean hives reduced by 62% (10mg) and 71% (20mg) at Week 6
- Quality of life (DLQI) improved significantly

TRIAL 3: DREAM Study — Drowsiness and Performance
Crossover, double-blind, 200 adults, 7 days per arm.
- Desloratadine showed NO significant impairment on driving simulation vs placebo
- Cetirizine showed mild impairment in 12% of subjects
- Diphenhydramine showed significant impairment in 45% of subjects

TRIAL 4: Zenrac-DER-001 — Post-Marketing Surveillance (India)
Prospective, observational, 2150 Indian adults, 12 weeks.
- Overall efficacy rate: 82%
- Drowsiness rate: Only 0.7% vs cetirizine 3.1%
- Patient compliance: 91% adherence to once-daily regimen',
'clinical_trial', 'admin');

-- Rilast Tablet — Prescribing Info
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(4, 'rilast_prescribing_info.txt',
'RILAST (Montelukast) — Prescribing Information

BRAND NAME: Rilast
GENERIC NAME: Montelukast Sodium
THERAPEUTIC CLASS: Leukotriene receptor antagonist (LTRA)

AVAILABLE FORMULATIONS:
- Rilast Tablet (10mg) — for adults and adolescents >=15 years
- Rilast Capsule (10mg) — sustained-release formulation
- Rilast Syrup (4mg/5mL) — for paediatric patients aged 2-14 years

INDICATIONS:
- Prophylaxis and chronic treatment of asthma
- Prevention of exercise-induced bronchoconstriction
- Relief of seasonal and perennial allergic rhinitis

MECHANISM OF ACTION:
Montelukast blocks cysteinyl leukotriene receptor CysLT1, reducing bronchoconstriction, mucus secretion, and eosinophil recruitment in the airways.

RILAST TABLET vs RILAST CAPSULE COMPARISON:
- Rilast Tablet: Immediate-release, onset 2-3 hours, can be crushed
- Rilast Capsule: Sustained-release, onset 3-4 hours, must swallow whole, steadier plasma levels
- Both: 10mg montelukast, once daily in evening, 24-hour duration

DOSAGE: One tablet/capsule once daily in the evening.
Rilast Syrup: Ages 2-5: 4mg (5mL), Ages 6-14: 5mg (6.25mL), once daily evening.

CONTRAINDICATIONS:
- Known hypersensitivity to montelukast
- Not for acute asthma attacks (use rescue inhaler)
- Severe hepatic impairment

ADVERSE EFFECTS:
Common: Headache, abdominal pain
Rare: Neuropsychiatric events (agitation, depression, suicidal ideation — FDA boxed warning)

CLINICAL ADVANTAGES:
- Oral administration — no inhaler technique issues
- Once-daily dosing in evening for optimal control
- Effective in both asthma and allergic rhinitis
- Good safety profile in paediatric patients',
'prescribing_info', 'admin');

-- Bevaas 5mg — Prescribing Info
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(7, 'bevaas_prescribing_info.txt',
'BEVAAS (Amlodipine) — Prescribing Information

BRAND NAME: Bevaas
GENERIC NAME: Amlodipine Besylate
THERAPEUTIC CLASS: Calcium channel blocker (dihydropyridine)

AVAILABLE STRENGTHS:
- Bevaas 5mg tablets
- Bevaas 10mg tablets
- Bevaas 20mg tablets (for resistant hypertension)

INDICATIONS:
- Essential hypertension
- Chronic stable angina pectoris
- Vasospastic (Prinzmetal) angina
- Resistant hypertension (combination therapy)

MECHANISM OF ACTION:
Amlodipine inhibits L-type calcium channels in vascular smooth muscle, causing vasodilation, reducing peripheral vascular resistance and lowering blood pressure. Gradual onset and long duration (24+ hours).

DOSAGE:
- Bevaas 5mg: Starting dose for most patients including elderly
- Bevaas 10mg: Titrate up after 1-2 weeks if needed
- Bevaas 20mg: For resistant hypertension under specialist supervision

CONTRAINDICATIONS:
- Hypersensitivity to amlodipine or dihydropyridines
- Severe aortic stenosis
- Cardiogenic shock
- Severe hypotension (systolic < 90 mmHg)
- Pregnancy and lactation

ADVERSE EFFECTS:
Common: Peripheral edema (dose-dependent), headache, flushing, dizziness
Rare: Gingival hyperplasia, gynecomastia

CLINICAL ADVANTAGES:
- Once-daily dosing with 24-hour coverage
- Long half-life (30-50 hours) — forgiving of missed doses
- Metabolically neutral (safe in diabetics)
- Extensive evidence base (ALLHAT, ASCOT, CAMELOT trials)',
'prescribing_info', 'admin');

-- Bevaas — Clinical Trials
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(7, 'bevaas_clinical_trials.txt',
'BEVAAS (Amlodipine) — Clinical Trial Summary

ALLHAT Trial: 33,357 high-risk hypertensives, 4.9 years.
- Amlodipine comparable to diuretics for preventing major CV events
- 23% lower stroke risk vs lisinopril (p=0.003)

ASCOT-BPLA Trial: 19,257 hypertensives with 3+ CV risk factors, 5.5 years.
- Amlodipine regimen reduced all-cause mortality by 11% (p=0.025)
- CV mortality reduced by 24% (p=0.001)
- New-onset diabetes 30% lower (p<0.001)
- Trial stopped early for clear superiority

CAMELOT Trial: 1,991 CAD patients, 2 years.
- Amlodipine reduced CV events by 31% vs placebo (p=0.003)
- Slowed progression of coronary atherosclerosis (IVUS substudy)
- Reduced hospitalizations for angina by 42% (p=0.002)

Zenrac-BEV-002 Real-World Study: 1,800 Indian patients, 24 weeks.
- Bevaas 5mg: SBP reduction 18.2 mmHg
- Bevaas 10mg: SBP reduction 24.6 mmHg
- Bevaas 20mg: SBP reduction 31.4 mmHg
- BP goal achieved in 72% by Week 24
- Combination therapy: 85% achieved BP goal',
'clinical_trial', 'admin');

-- All Products — FAQ
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(1, 'product_faq.txt',
'ZENRAC PHARMACEUTICALS — PRODUCT FAQ

DERISE FAQ:
Q: What are the contraindications of Derise?
A: Hypersensitivity to desloratadine/loratadine, severe hepatic impairment, children under 6 (tablets), concurrent strong CYP3A4 inhibitors, pregnancy (Category B), lactation.

Q: Can patients take Derise while driving?
A: Yes. DREAM trial showed no driving impairment vs placebo.

Q: Which strength to start with?
A: Start with 10mg. Increase to 20mg if insufficient. Reserve 50mg for severe cases.

RILAST FAQ:
Q: Difference between Rilast Tablet and Capsule?
A: Tablet is immediate-release (onset 2-3h, can crush). Capsule is sustained-release (onset 3-4h, steadier levels, swallow whole).

Q: Should Rilast be taken morning or evening?
A: Evening. Leukotriene production peaks at night.

Q: Is Rilast Syrup safe for children?
A: Yes, approved for ages 2-14. Parents report improved breathing within 1-2 weeks.

BEVAAS FAQ:
Q: What clinical trials support Bevaas?
A: ALLHAT (33,357 patients), ASCOT-BPLA (19,257 patients, stopped early for benefit), CAMELOT (31% CV event reduction), Zenrac real-world study (1,800 patients, 72% achieved BP goal).

Q: What about ankle swelling?
A: Dose-dependent (4.1% at 5mg, 14.2% at 20mg). Combining with ACE-I/ARB reduces edema by ~50%.

Q: Is Bevaas safe for diabetics?
A: Yes. Metabolically neutral. ASCOT showed 30% lower new-onset diabetes risk.',
'faq', 'admin');

-- All Products — Safety Data
INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by) VALUES
(1, 'safety_data.txt',
'ZENRAC PHARMACEUTICALS — SAFETY DATA SUMMARY

DERISE Safety: Headache 6.2%, dry mouth 3.1%, fatigue 2.4%, somnolence 1.2%. No QTc prolongation up to 45mg. Weight-neutral. Discontinuation rate 2.3%.

RILAST Safety: Headache 18.4%, abdominal pain 2.9%. FDA Boxed Warning for neuropsychiatric events (agitation, depression, suicidal ideation — rare). Churg-Strauss syndrome very rare. Discontinuation rate 3.1%.

BEVAAS Safety: Peripheral edema 8.3% (dose-dependent: 5mg=4.1%, 10mg=8.9%, 20mg=14.2%), headache 7.3%, fatigue 4.5%, dizziness 3.4%, flushing 2.6%. Gingival hyperplasia rare. Safe in CKD, diabetics, post-MI. Pregnancy Category C (contraindicated). Discontinuation rate 3.8%.

Overdose Management:
- Derise: Supportive care. Not removed by hemodialysis.
- Rilast: No specific antidote. Supportive care.
- Bevaas: IV calcium gluconate, vasopressors. Not removed by hemodialysis.',
'safety', 'admin');
