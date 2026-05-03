-- ─────────────────────────────────────────────────────────────────────────────
-- Seed Compliance Findings — AI Watchdog inbox demo data
--
-- 12 findings covering all 6 finding_type values × all 5 status values × all
-- 3 detected_by values. Each row references a REAL row in the source table
-- (DCR / adverse_events / content_versions / expense_claims) so the
-- "Source: dcr#5" badge points at something that exists. Severity colors
-- distributed across the spectrum so the inbox shows a realistic mix.
--
-- Cross-references:
--   - Finding #4 ('unconsented_contact', high) targets DCR #5 — Dr. Pradeep
--     Joshi has a recently-revoked marketing_email in seed_consent.sql, so
--     the demo can tell a coherent story when clicking through.
--   - Finding #11 ('duplicate_ae_report') points at adverse_events #5
--     (Dr. Pradeep Joshi / Bevaas 5mg).
--
-- Run AFTER: migration_v15_compliance.sql + seed DCR/expenses/AE/content
-- ─────────────────────────────────────────────────────────────────────────────

TRUNCATE compliance_findings RESTART IDENTITY CASCADE;

INSERT INTO compliance_findings
  (finding_type, severity, source_table, source_row_id, user_id,
   description, evidence_quote, recommendation,
   status, reviewed_by, reviewed_at, review_notes,
   detected_by, created_at)
