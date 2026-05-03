#!/usr/bin/env node
/**
 * Seed content-version placeholder files.
 *
 * seed_content.sql inserts content_versions rows with file_url values like
 * `/uploads/content/<asset_id>/<filename>`. Postgres can't write files, so
 * this helper drops small placeholder text files at those paths so the
 * "Open file" link in the Version History panel of ContentLibrary.tsx
 * resolves to real bytes via Express's static handler.
 *
 * Idempotent — safe to re-run.
 *
 * Run from the repo root:  node backend/scripts/seed_content_files.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'uploads', 'content');

// Note: extensions are .txt for everything except the .pptx, because we ship
// plain-text content as placeholders. Saving plain text under a .pdf
// extension makes express.static serve it as application/pdf, which then
// breaks the inline preview iframe in ContentLibrary.tsx. The .pptx is kept
// as-is so the UI exercises the "download to view" branch.
const files = [
  { assetId: 1, name: 'derise-detail-aid-v1.txt',
    body: `═══════════════════════════════════════════════════════════════════════
DERISE 10mg
Allergy Detail Aid — Version 1.0  [SUPERSEDED — see v2]
═══════════════════════════════════════════════════════════════════════

POSITIONING STATEMENT
Once-daily, non-sedating relief for adults with allergic rhinitis.

─── INDICATION ────────────────────────────────────────────────────────
Derise (desloratadine equivalent) 10 mg is indicated for the
symptomatic relief of seasonal and perennial allergic rhinitis and
chronic idiopathic urticaria in adults and adolescents 12 years and
older.

─── DOSING ────────────────────────────────────────────────────────────
  Adults / adolescents (≥12 yrs)  ............  10 mg once daily
  With or without food. Same time each day for steady-state benefit.

─── MECHANISM OF ACTION ───────────────────────────────────────────────
Selective peripheral H1-receptor antagonist with negligible CNS
penetration at therapeutic doses. Inhibits histamine-mediated
inflammatory cascade without crossing the blood–brain barrier in
clinically meaningful concentrations.

─── EFFICACY HIGHLIGHTS ───────────────────────────────────────────────
Phase III (n=824) — 12-week double-blind, placebo-controlled:
  • Total Nasal Symptom Score (TNSS):  -24% vs placebo  (p<0.01)
  • Onset of action:                   within 1 hour
  • Sustained benefit:                 maintained through week 12

(See Reference 1 below.)

─── ADVERSE REACTIONS ─────────────────────────────────────────────────
Most common (≥1%): headache, dry mouth, fatigue.
[NOTE: v1 ships without a full fair-balance section. Reviewer
flagged this for v2.]

─── REFERENCES ────────────────────────────────────────────────────────
1. Sharma A, et al. "Efficacy of once-daily desloratadine 10 mg in
   allergic rhinitis: a 12-week RCT." Indian J Allergy 2024;42:118-26.

───────────────────────────────────────────────────────────────────────
Derise is a marketed product of ZenRx Pharma. Prescribing information
must be consulted before use. For Healthcare Professional use only.
Material code: DRS-DA-2024-001  (v1, superseded 2026-03-15)
`,
  },

  { assetId: 1, name: 'derise-detail-aid-v2.txt',
    body: `═══════════════════════════════════════════════════════════════════════
DERISE 10mg
Allergy Detail Aid — Version 2.0  [PUBLISHED]
═══════════════════════════════════════════════════════════════════════

POSITIONING STATEMENT
Once-daily, non-sedating relief — now with renal-impairment dosing
guidance and updated Phase III outcomes data.

─── INDICATION ────────────────────────────────────────────────────────
Derise 10 mg is indicated for the symptomatic relief of:
  • Seasonal allergic rhinitis (SAR)
  • Perennial allergic rhinitis (PAR)
  • Chronic idiopathic urticaria (CIU)
in adults and adolescents 12 years and older.

─── DOSING ────────────────────────────────────────────────────────────
  Adults / adolescents (≥12 yrs)   ........... 10 mg once daily
  Renal impairment (CrCl 30–60)    ........... 5 mg once daily
  Renal impairment (CrCl <30)      ........... not recommended
  Hepatic impairment (mild–mod)    ........... no adjustment
  Geriatric (≥65 yrs)              ........... usual adult dose

─── MECHANISM OF ACTION ───────────────────────────────────────────────
Selective peripheral H1-receptor antagonist. Negligible CNS
penetration; no clinically significant sedation at recommended doses.
Active metabolite has a 27-hour half-life supporting once-daily
dosing and steady plasma levels.

─── EFFICACY DATA — UPDATED PHASE III ─────────────────────────────────
ARIA-INDIA registration trial (n=1,142, 12-week, double-blind):

  Endpoint                     Derise 10mg     Placebo     p-value
  ────────────────────────────────────────────────────────────────────
  TNSS reduction (week 12)     -38%            -16%        <0.001
  Quality of life (RQLQ)       -41%            -18%        <0.001
  Rescue medication use        -52%            -19%        <0.001
  Onset of action              60 min          —           —
  Sustained relief             24 hours        —           —

(See Reference 1 below.)

─── SAFETY PROFILE — FAIR BALANCE ─────────────────────────────────────
Adverse reactions ≥1% (Derise vs placebo, ARIA-INDIA):

  Headache              4.1%   vs   3.6%
  Dry mouth             2.8%   vs   1.4%
  Fatigue               2.3%   vs   2.0%
  Dizziness             1.6%   vs   1.1%
  Dry cough             1.2%   vs   0.9%

CONTRAINDICATIONS
  • Hypersensitivity to desloratadine, loratadine, or any excipient
  • Severe hepatic impairment (Child-Pugh C)

WARNINGS & PRECAUTIONS
  • Caution in patients with renal impairment (see Dosing)
  • Driving / operating machinery: monitor for individual response
  • Pregnancy Category B; lactation: present in breast milk

─── PATIENT COUNSELLING ───────────────────────────────────────────────
  1. Take at the same time each day, with or without food.
  2. Effect typically felt within 1 hour; full benefit by week 2.
  3. Do not exceed the prescribed dose.
  4. Report persistent drowsiness, palpitations, or rash to your
     prescribing physician.
  5. Continue allergen-avoidance measures alongside therapy.

─── COMPETITIVE POSITIONING ───────────────────────────────────────────
vs older first-generation antihistamines:
  • No anticholinergic burden in elderly patients
  • No sedation-related driving restriction
  • Once-daily vs 2–3× daily dosing
  • Renal dose-adjustment guidance now provided (NEW in v2)

─── REFERENCES ────────────────────────────────────────────────────────
1. Sharma A, Patel R, Mehta A. "ARIA-INDIA: a 12-week RCT of
   desloratadine 10mg in moderate-to-severe allergic rhinitis."
   Indian J Allergy Immunol 2025;43(2):201-214.
2. Joshi P, et al. "Renal pharmacokinetics of desloratadine in CKD
   stage 3." Clin Pharmacokinet India 2025;18(4):412-419.
3. WHO ATC classification R06AX27, updated 2025.

───────────────────────────────────────────────────────────────────────
Derise is a marketed product of ZenRx Pharma. Full prescribing
information must be consulted before use. For Healthcare Professional
use only.
Material code: DRS-DA-2024-002  (v2, published 2026-03-20)
MLR approval: Medical ✓ Legal ✓ Regulatory ✓
`,
  },

  { assetId: 2, name: 'bevaas-cardio-deck-v1.pptx',
    body: `BEVAAS 5mg — Cardiovascular Slide Deck (v1)
This is a PowerPoint file. Download to view in Microsoft PowerPoint
or Google Slides.

Outline:
  Slide 1   Title — Bevaas 5mg in cardiology
  Slide 2   Indication and approved positioning
  Slide 3   Mechanism of action diagram
  Slide 4   ASCOT-BPLA trial — design and patient population
  Slide 5   Primary endpoint: BP reduction at 24 weeks
  Slide 6   Composite CV outcomes (MI, stroke, CV death)
  Slide 7   Subgroup analyses (diabetes, CKD, elderly)
  Slide 8   Safety profile vs comparator
  Slide 9   Drug-drug interactions (warfarin, digoxin, statins)
  Slide 10  Dosing in renal and hepatic impairment
  Slide 11  Take-home messages
  Slide 12  References and prescribing information
`,
  },

  { assetId: 3, name: 'rilast-kol-brochure-v1.txt',
    body: `═══════════════════════════════════════════════════════════════════════
RILAST TABLET
KOL Brochure — Version 1.0  [CHANGES REQUESTED — Regulatory]
═══════════════════════════════════════════════════════════════════════

THE EVIDENCE-LED CHOICE
Rilast Tablet — sustained-release theophylline-equivalent for COPD
and chronic asthma. Leveraged by leading Indian respiratory KOLs for
predictable 24-hour symptom control.

─── A WORD FROM THE FIELD ─────────────────────────────────────────────
"In my elderly cohort, Rilast has become a first-line maintenance
choice. The sustained-release profile means fewer overnight wake-ups
and better next-day function. Patient adherence has materially
improved compared with twice-daily alternatives."
                          — Dr. Suresh Kumar, MD, AIIMS New Delhi

"What I value most is the predictability. The plasma profile is
flat, the patient response is consistent, and I can confidently
add it to a layered COPD regimen without unsettling other agents."
                          — Dr. Anil Mehta, MD, DM, Lilavati Hospital

─── WHY RILAST — CLINICAL DIFFERENTIATORS ─────────────────────────────

1. SUSTAINED-RELEASE PHARMACOKINETICS
   Single 12-hour dose maintains therapeutic plasma concentration
   (8–15 mcg/mL) across the dosing interval, with peak-to-trough
   ratio of 1.4 (vs 2.8 for immediate-release theophylline).

2. ADHERENCE ADVANTAGE
   Once-daily evening dosing in real-world Indian cohort (n=487):
     • Adherence at 6 months ........ 82% (Rilast)  vs  61% (BID IR)
     • Missed-dose rate .............. 9% (Rilast)  vs  24% (BID IR)
     • Patient-preference survey ..... 79% prefer once-daily

3. PROVEN OUTCOMES IN LAYERED THERAPY
   When added to LAMA + ICS in moderate-to-severe COPD:
     • FEV1 trough improvement: +112 mL (CI 84–140)
     • Annualised exacerbation rate: -28% (p<0.01)
     • SGRQ quality-of-life score: -4.6 points

─── INDICATION ────────────────────────────────────────────────────────
Maintenance treatment of:
  • Chronic Obstructive Pulmonary Disease (COPD)
  • Chronic asthma in adults requiring layered bronchodilator therapy
NOT indicated for acute bronchospasm or status asthmaticus.

─── DOSING ────────────────────────────────────────────────────────────
  Initial:   200 mg once daily (evening)
  Maintenance: 300–400 mg once daily, titrated over 2 weeks
  Maximum:   600 mg once daily
  Therapeutic plasma target: 8–15 mcg/mL (monitor at week 2 + 8)

─── KEY SAFETY POINTS ─────────────────────────────────────────────────
  • Narrow therapeutic index — monitor plasma levels in elderly,
    hepatic impairment, smokers, and patients on enzyme inhibitors.
  • CYP1A2 substrate: dose adjustment with ciprofloxacin, fluvoxamine,
    cimetidine.
  • Caution in cardiac arrhythmia, peptic ulcer, seizure disorder.

─── SELECTED PUBLICATIONS (last 24 months) ────────────────────────────
1. Kumar S, et al. "Sustained-release vs immediate-release
   theophylline in Indian COPD: a multicentre RCT." Indian J Chest
   Dis Allied Sci 2025;67(1):14-23.
2. Mehta A. "Layered therapy in moderate COPD: where does
   theophylline still belong?" Clin Pulmonol India 2024;28(4):189-95.
3. National COPD Registry Annual Report 2025. ICMR, Section 4.2.

─── REGULATORY REVIEWER NOTE ──────────────────────────────────────────
This v1 was returned with CHANGES REQUESTED. Reviewer comments:
  – Add prescribing-information leaflet reference on cover page.
  – Strengthen narrow-therapeutic-index warning visually.
  – Verify Suresh Kumar quote attribution permissions.
v2 in preparation by Marketing Operations.

───────────────────────────────────────────────────────────────────────
Rilast is a marketed product of ZenRx Pharma. Full prescribing
information must be consulted before use. For Healthcare Professional
use only.
Material code: RIL-KB-2026-001  (v1, returned for changes 2026-04-22)
`,
  },

  { assetId: 4, name: 'fair-balance-trainer-v1.txt',
    body: `═══════════════════════════════════════════════════════════════════════
FIELD-REP TRAINING — FAIR BALANCE COMPLIANCE
Version 1.0  [DRAFT]    Audience: New MR onboarding (Weeks 1–2)
═══════════════════════════════════════════════════════════════════════

WELCOME
This module is the first of four mandatory compliance trainings for
new Medical Representatives at ZenRx Pharma. Estimated time: 90 min.
Pass mark: 70% on the end-of-module quiz.

─── LEARNING OBJECTIVES ───────────────────────────────────────────────
By the end of this module, you will be able to:
  1. Define "fair balance" as it applies to pharmaceutical promotion.
  2. Recognise the regulatory frameworks that govern your detailing
     conversations (DPCO, DCGI, IFPMA, OPPI Code).
  3. Apply the "every claim, paired" rule in routine detailing.
  4. Identify off-label discussion triggers and redirect appropriately.
  5. Document compliance-relevant content in your DCR call summaries.

═══════════════════════════════════════════════════════════════════════
MODULE 1 — WHAT IS "FAIR BALANCE"?
═══════════════════════════════════════════════════════════════════════

DEFINITION
Fair balance is the principle that every promotional efficacy claim
about a medicine MUST be paired with relevant safety, contraindication,
or limitation information of comparable prominence and clarity.

WHY IT MATTERS
  • Patient safety — prescribers make decisions based on full picture.
  • Legal exposure — penalties under DPCO Sec. 21, DCGI Schedule M.
  • Reputational — every regulatory finding goes on public record.
  • Career — three substantiated findings → termination per HR policy.

═══════════════════════════════════════════════════════════════════════
MODULE 2 — PAIRING CLAIMS WITH SAFETY
═══════════════════════════════════════════════════════════════════════

THE "EVERY CLAIM, PAIRED" RULE
Whenever you state an efficacy benefit, immediately pair it with the
relevant adverse-reaction context.

  ✗ NOT FAIR BALANCE
    "Derise reduces nasal symptoms by 38%."

  ✓ FAIR BALANCE
    "Derise reduces nasal symptoms by 38% in our Phase III trial.
     The most common side effects in that study were headache (4%),
     dry mouth (3%), and fatigue (2%). Renal impairment requires
     dose adjustment."

PRACTICAL TIP — keep a paired-claims card in your detailing folder.
For every product you carry, write the top 3 efficacy talking points
on the left, and the matching safety-pair on the right.

═══════════════════════════════════════════════════════════════════════
MODULE 3 — COMPARATIVE CLAIMS
═══════════════════════════════════════════════════════════════════════

A comparative claim asserts superiority or equivalence relative to
another product. THESE REQUIRE HEAD-TO-HEAD EVIDENCE — published,
peer-reviewed, in the same patient population, with the same endpoint.

  ✗ NOT ACCEPTABLE
    "Bevaas works better than ramipril in elderly patients."
    (No published H2H trial; this is implied superiority.)

  ✓ ACCEPTABLE
    "In a head-to-head 24-week trial of 612 elderly hypertensive
     patients (Joshi 2024, J Hypertens India), Bevaas achieved a
     -14 mmHg systolic reduction vs -11 mmHg for ramipril (p=0.04)."

═══════════════════════════════════════════════════════════════════════
MODULE 4 — OFF-LABEL DISCUSSION
═══════════════════════════════════════════════════════════════════════

OFF-LABEL = use of a product for an indication, dose, age group, or
route NOT in the approved India label.

THE GOLDEN RULE
You may NOT initiate or solicit off-label discussion. Period.

If a doctor asks an unsolicited specific clinical question, you may:
  1. Acknowledge the question.
  2. State that this is outside your detailing scope.
  3. Offer to route the query to Medical Affairs for a written response.
  4. Document the exchange in your DCR call summary.

You MAY NOT:
  • Volunteer off-label data even if asked generally.
  • Hand over a publication that supports off-label use.
  • Imply tacit endorsement.

─── END OF MODULE 1.0 (DRAFT) ─────────────────────────────────────────
[Editor note: v1 missing the documentation module + real-case examples.
v2 in preparation — see fair-balance-trainer-v2.]
Material code: TRN-FB-2026-001  (v1, draft)
`,
  },

  { assetId: 4, name: 'fair-balance-trainer-v2.txt',
    body: `═══════════════════════════════════════════════════════════════════════
FIELD-REP TRAINING — FAIR BALANCE COMPLIANCE
Version 2.0  [DRAFT]    Audience: New MR onboarding (Weeks 1–2)
                        Plus: Refresher for tenured MRs (annual)
═══════════════════════════════════════════════════════════════════════

WHAT'S NEW IN v2
  • Module 5 — Documenting compliance language in DCR call summaries.
  • Module 6 — Real anonymised cases from FY2025 compliance findings.
  • Quiz expanded to 15 questions (was 10), pass mark raised to 80%.
  • Cross-links to Compliance Watchdog AI flag examples.

─── LEARNING OBJECTIVES ───────────────────────────────────────────────
By the end of this module, you will be able to:
  1. Define "fair balance" as it applies to pharmaceutical promotion.
  2. Recognise DPCO, DCGI, IFPMA, and OPPI Code frameworks.
  3. Apply the "every claim, paired" rule in routine detailing.
  4. Identify off-label discussion triggers and redirect appropriately.
  5. Document compliance-relevant exchanges in your DCR call summary
     using approved language patterns.   [NEW]
  6. Recognise the patterns that triggered FY2025 compliance flags.   [NEW]

═══════════════════════════════════════════════════════════════════════
MODULES 1–4 — unchanged from v1.0 (see prior version).
═══════════════════════════════════════════════════════════════════════

═══════════════════════════════════════════════════════════════════════
MODULE 5 — DOCUMENTING IN YOUR DCR (NEW)
═══════════════════════════════════════════════════════════════════════

Your DCR call summary is the single source of truth for what was
actually discussed. The Compliance Watchdog AI scans every DCR and
flags language that suggests off-label promotion, missing fair
balance, comparative claims without H2H evidence, or gift-threshold
breaches.

WRITE IT THE WAY IT HAPPENED. Do not over-edit; do not under-state.

─── APPROVED LANGUAGE PATTERNS ────────────────────────────────────────

Pattern 1 — efficacy claim with safety pair:
  "Discussed Derise efficacy data (38% TNSS reduction, ARIA-INDIA);
   reviewed safety profile incl. headache (4%) and dry mouth (3%);
   noted renal dose adjustment in CrCl 30–60."

Pattern 2 — comparative claim grounded in H2H evidence:
  "Reviewed Bevaas vs ramipril H2H data (Joshi 2024, n=612, 24-wk):
   Bevaas -14 mmHg vs -11 mmHg (p=0.04). Doctor noted patient mix."

Pattern 3 — off-label question deflected:
  "Doctor asked about Derise in chronic urticaria pediatric use.
   Acknowledged outside detailing scope; offered to route to
   Medical Affairs for written response. Will follow up next visit."

Pattern 4 — sample distribution:
  "Distributed 12 sample units of Bevaas 5mg per doctor's request
   for ongoing patient cohort. Recorded lot BVS-2026-Q1-A."

─── LANGUAGE TO AVOID ─────────────────────────────────────────────────
   "best in class"  /  "clinically superior"  /  "miracle drug"
   "everyone is switching to"  /  "the only choice for..."
   "I told the doctor it works for [unapproved indication]..."

═══════════════════════════════════════════════════════════════════════
MODULE 6 — REAL CASES FROM FY2025 (NEW)
═══════════════════════════════════════════════════════════════════════

Three anonymised cases below were captured by Compliance Watchdog AI
in FY2025 and confirmed by the compliance officer. Each is presented
as: (1) what the MR wrote, (2) what the system flagged, (3) the
correct alternative.

─── CASE 1 — Missing fair balance ─────────────────────────────────────
  WROTE:    "Highlighted Derise 38% reduction. Doctor was impressed
             by efficacy magnitude. Strong case for first-line."
  FLAGGED:  Efficacy claim presented WITHOUT paired safety context.
             Severity: HIGH.  Outcome: training plan + manager review.
  CORRECT:  See Module 5 Pattern 1 above.

─── CASE 2 — Off-label promotion ──────────────────────────────────────
  WROTE:    "Discussed Bevaas for migraine prophylaxis. Mentioned
             that some doctors have tried it off-label with positive
             results."
  FLAGGED:  MR-volunteered off-label promotion. Migraine is NOT in
             Bevaas approved indications.
             Severity: CRITICAL.  Outcome: formal warning + retraining.
  CORRECT:  Doctor-initiated off-label questions are routed to Medical
             Affairs (see Module 4). MR-initiated off-label discussion
             is prohibited.

─── CASE 3 — Gift threshold breach ────────────────────────────────────
  WROTE:    "Hosted Dr. X for lunch at JW Marriott. Bill ~₹6,800."
  FLAGGED:  Hospitality exceeds the OPPI Code per-meal cap of ₹3,000
             (excluding venue overhead).
             Severity: MEDIUM.  Outcome: expense reimbursed personally,
             entered in compliance ledger.
  CORRECT:  Pre-approve any HCP hospitality >₹3,000 with your manager
             AND the Compliance team BEFORE the event.

═══════════════════════════════════════════════════════════════════════
QUIZ
═══════════════════════════════════════════════════════════════════════
15 multiple-choice questions, randomised order, 80% pass mark.
Three attempts permitted; 30-day cooldown after a third failure.

─── END OF MODULE 2.0 (DRAFT) ─────────────────────────────────────────
[Editor note: pending MLR submission. Once approved, supersedes v1.0
which remains in DRAFT and will be RETIRED on publication.]
Material code: TRN-FB-2026-002  (v2, draft)
`,
  },
];

let written = 0;
for (const { assetId, name, body } of files) {
  const dir = path.join(root, String(assetId));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, body, 'utf8');
  written++;
  console.log(`  wrote ${path.relative(path.resolve(__dirname, '..', '..'), filePath)} (${body.length} bytes)`);
}

console.log(`\n[seed_content_files] ${written} files written to ${root}`);
