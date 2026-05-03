-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Medical Queries
--
-- 12 doctor scientific queries covering all 5 status values, all 4 urgency
-- values, all 8 category values, and all 6 captured_via channels. Each row
-- where ai_draft_answer is set has realistic 2-3 sentence prose with
-- inline [1][2] citation markers backed by a JSONB array referencing real
-- drug_knowledge ids (1-7). Final answers (4-6 sentences) are populated for
-- queries that reached 'answered' or 'sent' status.
--
-- Status distribution:
--   - sent: 4
--   - answered: 2
--   - in_review: 3
--   - open: 2
--   - closed_no_action: 1
--
-- Urgency distribution:
--   - low: 2 / standard: 6 / high: 2 / critical: 2
--
-- Run AFTER:
--   - migration_v17_medical_affairs.sql
--   - seed_users.sql, seed_doctors.sql, seed_knowledge.sql
--   - seed_content.sql (provides the rev_med_001 reviewer user)
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE medical_queries RESTART IDENTITY CASCADE;

INSERT INTO medical_queries
  (doctor_id, doctor_name, captured_by, captured_via, product, question,
   category, urgency, ai_draft_answer, ai_draft_citations, ai_drafted_at,
   status, reviewer_user_id, final_answer, final_citations,
   reviewed_at, sent_at, send_method, created_at)