VALUES
  -- ── 1. off_label_promotion / critical / open / ai
  ('off_label_promotion', 'critical', 'dcr', '7', 'mr_rahul_001',
   'Reference to Derise use in migraine prophylaxis — this is not a labelled indication for Derise in India.',
   'Mentioned that Derise has been "useful in some patients with chronic migraines" — this is off-label.',
   'Coach the rep on labelled indications. Send the Derise India label v2 (drug_label doc) for refresher reading.',
   'open', NULL, NULL, NULL,
   'ai', NOW() - INTERVAL '3 days'),

  -- ── 2. off_label_promotion / high / acknowledged / ai
  ('off_label_promotion', 'high', 'dcr', '13', 'mr_priya_002',
   'Suggested Rilast Tablet for off-label paediatric use without disclaimers.',
   'Doctor asked about kids; rep said "we have some experience in paediatrics" without flagging it as off-label.',
   'Rep already coached. Update training material to address paediatric off-label discussions.',
   'acknowledged', 'mgr_vikram_001', NOW() - INTERVAL '6 days', 'Coached on the call. Will close once training material is updated.',
   'ai', NOW() - INTERVAL '8 days'),

  -- ── 3. off_label_promotion / medium / dismissed / ai
  ('off_label_promotion', 'medium', 'dcr', '8', 'mr_rahul_001',
   'Possible off-label discussion regarding Rilast Capsule combination therapy.',
   'Rep mentioned "some doctors combine Rilast with X" — borderline, in response to an unsolicited question.',
   'Dismissable. Was a response to an unsolicited specific question, which is permitted under fair-balance rules.',
   'dismissed', 'mgr_vikram_001', NOW() - INTERVAL '10 days', 'Reviewed audio context — was unsolicited Q&A. No action needed.',
   'ai', NOW() - INTERVAL '12 days'),

  -- ── 4. unconsented_contact / high / open / rule
  -- Dr. Pradeep Joshi (id 3) has a recently-revoked marketing_email consent (see seed_consent.sql).
  -- DCR #5 was filed by mr_rahul_001 for Dr. Pradeep Joshi 17 days ago — AFTER the revoke 20 days ago.
  ('unconsented_contact', 'high', 'dcr', '5', 'mr_rahul_001',
   'Marketing visit recorded for doctor "Dr. Pradeep Joshi" whose consent for marketing_email is currently revoked.',
   NULL,
   'Confirm whether the visit was for a permitted purpose (e.g. safety follow-up or sample distribution, both still consented). If marketing-related, escalate to consent officer.',
   'open', NULL, NULL, NULL,
   'rule', NOW() - INTERVAL '17 days'),

  -- ── 5. unconsented_contact / medium / resolved / rule
  ('unconsented_contact', 'medium', 'dcr', '6', 'mr_rahul_001',
   'Earlier visit to Dr. Pradeep Joshi — turns out this was BEFORE the email revoke and was a sample-distribution visit (still consented).',
   NULL,
   'Resolved — visit was for sample distribution which remains granted.',
   'resolved', 'mgr_vikram_001', NOW() - INTERVAL '14 days', 'Verified visit type. Sample distribution channel still active. Closed.',
   'rule', NOW() - INTERVAL '25 days'),

  -- ── 6. missing_fair_balance / high / open / ai
  ('missing_fair_balance', 'high', 'dcr', '11', 'mr_priya_002',
   'Efficacy claim made without paired safety information.',
   'Rep said "Derise 20mg gives a 38% reduction in primary endpoint" with no mention of contraindications, side effects, or warnings.',
   'Mandatory rep coaching on fair-balance rules. Pair every efficacy claim with relevant safety info.',
   'open', NULL, NULL, NULL,
   'ai', NOW() - INTERVAL '1 day'),

  -- ── 7. missing_fair_balance / medium / escalated / ai
  ('missing_fair_balance', 'medium', 'dcr', '14', 'mr_priya_002',
   'Comparative claim "Rilast is better tolerated than X" without head-to-head data.',
   'Quote: "Most physicians say Rilast is better tolerated than the alternatives."',
   'Escalated to legal — implied superiority without supporting data is regulator-level risk.',
   'escalated', 'mgr_vikram_001', NOW() - INTERVAL '5 days', 'Forwarded to legal review. Pending.',
   'ai', NOW() - INTERVAL '7 days'),

  -- ── 8. unsubstantiated_claim / high / open / ai
  ('unsubstantiated_claim', 'high', 'content_versions', '4', NULL,
   'Marketing slide claims "20% faster onset of action" without citation. Source unknown.',
   'Slide 6 of "Rilast Tablet — KOL Brochure" v1: "Rilast offers a 20% faster onset of action" with no footnote.',
   'Block publication until a citation is added or the claim is removed. See content_claims for the auto-extracted record.',
   'open', NULL, NULL, NULL,
   'ai', NOW() - INTERVAL '2 days'),

  -- ── 9. gift_value_threshold / medium / open / rule
  ('gift_value_threshold', 'medium', 'expense_claims', '1', 'mr_rahul_001',
   'Lunch expense at high-end venue: ₹4,800 for 2 people — exceeds the ₹1,000/visit India threshold.',
   'Line item description: "Lunch with Dr. Mehta at The Oberoi — INR 4,800."',
   'Confirm whether the lunch was associated with an advisory board or speaker honorarium (then permitted) or with a routine field call (then over-threshold).',
   'open', NULL, NULL, NULL,
   'rule', NOW() - INTERVAL '4 days'),

  -- ── 10. gift_value_threshold / low / resolved / human
  ('gift_value_threshold', 'low', 'expense_claims', '2', 'mr_priya_002',
   'Stationery items provided to Dr. Vikram Desai — flagged for review.',
   'Branded notepads and pens distributed at clinic.',
   'Resolved. Standard de minimis branded stationery is permitted under MCI guidelines.',
   'resolved', 'mgr_vikram_001', NOW() - INTERVAL '11 days', 'Standard de minimis. Closed.',
   'human', NOW() - INTERVAL '13 days'),

  -- ── 11. duplicate_ae_report / medium / acknowledged / ai
  ('duplicate_ae_report', 'medium', 'adverse_events', '5', 'mr_rahul_001',
   'AE for Dr. Pradeep Joshi / Bevaas 5mg appears twice in the system — possibly the same patient reported via two channels.',
   'Two AE rows within 6 hours mentioning the same Bevaas 5mg lot and similar symptoms.',
   'Pharmacovigilance team to dedupe before submission to CDSCO. Confirm patient identifier.',
   'acknowledged', 'mgr_vikram_001', NOW() - INTERVAL '2 days', 'Pharmacovigilance reviewing. Will dedupe before CDSCO submission.',
   'ai', NOW() - INTERVAL '3 days'),

  -- ── 12. other / low / escalated / human
  ('other', 'low', 'dcr', '15', 'mr_priya_002',
   'Manager-flagged: rep visited Dr. Rajesh Kapoor without scheduling via TourPlan. Process compliance gap.',
   NULL,
   'Internal training note: emphasise tour-plan workflow. Not a regulatory concern.',
   'escalated', 'admin_001', NOW() - INTERVAL '6 days', 'Internal compliance only. Reviewing for training updates.',
   'human', NOW() - INTERVAL '6 days');