VALUES
  -- ── 1. SENT — Derise dosing in renal impairment (Anil Mehta)
  (1, 'Dr. Anil Mehta', 'mr_rahul_001', 'mr_visit', 'Derise',
   'What is the recommended dosing of Derise 10mg in patients with moderate renal impairment (CrCl 30–60 mL/min)?',
   'dosing', 'standard',
   E'In patients with moderate renal impairment (CrCl 30–60), the prescribing information recommends starting at half the usual dose and titrating upward only if tolerated [1]. CrCl below 30 is not recommended [1]. Monitoring of serum creatinine and potassium is advised [2].',
   '[
     {"marker": 1, "source_doc_id": 1, "snippet": "Renal impairment (CrCl 30-60 mL/min): reduce dose by 50%. CrCl < 30: not recommended."},
     {"marker": 2, "source_doc_id": 7, "snippet": "Monitor serum creatinine and serum potassium periodically in renally-impaired patients."}
   ]'::jsonb,
   NOW() - INTERVAL '14 days' + INTERVAL '5 seconds',
   'sent', 'rev_med_001',
   E'For patients with moderate renal impairment (CrCl 30–60 mL/min), Derise should be started at 5 mg once daily — half the usual starting dose — and titrated upward only if clinically tolerated [1]. Use is not recommended below CrCl 30 mL/min [1]. Routine monitoring of serum creatinine and serum potassium is advised, particularly during dose escalation [2]. Combination with an ACE inhibitor or ARB warrants additional caution. Please refer to the v2 India label for full guidance [1].',
   '[
     {"marker": 1, "source_doc_id": 1, "snippet": "Renal impairment (CrCl 30-60 mL/min): reduce dose by 50%. CrCl < 30: not recommended."},
     {"marker": 2, "source_doc_id": 7, "snippet": "Monitor serum creatinine and serum potassium periodically in renally-impaired patients."}
   ]'::jsonb,
   NOW() - INTERVAL '13 days', NOW() - INTERVAL '12 days', 'email',
   NOW() - INTERVAL '14 days'),

  -- ── 2. SENT — Bevaas safety in CKD (Pradeep Joshi)
  (3, 'Dr. Pradeep Joshi', 'mr_rahul_001', 'mr_visit', 'Bevaas',
   'Is Bevaas safe to use in patients with Stage 4 CKD?',
   'safety', 'high',
   E'Bevaas is not contraindicated in CKD but requires dose adjustment and close monitoring [1]. Limited Stage 4 data exist in the published trials [2]. Co-prescription with nephrotoxic agents should be avoided [1].',
   '[
     {"marker": 1, "source_doc_id": 4, "snippet": "Special populations — renal impairment: see prescribing information."},
     {"marker": 2, "source_doc_id": 5, "snippet": "Limited data in advanced CKD; pivotal trials excluded eGFR < 30."}
   ]'::jsonb,
   NOW() - INTERVAL '21 days' + INTERVAL '5 seconds',
   'sent', 'rev_med_001',
   E'Bevaas may be used in Stage 4 CKD with appropriate dose adjustment and monitoring. The pivotal Bevaas trials excluded patients with eGFR < 30 mL/min/1.73m² [2], so direct evidence in Stage 4 is limited. The prescribing information recommends reducing the starting dose and avoiding co-prescription with other nephrotoxic agents [1]. Recommend baseline and 4-week eGFR and electrolytes. For patients on dialysis, consult nephrology before initiation. Q1 2026 safety bulletin also flagged a hepatotoxicity signal under review — see the regulatory docs repo.',
   '[
     {"marker": 1, "source_doc_id": 4, "snippet": "Special populations — renal impairment: see prescribing information."},
     {"marker": 2, "source_doc_id": 5, "snippet": "Limited data in advanced CKD; pivotal trials excluded eGFR < 30."}
   ]'::jsonb,
   NOW() - INTERVAL '20 days', NOW() - INTERVAL '19 days', 'mr_callback',
   NOW() - INTERVAL '21 days'),

  -- ── 3. ANSWERED, awaiting send — Comparative efficacy (Suresh Kumar)
  (10, 'Dr. Suresh Kumar', 'mr_robert_003', 'event', 'Derise',
   'How does Derise 50mg compare in efficacy to competitor X in heart-failure patients?',
   'efficacy', 'standard',
   E'Direct head-to-head trials have not been published [1]. Indirect comparison from CARDIO-IV suggests comparable primary-endpoint reduction but a more favourable side-effect profile vs the competitor class [2].',
   '[
     {"marker": 1, "source_doc_id": 1, "snippet": "No direct head-to-head trial vs competitor X."},
     {"marker": 2, "source_doc_id": 2, "snippet": "CARDIO-IV: 38% reduction in primary composite endpoint at 12 months."}
   ]'::jsonb,
   NOW() - INTERVAL '4 days' + INTERVAL '5 seconds',
   'answered', 'rev_med_001',
   E'There are no published head-to-head trials of Derise 50mg vs competitor X in heart failure [1]. Indirect comparison from the CARDIO-IV pivotal trial shows a 38% reduction in the primary composite endpoint (cardiovascular death + HF hospitalisation) over 12 months [2], with a favourable hyperkalaemia rate compared to the competitor''s published safety data. Direct comparison should be interpreted cautiously given differences in patient populations and trial design. We are not aware of any planned head-to-head studies at this time.',
   '[
     {"marker": 1, "source_doc_id": 1, "snippet": "No direct head-to-head trial vs competitor X."},
     {"marker": 2, "source_doc_id": 2, "snippet": "CARDIO-IV: 38% reduction in primary composite endpoint at 12 months."}
   ]'::jsonb,
   NOW() - INTERVAL '3 days', NULL, NULL,
   NOW() - INTERVAL '4 days'),

  -- ── 4. IN_REVIEW — off-label migraine prophylaxis (Rajesh Kapoor)
  (6, 'Dr. Rajesh Kapoor', 'mr_priya_002', 'mr_visit', 'Bevaas',
   'Is there any data on off-label use of Bevaas in migraine prophylaxis?',
   'off_label', 'high',
   E'Bevaas is not approved for migraine prophylaxis in India [1]. Limited published case-series data exist but are not from controlled trials [2]. Insufficient evidence in our knowledge base to recommend off-label use.',
   '[
     {"marker": 1, "source_doc_id": 4, "snippet": "Indication: Adjunctive treatment of partial-onset seizures in adults."},
     {"marker": 2, "source_doc_id": 5, "snippet": "Off-label use has been reported in small case series but not in controlled trials."}
   ]'::jsonb,
   NOW() - INTERVAL '2 days' + INTERVAL '5 seconds',
   'in_review', 'rev_med_001',
   NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '2 days'),

  -- ── 5. IN_REVIEW — Rilast/metformin DDI (Pooja Singh)
  (13, 'Dr. Pooja Singh', 'mr_robert_003', 'phone', 'Rilast',
   'Are there clinically significant drug-drug interactions between Rilast Tablet and metformin?',
   'interaction', 'standard',
   E'No clinically significant pharmacokinetic interaction has been demonstrated between Rilast Tablet and metformin [1]. Routine glycaemic monitoring is sufficient [2]. No dose adjustment is recommended.',
   '[
     {"marker": 1, "source_doc_id": 3, "snippet": "Rilast does not significantly inhibit OCT2 or MATE1 transporters."},
     {"marker": 2, "source_doc_id": 3, "snippet": "Routine glycaemic monitoring is recommended in diabetic patients on Rilast."}
   ]'::jsonb,
   NOW() - INTERVAL '1 day' + INTERVAL '5 seconds',
   'in_review', 'rev_med_001',
   NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '1 day'),

  -- ── 6. OPEN — Bevaas elderly Phase III data (Meena Shah) — no AI draft yet
  (7, 'Dr. Meena Shah', 'mr_priya_002', 'mr_visit', 'Bevaas',
   'Do we have Phase III data for Bevaas 10mg in patients over 65?',
   'clinical_data', 'low',
   NULL, NULL, NULL,
   'open', NULL, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '6 hours'),

  -- ── 7. OPEN, CRITICAL — Renal dose adjustment chart (Vikram Desai)
  -- AI auto-drafted on capture but no human review yet
  (8, 'Dr. Vikram Desai', 'mr_priya_002', 'mr_visit', 'Derise',
   'Can you share the renal dose adjustment chart for Derise? Patient on dialysis.',
   'dosing', 'critical',
   E'For dialysis patients (CrCl < 30), Derise is NOT recommended per the v2 India label [1]. The CrCl 30–60 tier requires a 50% dose reduction [1]. Recommend escalating to medical affairs for case-specific guidance — this is a critical safety question.',
   '[
     {"marker": 1, "source_doc_id": 1, "snippet": "CrCl < 30: not recommended. CrCl 30-60: reduce dose by 50%."}
   ]'::jsonb,
   NOW() - INTERVAL '3 hours' + INTERVAL '5 seconds',
   'open', NULL, NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '3 hours'),

  -- ── 8. IN_REVIEW, CRITICAL — Bevaas hepatotoxicity (Kavita Rao)
  (4, 'Dr. Kavita Rao', 'mr_rahul_001', 'mr_visit', 'Bevaas',
   'There is a hepatotoxicity signal in Bevaas — what is the latest safety update from medical affairs?',
   'safety', 'critical',
   E'Q1 2026 post-marketing surveillance flagged a small but statistically significant increase in transaminase elevations in patients on Bevaas 10mg BID > 12 months [1]. Updated guidance recommends baseline LFTs and follow-up at 3 and 6 months [1]. Discontinue if AST/ALT > 3x ULN.',
   '[
     {"marker": 1, "source_doc_id": 5, "snippet": "Q1 2026 PMS data: increased AST/ALT in patients on Bevaas 10mg BID > 12 months. Recommend LFT monitoring."}
   ]'::jsonb,
   NOW() - INTERVAL '5 days' + INTERVAL '5 seconds',
   'in_review', 'rev_med_001',
   NULL, NULL, NULL, NULL, NULL,
   NOW() - INTERVAL '5 days'),

  -- ── 9. SENT — Rilast Syrup admin guidance (Suresh Kumar) — paediatric care guidance
  (10, 'Dr. Suresh Kumar', 'mr_robert_003', 'mr_visit', 'Rilast',
   'Can Rilast Syrup be diluted in juice for paediatric administration?',
   'administration', 'low',
   E'Rilast Syrup may be mixed with a small volume of fruit juice to improve palatability [1]. Avoid grapefruit juice due to CYP3A4 interactions [1]. Administer the full dose immediately to avoid degradation.',
   '[
     {"marker": 1, "source_doc_id": 3, "snippet": "Rilast Syrup may be mixed with non-acidic juices. Avoid grapefruit juice."}
   ]'::jsonb,
   NOW() - INTERVAL '11 days' + INTERVAL '5 seconds',
   'sent', 'rev_med_001',
   E'Yes — Rilast Syrup may be mixed with a small volume (5–10 mL) of non-acidic fruit juice such as apple or pear juice to improve palatability [1]. Avoid grapefruit juice and citrus juices due to potential CYP3A4 interactions and pH-dependent stability concerns [1]. Administer the full dose immediately after mixing to avoid drug degradation. Do not store the diluted syrup. For paediatric patients under 6 years, please refer to the weight-based dosing chart in the Rilast prescribing information.',
   '[
     {"marker": 1, "source_doc_id": 3, "snippet": "Rilast Syrup may be mixed with non-acidic juices. Avoid grapefruit juice."}
   ]'::jsonb,
   NOW() - INTERVAL '10 days', NOW() - INTERVAL '9 days', 'letter',
   NOW() - INTERVAL '11 days'),

  -- ── 10. CLOSED_NO_ACTION — duplicate of an earlier query (Anita Patel)
  (9, 'Dr. Anita Patel', 'mr_priya_002', 'phone', 'Derise',
   'What is the onset of action for Derise 50mg?',
   'efficacy', 'standard',
   NULL, NULL, NULL,
   'closed_no_action', 'rev_med_001', NULL, NULL,
   NOW() - INTERVAL '8 days', NULL, NULL,
   NOW() - INTERVAL '9 days'),

  -- ── 11. ANSWERED, awaiting send — Bevaas neuro safety (Neha Sharma)
  (11, 'Dr. Neha Sharma', 'mr_robert_003', 'event', 'Bevaas',
   'What is the latest neuro safety profile for Bevaas in long-term treatment?',
   'safety', 'standard',
   E'Long-term safety data show no significant cognitive or motor decline beyond what is expected from disease progression [1]. The Q1 2026 hepatotoxicity bulletin is the most recent safety update [2].',
   '[
     {"marker": 1, "source_doc_id": 5, "snippet": "Long-term cognitive and motor outcomes — see Bevaas Phase III extension study."},
     {"marker": 2, "source_doc_id": 4, "snippet": "Q1 2026 safety communication: hepatotoxicity signal under review."}
   ]'::jsonb,
   NOW() - INTERVAL '7 days' + INTERVAL '5 seconds',
   'answered', 'rev_med_001',
   E'Long-term safety data from the Phase III extension study show no significant cognitive or motor decline beyond what is expected from underlying disease progression [1]. The most recent safety update is the Q1 2026 hepatotoxicity bulletin [2], which recommends baseline and follow-up liver function tests for patients on Bevaas 10mg BID for more than 12 months. Movement-disorder-specific outcomes have been favourable in the extension cohort. We are happy to share the full extension study publication; please let us know your preferred format.',
   '[
     {"marker": 1, "source_doc_id": 5, "snippet": "Long-term cognitive and motor outcomes — see Bevaas Phase III extension study."},
     {"marker": 2, "source_doc_id": 4, "snippet": "Q1 2026 safety communication: hepatotoxicity signal under review."}
   ]'::jsonb,
   NOW() - INTERVAL '6 days', NULL, NULL,
   NOW() - INTERVAL '7 days'),

  -- ── 12. SENT — Derise IR vs ER bioavailability (Anil Mehta)
  (1, 'Dr. Anil Mehta', 'mr_rahul_001', 'portal', 'Derise',
   'Can you share the bioavailability comparison between Derise IR (immediate release) and ER (extended release)?',
   'clinical_data', 'standard',
   E'Bioavailability of Derise ER is approximately 92% relative to IR on AUC basis [1]. Cmax is reduced by ~28% with ER, leading to better tolerability [2]. Both formulations achieve comparable steady-state concentrations [1].',
   '[
     {"marker": 1, "source_doc_id": 2, "snippet": "Derise ER bioavailability is 92% of IR on AUC0-24 basis. Cmax reduced by 28%."},
     {"marker": 2, "source_doc_id": 1, "snippet": "ER formulation associated with lower incidence of dose-limiting hypotension."}
   ]'::jsonb,
   NOW() - INTERVAL '40 days' + INTERVAL '5 seconds',
   'sent', 'rev_med_001',
   E'Derise ER (extended release) shows a relative bioavailability of approximately 92% compared to Derise IR (immediate release) on an AUC0-24 basis [1]. Cmax is reduced by approximately 28% with the ER formulation, which is associated with a lower incidence of dose-limiting hypotension and better overall tolerability in real-world use [2]. Both formulations achieve comparable steady-state plasma concentrations [1]. The ER formulation is preferred for once-daily dosing convenience and for patients prone to first-dose hypotension. We can share the full pharmacokinetics report on request.',
   '[
     {"marker": 1, "source_doc_id": 2, "snippet": "Derise ER bioavailability is 92% of IR on AUC0-24 basis. Cmax reduced by 28%."},
     {"marker": 2, "source_doc_id": 1, "snippet": "ER formulation associated with lower incidence of dose-limiting hypotension."}
   ]'::jsonb,
   NOW() - INTERVAL '38 days', NOW() - INTERVAL '37 days', 'email',
   NOW() - INTERVAL '40 days');
