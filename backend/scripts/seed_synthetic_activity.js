#!/usr/bin/env node
/**
 * seed_synthetic_activity.js
 *
 * One-shot generator for a 12-month deep history across the activity tables:
 *   - dcr (~600 rows)
 *   - rcpa (~150 rows)
 *   - secondary_sales (~108 rows over 12 months × 9 products × 3 MRs ≈ extended)
 *   - mr_targets (~108 rows over 12 months)
 *   - follow_up_tasks (~60 rows)
 *   - content_views (~50 rows)
 *   - nba_recommendations (3 rows — today, per MR)
 *   - compliance_findings (~30 rows total — 12 from base seed + ~20 historical)
 *   - medical_queries (~42 rows total — 12 base + ~30 historical)
 *   - medical_engagements (~16 total — 6 base + ~10 historical/future)
 *   - engagement_attendees (~50 total)
 *   - audit_log (~200 entries spread over 90 days)
 *
 * All dates use NOW() / CURRENT_DATE arithmetic so the data shifts forward
 * automatically as the real clock advances. Re-running regenerates "the last
 * 12 months of activity" relative to the new today — no manual rollover.
 *
 * Output: backend/db/seed_synthetic_activity.sql (a single file with
 * TRUNCATE + INSERT statements for each affected table). The existing
 * apply_demo_seeds.sh runs the base seeds first, then this file, so the base
 * deterministic rows (with stable ids) come first and this file appends/
 * extends history.
 *
 * Usage (from repo root):
 *   node backend/scripts/seed_synthetic_activity.js
 *
 * Then apply via apply_demo_seeds.sh which already includes this step.
 *
 * Determinism: a fixed RNG seed is used so outputs are stable across runs.
 * Override with `SEED=<int>` env var if you want a different shuffle.
 */

const fs = require('fs');
const path = require('path');

// ──────────────────────────────────────────────────────────────────────────
// Seeded RNG (Mulberry32). Keeps the generator deterministic so re-running
// produces the same SQL — only the dates shift via CURRENT_DATE arithmetic.
// ──────────────────────────────────────────────────────────────────────────
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rng = mulberry32(parseInt(process.env.SEED || '20260501', 10));
const rand = () => rng();
const randint = (min, max) => Math.floor(rand() * (max - min + 1)) + min;
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const pickWeighted = (entries) => {
  // entries: [[item, weight], ...]
  const total = entries.reduce((s, [, w]) => s + w, 0);
  let r = rand() * total;
  for (const [item, w] of entries) {
    r -= w;
    if (r <= 0) return item;
  }
  return entries[entries.length - 1][0];
};
const sample = (arr, n) => {
  const copy = arr.slice();
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, n);
};

// ──────────────────────────────────────────────────────────────────────────
// Reference data — keep in sync with the base seeds.
// ──────────────────────────────────────────────────────────────────────────

const MRS = [
  { user_id: 'mr_rahul_001',  name: 'Rahul Sharma',   territory: 'Mumbai North', ip: '203.0.113.41' },
  { user_id: 'mr_priya_002',  name: 'Priya Patel',    territory: 'Mumbai South', ip: '203.0.113.78' },
  { user_id: 'mr_robert_003', name: 'Robert Johnson', territory: 'Delhi NCR',    ip: '203.0.113.99' },
];

// Doctors keyed by territory. Mirrors seed_doctors.sql.
const DOCTORS = [
  { id: 1,  name: 'Dr. Anil Mehta',    specialty: 'Cardiology',         territory: 'Mumbai North', tier: 'A' },
  { id: 2,  name: 'Dr. Sunita Verma',  specialty: 'General Medicine',   territory: 'Mumbai North', tier: 'B' },
  { id: 3,  name: 'Dr. Pradeep Joshi', specialty: 'Nephrology',         territory: 'Mumbai North', tier: 'A' },
  { id: 4,  name: 'Dr. Kavita Rao',    specialty: 'Endocrinology',      territory: 'Mumbai North', tier: 'B' },
  { id: 5,  name: 'Dr. Ramesh Patil',  specialty: 'Dermatology',        territory: 'Mumbai North', tier: 'B' },
  { id: 6,  name: 'Dr. Rajesh Kapoor', specialty: 'Neurology',          territory: 'Mumbai South', tier: 'A' },
  { id: 7,  name: 'Dr. Meena Shah',    specialty: 'Internal Medicine',  territory: 'Mumbai South', tier: 'B' },
  { id: 8,  name: 'Dr. Vikram Desai',  specialty: 'Cardiology',         territory: 'Mumbai South', tier: 'B' },
  { id: 9,  name: 'Dr. Anita Patel',   specialty: 'General Medicine',   territory: 'Mumbai South', tier: 'C' },
  { id: 10, name: 'Dr. Suresh Kumar',  specialty: 'Cardiology',         territory: 'Delhi NCR',    tier: 'A' },
  { id: 11, name: 'Dr. Neha Sharma',   specialty: 'Neurology',          territory: 'Delhi NCR',    tier: 'B' },
  { id: 12, name: 'Dr. Amit Gupta',    specialty: 'General Medicine',   territory: 'Delhi NCR',    tier: 'B' },
  { id: 13, name: 'Dr. Pooja Singh',   specialty: 'Endocrinology',      territory: 'Delhi NCR',    tier: 'A' },
  { id: 14, name: 'Dr. Rakesh Mishra', specialty: 'Internal Medicine',  territory: 'Delhi NCR',    tier: 'C' },
];

// Flagship doctors get hand-richer histories — 25+ DCRs each.
const FLAGSHIP_DOCTOR_IDS = [1, 3, 10];

// Products — id matches dummy_data.sql
const PRODUCTS = [
  { id: 1, brand: 'Derise', name: 'Derise 10mg', specialty: ['Cardiology', 'General Medicine'] },
  { id: 2, brand: 'Derise', name: 'Derise 20mg', specialty: ['Cardiology', 'Nephrology'] },
  { id: 3, brand: 'Derise', name: 'Derise 50mg', specialty: ['Cardiology'] },
  { id: 4, brand: 'Rilast', name: 'Rilast Tablet',  specialty: ['Internal Medicine', 'General Medicine', 'Endocrinology'] },
  { id: 5, brand: 'Rilast', name: 'Rilast Capsule', specialty: ['Internal Medicine', 'General Medicine'] },
  { id: 6, brand: 'Rilast', name: 'Rilast Syrup',   specialty: ['Paediatrics', 'General Medicine'] },
  { id: 7, brand: 'Bevaas', name: 'Bevaas 5mg',  specialty: ['Neurology', 'Nephrology'] },
  { id: 8, brand: 'Bevaas', name: 'Bevaas 10mg', specialty: ['Neurology', 'Cardiology', 'Endocrinology'] },
  { id: 9, brand: 'Bevaas', name: 'Bevaas 20mg', specialty: ['Neurology'] },
];

// Pharmacies grouped by territory for RCPA realism.
const PHARMACIES = [
  { id: 1,  name: 'CVS Pharmacy',              territory: 'Mumbai North' },
  { id: 2,  name: 'Walgreens',                 territory: 'Mumbai North' },
  { id: 3,  name: 'Rite Aid',                  territory: 'Mumbai North' },
  { id: 4,  name: 'Walmart Pharmacy',          territory: 'Mumbai North' },
  { id: 5,  name: 'Kroger Pharmacy',           territory: 'Mumbai South' },
  { id: 6,  name: 'Target Pharmacy',           territory: 'Mumbai South' },
  { id: 7,  name: 'Costco Pharmacy',           territory: 'Mumbai South' },
  { id: 8,  name: 'Safeway Pharmacy',          territory: 'Delhi NCR' },
  { id: 9,  name: 'MedPlus Pharmacy',          territory: 'Delhi NCR' },
  { id: 10, name: 'Apollo Pharmacy',           territory: 'Delhi NCR' },
  { id: 11, name: 'Wellness Forever Pharmacy', territory: 'Delhi NCR' },
];

const DISTRIBUTORS = [
  { id: 1, name: 'Pharma Distributors Mumbai North', territory: 'Mumbai North' },
  { id: 2, name: 'MedSupply North',                  territory: 'Mumbai North' },
  { id: 3, name: 'HealthCare Distributors South',    territory: 'Mumbai South' },
  { id: 4, name: 'Apollo Supply Chain',              territory: 'Mumbai South' },
  { id: 5, name: 'Delhi Pharma Wholesale',           territory: 'Delhi NCR' },
  { id: 6, name: 'NCR MedDistributors',              territory: 'Delhi NCR' },
];

const COMPETITOR_BRANDS = [
  { brand: 'CardioMax 10mg', company: 'Lupin' },
  { brand: 'CardioMax 20mg', company: 'Lupin' },
  { brand: 'NephroPro',      company: 'Sun Pharma' },
  { brand: 'NeuroPlus 5mg',  company: 'Cipla' },
  { brand: 'NeuroPlus 10mg', company: 'Cipla' },
  { brand: 'EndoCare',       company: 'Dr. Reddy' },
  { brand: 'GenMed Tab',     company: 'Mankind' },
  { brand: 'DermaShield',    company: 'Glenmark' },
];

const REVIEWERS = ['rev_med_001', 'rev_legal_001', 'rev_reg_001'];
const MANAGER = 'mgr_vikram_001';
const ADMIN = 'admin_001';

// Map territory → MR (so RCPA and DCRs stay in-territory).
const MR_BY_TERRITORY = Object.fromEntries(MRS.map(m => [m.territory, m]));

// ──────────────────────────────────────────────────────────────────────────
// SQL helpers
// ──────────────────────────────────────────────────────────────────────────

const sqlEscape = (s) => {
  if (s === null || s === undefined) return 'NULL';
  return "'" + String(s).replace(/'/g, "''") + "'";
};
const sqlJson = (obj) => obj === null ? 'NULL' : sqlEscape(JSON.stringify(obj));
const sqlNum = (n) => n === null || n === undefined ? 'NULL' : Number(n).toString();
const sqlBool = (b) => b === null || b === undefined ? 'NULL' : (b ? 'TRUE' : 'FALSE');
// Anchored relative to NOW() so the seed rolls forward as the clock advances.
const dateOffset = (days) => `(CURRENT_DATE - INTERVAL '${days} days')`;
const tsOffset = (days, hours = 0, minutes = 0) => {
  // We compose intervals so a single inserted timestamp stays consistent.
  const parts = [];
  if (days) parts.push(`INTERVAL '${days} days'`);
  if (hours) parts.push(`INTERVAL '${hours} hours'`);
  if (minutes) parts.push(`INTERVAL '${minutes} minutes'`);
  if (parts.length === 0) return 'NOW()';
  return `(NOW() - ${parts.join(' - ')})`;
};

// ──────────────────────────────────────────────────────────────────────────
// Call-summary generator — fancy, comprehensive, covers good / bad / neutral.
// Each scenario tag drives a distinct narrative + extracts predictable
// keywords for AE / compliance flags so the AI hooks have something to
// work with at runtime, while the seeded narratives feel real.
// ──────────────────────────────────────────────────────────────────────────

const SCENARIO_TAGS = [
  // tag, weight, summaryFn, feedbackFn
  // Weights chosen to mimic real-world distribution: mostly neutral/positive,
  // a small but not-zero stream of safety signals and compliance flags.
  ['routine_positive',        18],
  ['routine_neutral',         15],
  ['detailing_efficacy',      12],
  ['follow_up',               10],
  ['sample_drop',              8],
  ['kol_engagement',           6],
  ['rcpa_check',               6],
  ['safety_concern_minor',     5],   // mild AE signal — gets flagged
  ['safety_concern_major',     3],   // serious AE signal — gets flagged
  ['compliance_off_label',     3],   // off-label discussion — gets flagged
  ['compliance_fair_balance',  3],   // missing fair balance — gets flagged
  ['compliance_gift_threshold', 2],  // expensive lunch / gift — gets flagged
  ['competitor_threat',        4],
  ['doctor_pushback',          3],
  ['no_show',                  2],
];

function summaryFor(tag, doctor, product) {
  const competitorBrand = pick(COMPETITOR_BRANDS).brand;
  switch (tag) {
    case 'routine_positive':
      return [
        `Discussed ${product.name} dosing schedule with ${doctor.name}. Doctor confirmed positive patient outcomes from last 4 weeks.`,
        `Reviewed ${product.name} prescribing experience. ${doctor.name} reported good patient adherence and no notable issues.`,
        `Detailing of ${product.name} went well. ${doctor.name} mentioned planning to expand prescribing to similar profile patients.`,
      ];
    case 'routine_neutral':
      return [
        `Routine call. Updated ${doctor.name} on the latest ${product.brand} portfolio. No specific commitments made.`,
        `Brief touch-base with ${doctor.name}. Discussed the upcoming CME on ${product.brand} family.`,
        `Quick visit to drop the latest ${product.name} brochure. ${doctor.name} was busy with patients; agreed to revisit next week.`,
      ];
    case 'detailing_efficacy':
      return [
        `Full detailing session on ${product.name}. Walked ${doctor.name} through the Phase III pivotal data — primary endpoint reduction and key sub-group analyses. Doctor asked for the full publication; sent post-call.`,
        `Presented updated ${product.name} efficacy data to ${doctor.name}. Highlighted the 38% primary-endpoint reduction at 12 months. Doctor was engaged and asked clarifying questions on patient selection.`,
        `${doctor.name} was specifically interested in the head-to-head comparison data for ${product.name}. Walked through the available evidence; agreed to send the published meta-analysis.`,
      ];
    case 'follow_up':
      return [
        `Follow-up to last visit. ${doctor.name} confirmed initiating ${product.name} on 3 new patients. Will check tolerability at the 4-week mark.`,
        `Followed up on the patient case ${doctor.name} discussed last time. The patient responded well to ${product.name}; doctor is now considering broader use.`,
        `Closed the loop on the dosing question from last visit. Provided ${product.name} dose-adjustment chart; ${doctor.name} appreciated the clarity.`,
      ];
    case 'sample_drop':
      return [
        `Dropped ${product.name} samples at ${doctor.name}'s clinic. Briefly discussed indication; doctor will share with appropriate patients.`,
        `Sample distribution visit. Left ${randint(5, 15)} ${product.name} units with the front desk per ${doctor.name}'s request.`,
        `${doctor.name} requested additional ${product.name} samples for an ongoing patient cohort. Delivered as part of monthly allocation.`,
      ];
    case 'kol_engagement':
      return [
        `${doctor.name} confirmed availability for the upcoming advisory board on ${product.brand}. Discussed the panel topics and his role as chair/panelist.`,
        `Engagement call with ${doctor.name}. He shared insights from his recent CME on ${product.brand}; mentioned positive feedback from peers.`,
        `${doctor.name} agreed to be a faculty speaker for the ${product.brand} regional speaker program. Will follow up with logistics.`,
      ];
    case 'rcpa_check':
      return [
        `RCPA check at the attached pharmacy. ${product.name} prescription volume is steady week-on-week. Will continue current detailing cadence.`,
        `Reviewed pharmacy script trends with ${doctor.name}. ${product.name} numbers improved over last fortnight.`,
        `Pharmacy data shows ${product.name} share holding firm against ${competitorBrand}. ${doctor.name} attributes it to clinical confidence.`,
      ];
    case 'safety_concern_minor':
      // Triggers AE detection — mild signal.
      return [
        `${doctor.name} mentioned one patient on ${product.name} reported mild dizziness in the first week. Patient continued therapy after a dose adjustment; symptoms resolved.`,
        `One patient on ${product.name} experienced transient nausea — mild. ${doctor.name} did not require discontinuation. Reassured doctor with the relevant safety bulletin.`,
        `${doctor.name} flagged that an elderly patient on ${product.name} had a brief episode of postural hypotension. Recommended dose split; symptoms resolved.`,
      ];
    case 'safety_concern_major':
      // Triggers AE detection — serious signal. Should drive an adverse_events row.
      return [
        `${doctor.name} reported a serious adverse event in a patient on ${product.name}: ${pick(['acute hepatic enzyme rise (AST > 4x ULN)', 'severe hyperkalaemia (K+ 6.4)', 'syncopal episode requiring hospitalisation', 'rash with mucosal involvement'])}. Drug discontinued. Asked ${doctor.name} to file the formal AE report; informed pharmacovigilance.`,
        `Adverse event flagged: 62-year-old female on ${product.name} for 8 weeks developed unexplained ${pick(['muscle weakness with elevated CK', 'thrombocytopenia', 'angioedema'])}. Drug stopped. PV team notified.`,
        `${doctor.name} discussed a patient who experienced ${pick(['acute kidney injury', 'severe bradycardia', 'symptomatic hyponatraemia'])} potentially related to ${product.name}. Patient hospitalised; recovering. AE report initiated.`,
      ];
    case 'compliance_off_label':
      // Triggers complianceWatchdog — off-label.
      return [
        `${doctor.name} asked about using ${product.name} for ${pick(['migraine prophylaxis', 'paediatric anxiety', 'chronic fatigue syndrome', 'fibromyalgia'])}. Mentioned that some doctors have tried it off-label with positive results.`,
        `Discussion drifted to ${product.name} for ${pick(['weight loss', 'cosmetic dermatology', 'sports performance'])} — these are not labelled indications. Should have redirected sooner.`,
        `${doctor.name} brought up using ${product.name} in a ${pick(['paediatric population', 'pregnant patient', 'pre-treatment surgical setting'])}. Discussed informally based on his clinical experience.`,
      ];
    case 'compliance_fair_balance':
      // Triggers complianceWatchdog — missing fair balance.
      return [
        `Highlighted ${product.name}'s 38% primary-endpoint reduction. ${doctor.name} was impressed by the efficacy magnitude. Strong case for first-line.`,
        `${product.name} showed best-in-class reduction vs ${competitorBrand} in the recent meta-analysis. Position is clear: ${product.name} is superior.`,
        `Stressed how much faster onset of action ${product.name} has vs alternatives. ${doctor.name} agreed it's the best in its class.`,
      ];
    case 'compliance_gift_threshold':
      // Triggers complianceWatchdog — gift over threshold.
      return [
        `Hosted ${doctor.name} for lunch at ${pick(['The Oberoi', 'JW Marriott', 'Taj Lands End', 'ITC Maratha'])}. Bill was approximately ₹${randint(3500, 7500)}. Discussed ${product.name} and broader portfolio.`,
        `Gifted ${doctor.name} a ${pick(['premium executive notebook set', 'leather diary', 'high-end pen set'])} during festive visit. Approximate value ₹${randint(2500, 5500)}.`,
        `Sponsored ${doctor.name}'s attendance at the ${pick(['Mumbai cardiology weekend symposium', 'private CME dinner at JW Marriott', 'Goa speaker getaway'])}. Total cost approximately ₹${randint(8000, 18000)}.`,
      ];
    case 'competitor_threat':
      return [
        `${doctor.name} mentioned that ${competitorBrand} reps have been visiting more frequently. Said the competitor is offering aggressive pricing on bulk samples.`,
        `Pushback from ${doctor.name} — felt ${competitorBrand} has better post-marketing support. Need to address the gap urgently.`,
        `${doctor.name} flagged that several peers have switched to ${competitorBrand} for new starts. Asked for a refresher on ${product.name}'s differentiation.`,
      ];
    case 'doctor_pushback':
      return [
        `${doctor.name} pushed back on ${product.name} pricing — feels patients struggle with affordability. Asked about patient assistance programmes.`,
        `Concerns raised about ${product.name}'s ${pick(['hepatotoxicity profile', 'CV warnings', 'long-term safety'])}. ${doctor.name} is in a "wait and watch" stance.`,
        `${doctor.name} not convinced by the latest ${product.name} data. Said he prefers the older alternative until more real-world evidence accumulates.`,
      ];
    case 'no_show':
      return [
        `${doctor.name} unavailable. Receptionist said he was in surgery. Will reschedule next week.`,
        `Doctor cancelled at the last minute. Left brand reminder leave-behinds and contact details.`,
        `${doctor.name} stuck in clinic backlog. Brief 2-minute touch-base only; rescheduling for a longer detailing slot.`,
      ];
    default:
      return [`Discussed ${product.name} with ${doctor.name}.`];
  }
}

function feedbackFor(tag, doctor, product) {
  switch (tag) {
    case 'routine_positive':
      return pick([
        `"Patients are tolerating ${product.name} well. I'll continue with current cohort."`,
        `"Good experience overall. No reason to switch right now."`,
        `"Send me the latest evidence summary when convenient."`,
      ]);
    case 'routine_neutral':
      return pick([
        `"Noted. Will keep ${product.name} in mind for the right patient."`,
        `"Thanks, leave the brochure with the desk."`,
        `"Catch me next week — I'm pressed for time today."`,
      ]);
    case 'detailing_efficacy':
      return pick([
        `"The 38% reduction is impressive. Send me the full publication."`,
        `"How does this compare to the current standard of care? Need the head-to-head data."`,
        `"What's the safety profile in elderly patients? That's my main population."`,
      ]);
    case 'follow_up':
      return pick([
        `"Three new patients started — early signs are promising."`,
        `"Patient from last visit has stabilised. Continuing ${product.name}."`,
        `"Dose adjustment chart was helpful. Will request more samples."`,
      ]);
    case 'sample_drop':
      return pick([
        `"Thanks for the samples. I'll share with appropriate patients."`,
        `"Need ${randint(10, 30)} more for next month."`,
        `"Front desk has it. Appreciate the timely delivery."`,
      ]);
    case 'kol_engagement':
      return pick([
        `"Happy to chair the panel. Send me the agenda by next week."`,
        `"Looking forward to the speaker programme. Travel logistics?"`,
        `"Excellent — let's also discuss expanding the speaker bureau."`,
      ]);
    case 'rcpa_check':
      return pick([
        `"Volume looks healthy. Keep the cadence going."`,
        `"Pharmacy reports good demand for ${product.name}."`,
        `"Steady. No concerns from my end."`,
      ]);
    case 'safety_concern_minor':
      return pick([
        `"Patient continued after dose split — symptoms resolved within a week."`,
        `"Mild only. Reassuring patient and continuing therapy."`,
        `"Manageable. Will report formally if it recurs."`,
      ]);
    case 'safety_concern_major':
      return pick([
        `"Drug stopped immediately. I'm filing the AE report this week."`,
        `"Patient is recovering. We need a quick safety briefing for our group."`,
        `"This is concerning. Please send the latest pharmacovigilance update."`,
      ]);
    case 'compliance_off_label':
      return pick([
        `"Some peers have tried it off-label with success. Worth exploring."`,
        `"I know it's not on label, but anecdotally I've seen it help these patients."`,
        `"Curious — has the company looked at this indication formally?"`,
      ]);
    case 'compliance_fair_balance':
      return pick([
        `"Sounds like a clear winner. I'll prescribe more aggressively."`,
        `"This is the best in its class — I'm convinced."`,
        `"Will switch my new starts to ${product.name}."`,
      ]);
    case 'compliance_gift_threshold':
      return pick([
        `"Thank you for the lovely lunch — much appreciated."`,
        `"Generous of you. Catch me next month for follow-up."`,
        `"Looking forward to the symposium weekend."`,
      ]);
    case 'competitor_threat':
      return pick([
        `"${pick(COMPETITOR_BRANDS).brand} is making a strong push. You'll need to do better."`,
        `"Patient cost is the deciding factor for me right now."`,
        `"Peers are switching. What's your differentiation story?"`,
      ]);
    case 'doctor_pushback':
      return pick([
        `"Affordability is the real issue. Help me with that and I'll prescribe more."`,
        `"I want to see more real-world data before I expand prescribing."`,
        `"Not convinced yet. Bring me the long-term safety follow-up."`,
      ]);
    case 'no_show':
      return null;
    default:
      return null;
  }
}

// ──────────────────────────────────────────────────────────────────────────
// Build phase: compose all the SQL fragments.
// Output is appended into a `chunks` array and flushed at the end.
// ──────────────────────────────────────────────────────────────────────────

const chunks = [];
const out = (s) => chunks.push(s);

out(`-- ─────────────────────────────────────────────────────────────────────────────
-- seed_synthetic_activity.sql
--
-- AUTO-GENERATED by backend/scripts/seed_synthetic_activity.js. Do not hand-edit.
-- Re-run the generator to regenerate. All dates use CURRENT_DATE / NOW()
-- arithmetic so the data shifts forward automatically as the real clock
-- advances (no rollover job needed).
--
-- Generated: ${new Date().toISOString()}
-- Generator seed: ${process.env.SEED || '20260501'}
--
-- Composes 12 months of synthetic field activity:
--   - dcr (~600 rows, with hand-richer histories for flagship doctors)
--   - rcpa (~150 rows over 12 months)
--   - secondary_sales + mr_targets (12-month coverage)
--   - follow_up_tasks (~60 rows)
--   - content_views (~50 rows)
--   - nba_recommendations (3 rows — today)
--   - compliance_findings (extends base seed by ~20 historical findings)
--   - medical_queries (extends by ~30 historical queries)
--   - medical_engagements + engagement_attendees (extends by ~10 engagements)
--   - audit_log (extends to ~200 entries over 90 days)
--
-- Run AFTER: all migrations + base seeds (including the Phase B/C bundle).
-- TRUNCATEs only the activity tables it owns; does not touch reference data.
-- ─────────────────────────────────────────────────────────────────────────────

`);

// ──────────────────────────────────────────────────────────────────────────
// 1. DCRs
//
// Volume target:
//   - 3 flagship doctors (Anil, Pradeep, Suresh) × 25 DCRs each = 75 hand-richer.
//   - 11 other doctors × ~45 DCRs each = ~495 bulk-generated.
//   - Total ~570 — close to the 600 target, with realistic per-MR cadence.
//
// Date distribution: weighted toward the last 3 months (40%), middle 6 months
// (40%), oldest 3 months (20%). Mimics how recent activity is denser in real
// CRM data because old records age out of dashboards.
//
// Recency tier: each doctor's MOST RECENT visit is constrained by RECENCY_TIER
// so the coverage dashboard shows realistic spread (some hot, some at-risk,
// some cold). Older visits still spread across the year via pickDateOffset().
// ──────────────────────────────────────────────────────────────────────────

// Per-doctor most-recent-visit windows. Flagship doctors stay hot.
// At default 30-day threshold this yields ~3 cold, ~3 at-risk, ~8 healthy.
const RECENCY_TIER = {
  // hot (0–10 days): flagships + 2 tier-A non-flagships
  1: 'hot', 3: 'hot', 10: 'hot', 6: 'hot', 13: 'hot',
  // warm (10–14 days)
  2: 'warm', 7: 'warm', 12: 'warm',
  // at-risk (18–28 days)
  4: 'at_risk', 8: 'at_risk', 11: 'at_risk',
  // cold (35–60 days)
  5: 'cold', 9: 'cold', 14: 'cold',
};

function recencyFloorFor(doctorId) {
  switch (RECENCY_TIER[doctorId]) {
    case 'hot':     return randint(0, 10);
    case 'warm':    return randint(10, 14);
    case 'at_risk': return randint(18, 28);
    case 'cold':    return randint(35, 60);
    default:        return randint(0, 14);
  }
}

out(`-- ── DCRs (truncate then bulk-load) ───────────────────────────────────────────
TRUNCATE dcr RESTART IDENTITY CASCADE;

`);

const dcrInserts = [];
let dcrIdSequence = 1;
const dcrRecords = [];  // keep so we can build follow-ups + AE links

function pickDateOffset() {
  const r = rand();
  // 40% last 90 days, 40% 90-270 days, 20% 270-365 days
  if (r < 0.40) return randint(0, 90);
  if (r < 0.80) return randint(91, 270);
  return randint(271, 365);
}

function buildDcr(doctor, mr, scenarioTag) {
  // Pick a product the doctor's specialty is reasonable for; fall back to any.
  const matchingProducts = PRODUCTS.filter(p => p.specialty.includes(doctor.specialty));
  const product = matchingProducts.length > 0 ? pick(matchingProducts) : pick(PRODUCTS);

  const days = pickDateOffset();
  const summaries = summaryFor(scenarioTag, doctor, product);
  const callSummary = pick(summaries);
  const feedback = feedbackFor(scenarioTag, doctor, product);

  // Sample distribution — present on ~30% of routine calls and most sample_drop calls.
  let samples = null;
  if (scenarioTag === 'sample_drop' || (rand() < 0.30 && scenarioTag !== 'no_show')) {
    samples = [
      { name: product.name, lot: `${product.brand.substring(0, 3).toUpperCase()}-2026-Q1-A`, qty: randint(5, 20) }
    ];
  }

  // Visit time distributed across the work day.
  const hours = randint(9, 17);
  const minutes = pick([0, 15, 30, 45]);

  return {
    id: dcrIdSequence++,
    user_id: mr.user_id,
    name: doctor.name,
    doctor_id: doctor.id,
    days,
    visit_offset: { days, hours, minutes },
    product_name: product.name,
    product,
    call_summary: callSummary,
    doctor_feedback: feedback,
    samples,
    scenario_tag: scenarioTag,
  };
}

// 1a) Flagship doctors — 25 DCRs each, hand-distributed scenarios.
for (const docId of FLAGSHIP_DOCTOR_IDS) {
  const doctor = DOCTORS.find(d => d.id === docId);
  const mr = MR_BY_TERRITORY[doctor.territory];
  const flagshipScenarios = [
    'kol_engagement', 'detailing_efficacy', 'follow_up', 'routine_positive',
    'detailing_efficacy', 'kol_engagement', 'sample_drop', 'follow_up',
    'rcpa_check', 'detailing_efficacy', 'routine_positive', 'kol_engagement',
    'follow_up', 'detailing_efficacy', 'sample_drop', 'rcpa_check',
    'routine_positive', 'follow_up', 'detailing_efficacy', 'kol_engagement',
    // Add a small mix of edge cases so flagship histories look real.
    'safety_concern_minor', 'compliance_fair_balance', 'competitor_threat',
    'follow_up', 'routine_positive',
  ];
  for (const tag of flagshipScenarios) {
    dcrRecords.push(buildDcr(doctor, mr, tag));
  }
}

// 1b) Non-flagship doctors — bulk generate ~45 DCRs each via weighted scenarios.
for (const doctor of DOCTORS) {
  if (FLAGSHIP_DOCTOR_IDS.includes(doctor.id)) continue;
  const mr = MR_BY_TERRITORY[doctor.territory];
  const targetCount = randint(35, 50);
  for (let i = 0; i < targetCount; i++) {
    const tag = pickWeighted(SCENARIO_TAGS);
    dcrRecords.push(buildDcr(doctor, mr, tag));
  }
}

// Apply per-doctor recency floor: for at-risk and cold doctors, shift ALL
// visits inside the recent window outward so MAX(date) per doctor reflects
// the tier. (Pushing only the single most-recent row doesn't help —
// pickDateOffset() typically generates several visits in the last 30 days
// per doctor, and MAX(date) takes the smallest offset.)
//
// Strategy:
//   - For each at-risk/cold doctor, pick a single floor value (e.g. 22 or 47).
//   - Any DCR with days < floor gets shifted to a small jitter window above
//     the floor (floor .. floor+45) so the most-recent visit is at the floor
//     and older "hidden" visits cluster shortly after.
//   - Hot/warm doctors are left untouched — their natural distribution
//     already keeps them in-window.
{
  const dcrsByDoctor = new Map();
  for (const r of dcrRecords) {
    if (!dcrsByDoctor.has(r.doctor_id)) dcrsByDoctor.set(r.doctor_id, []);
    dcrsByDoctor.get(r.doctor_id).push(r);
  }
  for (const [doctorId, rows] of dcrsByDoctor) {
    const tier = RECENCY_TIER[doctorId];
    if (tier !== 'at_risk' && tier !== 'cold') continue;
    const floor = recencyFloorFor(doctorId);
    rows.sort((a, b) => a.visit_offset.days - b.visit_offset.days);
    // Force the absolute most-recent DCR to land at the floor exactly.
    rows[0].visit_offset.days = floor;
    rows[0].days = floor;
    // For any other DCR currently inside the recent window, push it out
    // so MAX(date) per doctor stays at `floor`. Use a jitter so the
    // cluster of visits doesn't all sit on the same day.
    for (let i = 1; i < rows.length; i++) {
      if (rows[i].visit_offset.days < floor) {
        const pushed = floor + randint(1, 45);
        rows[i].visit_offset.days = pushed;
        rows[i].days = pushed;
      }
    }
  }
}

// Sort by date ASC for stable ids — the auto-generated id reflects chronology.
dcrRecords.sort((a, b) => b.visit_offset.days - a.visit_offset.days);
// Re-number so id 1 is the oldest after the sort. (Not strictly needed since
// we use TRUNCATE RESTART IDENTITY, but keeps the file tidy.)
dcrRecords.forEach((r, i) => { r.id = i + 1; });

// Emit batched INSERTs for DCRs (Postgres handles thousands per stmt fine).
const DCR_BATCH = 50;
for (let i = 0; i < dcrRecords.length; i += DCR_BATCH) {
  const batch = dcrRecords.slice(i, i + DCR_BATCH);
  const values = batch.map(r => {
    const visitTs = `(NOW() - INTERVAL '${r.visit_offset.days} days' - INTERVAL '${r.visit_offset.hours} hours' - INTERVAL '${r.visit_offset.minutes} minutes')`;
    return `(${sqlEscape(r.user_id)}, ${sqlEscape(r.name)}, ${dateOffset(r.visit_offset.days)}, ${visitTs}, ${sqlEscape(r.product_name)}, ${r.samples ? sqlJson(r.samples) + '::jsonb' : 'NULL'}, ${sqlEscape(r.call_summary)}, ${r.doctor_feedback ? sqlEscape(r.doctor_feedback) : 'NULL'})`;
  }).join(',\n  ');
  out(`INSERT INTO dcr (user_id, name, date, visit_time, product, samples, call_summary, doctor_feedback)
VALUES
  ${values};
`);
}

console.error(`[gen] DCRs: ${dcrRecords.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 2. Adverse events (derive from safety_concern_major DCRs)
// Real route writes these via the AE-detection AI. We synthesize a few so
// the Drug Safety inbox isn't sparse on first open. Use the existing
// adverse_events table.
// ──────────────────────────────────────────────────────────────────────────

out(`
-- ── Adverse events derived from safety_concern_major DCRs ────────────────────
TRUNCATE adverse_events RESTART IDENTITY CASCADE;

`);

const aeRecords = [];
const majorSafetyDcrs = dcrRecords.filter(r => r.scenario_tag === 'safety_concern_major');

// Reviewer pool + canned decision notes. Schema CHECK allows
// pending | reviewed | confirmed | dismissed (migration_v2.sql:63).
const AE_REVIEWERS = ['mgr_vikram_001', 'admin_001'];
const AE_NOTES = {
  confirmed: [
    'Confirmed AE — added to PV database, reportable per Schedule Y.',
    'Severity reclassified per CIOMS terms; causality assessed as probable.',
    'Causality probable; reported to NCC-PvPI. Awaiting follow-up.',
    'Confirmed; label safety section to be updated with this signal.',
  ],
  dismissed: [
    'Pre-existing condition, unrelated to drug.',
    'No temporal relationship — drug discontinued 6 months prior to event.',
    'Symptom not in label profile; alternative aetiology identified.',
    'Concurrent illness explains symptoms; causality unlikely.',
  ],
  reviewed: [
    'Initial triage complete — awaiting causality assessment.',
    'Escalated to medical affairs for follow-up.',
    'Patient records requested from prescriber to complete assessment.',
  ],
};

for (const dcr of majorSafetyDcrs.slice(0, 16)) {
  // Pick a representative symptom set + severity.
  const severity = pickWeighted([['mild', 1], ['moderate', 4], ['severe', 4], ['critical', 2]]);
  const symptomSets = [
    ['hepatic enzyme elevation', 'fatigue', 'abdominal discomfort'],
    ['hyperkalaemia', 'muscle weakness'],
    ['syncopal episode', 'symptomatic hypotension'],
    ['rash', 'mucosal involvement', 'fever'],
    ['acute kidney injury', 'oliguria'],
    ['bradycardia', 'dizziness'],
    ['hyponatraemia', 'confusion'],
    ['thrombocytopenia', 'bruising'],
  ];
  // Spread across all 4 statuses — keeps the Drug Safety inbox visually
  // populated across pending / reviewed / confirmed / dismissed filter buttons.
  const status = pickWeighted([
    ['pending', 6],
    ['reviewed', 3],
    ['confirmed', 4],
    ['dismissed', 3],
  ]);
  let reviewedBy = null;
  let reviewNotes = null;
  let reviewedDays = null;
  if (status !== 'pending') {
    reviewedBy = pick(AE_REVIEWERS);
    reviewNotes = pick(AE_NOTES[status]);
    // Reviewer acted 1–7 days after detection — clamp to >= 0 in case the
    // detected_at is itself today.
    reviewedDays = Math.max(0, dcr.visit_offset.days - randint(1, 7));
  }
  aeRecords.push({
    user_id: dcr.user_id,
    dcr_id: dcr.id,  // will be the auto-assigned id
    doctor_name: dcr.name,
    drug: dcr.product_name,
    symptoms: pick(symptomSets),
    severity,
    patient_info: { age_range: pick(['50-60', '60-70', '70-80']), gender: pick(['M', 'F']), duration_on_drug: `${randint(2, 16)} weeks` },
    timeline: pick(['Within 2 weeks of starting therapy', 'After 6-8 weeks', 'Late in chronic therapy']),
    days: dcr.visit_offset.days,
    status,
    reviewed_by: reviewedBy,
    review_notes: reviewNotes,
    reviewed_days: reviewedDays,
  });
}

if (aeRecords.length > 0) {
  out(`-- adverse_events insert: array literal style for symptoms. Column is detected_at, not created_at.
-- Status spread + reviewer trail so the Drug Safety inbox shows realistic
-- distribution across pending / reviewed / confirmed / dismissed.
INSERT INTO adverse_events
  (user_id, doctor_name, drug, symptoms, severity, patient_info, timeline, detected_at, status, reviewed_by, review_notes, reviewed_at)
VALUES
  ${aeRecords.map(r => {
    const reviewedAt = r.reviewed_days === null ? 'NULL' : tsOffset(r.reviewed_days);
    return `(${sqlEscape(r.user_id)}, ${sqlEscape(r.doctor_name)}, ${sqlEscape(r.drug)}, ARRAY[${r.symptoms.map(s => sqlEscape(s)).join(', ')}]::text[], ${sqlEscape(r.severity)}, ${sqlJson(r.patient_info)}::jsonb, ${sqlEscape(r.timeline)}, ${tsOffset(r.days)}, ${sqlEscape(r.status)}, ${r.reviewed_by ? sqlEscape(r.reviewed_by) : 'NULL'}, ${r.review_notes ? sqlEscape(r.review_notes) : 'NULL'}, ${reviewedAt})`;
  }).join(',\n  ')};

`);
  console.error(`[gen] Adverse events: ${aeRecords.length}`);
}

// ──────────────────────────────────────────────────────────────────────────
// 3. RCPA — 12-month retail prescription audits
// Target: ~150 rows. Each pharmacy gets visited roughly monthly by its
// territory MR. our_value vs competitor_value tells a momentum story.
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── RCPA records (12 months, ~monthly per pharmacy per MR) ──────────────────
TRUNCATE rcpa RESTART IDENTITY CASCADE;

`);

const rcpaRecords = [];
for (const pharm of PHARMACIES) {
  const mr = MR_BY_TERRITORY[pharm.territory];
  // 11-13 audits over 12 months per pharmacy.
  const monthsToAudit = sample([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], randint(11, 12));
  for (const monthsBack of monthsToAudit) {
    // Day-of-month is randomly picked.
    const day = randint(1, 28);
    const days = monthsBack * 30 + day;

    // Product mix per pharmacy — 1-2 of our products audited each visit.
    const ourProducts = sample(PRODUCTS, randint(1, 2));
    for (const product of ourProducts) {
      const competitor = pick(COMPETITOR_BRANDS);
      // Volume trend story: rising over time for some products, declining for others.
      const baseVolume = product.brand === 'Derise' ? 250 : product.brand === 'Bevaas' ? 180 : 120;
      const trend = product.brand === 'Bevaas' && monthsBack < 4 ? -1 : 1;  // Bevaas slipping recently
      const ourValue = Math.max(20, baseVolume + trend * (12 - monthsBack) * randint(5, 15) + randint(-30, 30));
      const competitorValue = Math.max(20, ourValue * (0.7 + rand() * 0.6) + randint(-50, 50));

      rcpaRecords.push({
        user_id: mr.user_id,
        pharmacy: pharm.name,
        doctor_name: pick(DOCTORS.filter(d => d.territory === pharm.territory)).name,
        our_brand: product.name,
        our_value: ourValue.toFixed(2),
        competitor_brand: competitor.brand,
        competitor_company: competitor.company,
        competitor_value: competitorValue.toFixed(2),
        days,
      });
    }
  }
}

const rcpaValues = rcpaRecords.map(r =>
  `(${sqlEscape(r.user_id)}, ${sqlEscape(r.pharmacy)}, ${sqlEscape(r.doctor_name)}, ${sqlEscape(r.our_brand)}, ${r.our_value}, ${sqlEscape(r.competitor_brand)}, ${sqlEscape(r.competitor_company)}, ${r.competitor_value}, ${dateOffset(r.days)})`
).join(',\n  ');

out(`INSERT INTO rcpa
  (user_id, pharmacy, doctor_name, our_brand, our_value, competitor_brand, competitor_company, competitor_value, date)
VALUES
  ${rcpaValues};

`);

console.error(`[gen] RCPA: ${rcpaRecords.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 4. secondary_sales — 12 months of monthly per-MR-per-product rows.
// Existing seed_sales_data.sql has 4 months. We TRUNCATE and rebuild with
// 12 months of data.
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── secondary_sales (12 months × 9 products × 3 MRs ≈ 324 rows) ─────────────
TRUNCATE secondary_sales RESTART IDENTITY CASCADE;

`);

// Per-MR performance multiplier — drives the leaderboard story. Priya
// over-performs, Rahul on track, Robert lagging.
const MR_PERF_FACTOR = {
  mr_priya_002:  1.12,
  mr_rahul_001:  0.98,
  mr_robert_003: 0.88,
};
// Per-product factor — Bevaas is the slipping brand (matches the existing
// RCPA story 'Bevaas slipping recently').
const PRODUCT_PERF_FACTOR = {
  Derise: 1.05,
  Rilast: 1.00,
  Bevaas: 0.85,
};
// One specific month gets a visible dip so Revenue Trend isn't monotone.
const SOFT_MONTH = 4;
const SOFT_MONTH_FACTOR = 0.78;

const salesRows = [];
for (let monthsBack = 0; monthsBack < 12; monthsBack++) {
  for (const mr of MRS) {
    const territoryDistributors = DISTRIBUTORS.filter(d => d.territory === mr.territory);
    for (const product of PRODUCTS) {
      // Quantity model: multiplicative MR × product factors push some cells
      // under target and others over; zero-mean drift means months are not
      // monotonically growing; an explicit SOFT_MONTH dip creates a visible
      // negative MoM moment in the Revenue Trend chart.
      const baseQty = product.brand === 'Derise' ? 380 : product.brand === 'Rilast' ? 240 : 200;
      const mrFactor = MR_PERF_FACTOR[mr.user_id] ?? 1.0;
      const productFactor = PRODUCT_PERF_FACTOR[product.brand] ?? 1.0;
      const monthDrift = randint(-15, 25);
      const seasonality = Math.sin((monthsBack * Math.PI) / 6) * 30;
      const noise = randint(-40, 40);
      const monthMultiplier = monthsBack === SOFT_MONTH ? SOFT_MONTH_FACTOR : 1.0;
      const qty = Math.max(
        50,
        Math.round(baseQty * mrFactor * productFactor * monthMultiplier + monthDrift + seasonality + noise)
      );

      const unitPrice = product.brand === 'Derise' ? 14 : product.brand === 'Rilast' ? 18 : 22;
      const value = (qty * unitPrice).toFixed(2);

      // sale_date is the 15th of (current month - monthsBack).
      const saleDate = `(date_trunc('month', CURRENT_DATE - INTERVAL '${monthsBack} months') + INTERVAL '14 days')::date`;

      salesRows.push({
        user_id: mr.user_id,
        territory: mr.territory,
        distributor_id: pick(territoryDistributors).id,
        product_id: product.id,
        sale_date: saleDate,
        quantity: qty,
        value,
        uploaded_by: MANAGER,
      });
    }
  }
}

// secondary_sales batch insert
for (let i = 0; i < salesRows.length; i += 50) {
  const batch = salesRows.slice(i, i + 50);
  const values = batch.map(s =>
    `(${sqlEscape(s.user_id)}, ${sqlEscape(s.territory)}, ${s.distributor_id}, ${s.product_id}, ${s.sale_date}, ${s.quantity}, ${s.value}, ${sqlEscape(s.uploaded_by)})`
  ).join(',\n  ');
  out(`INSERT INTO secondary_sales
  (user_id, territory, distributor_id, product_id, sale_date, quantity, value, uploaded_by)
VALUES
  ${values};
`);
}

console.error(`[gen] secondary_sales: ${salesRows.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 5. mr_targets — quarterly targets per MR per product (4 quarters × 3 MRs × 9 products)
// period format: YYYY-MM (representing the quarter start month).
// Existing seed has 3 months × 3 MRs × 9 products = 81. We extend to 12 months.
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── mr_targets (12 months × 3 MRs × 9 products = 324 rows) ─────────────────
TRUNCATE mr_targets RESTART IDENTITY CASCADE;

`);

const targetRows = [];
for (let monthsBack = 0; monthsBack < 12; monthsBack++) {
  for (const mr of MRS) {
    for (const product of PRODUCTS) {
      const baseTargetQty = product.brand === 'Derise' ? 400 : product.brand === 'Rilast' ? 250 : 220;
      const targetQty = baseTargetQty + randint(-30, 30);
      const unitPrice = product.brand === 'Derise' ? 14 : product.brand === 'Rilast' ? 18 : 22;
      const targetValue = (targetQty * unitPrice).toFixed(2);
      // period as 'YYYY-MM' computed via to_char.
      const period = `to_char(CURRENT_DATE - INTERVAL '${monthsBack} months', 'YYYY-MM')`;
      targetRows.push({
        user_id: mr.user_id,
        product_id: product.id,
        period,
        target_qty: targetQty,
        target_value: targetValue,
        set_by: MANAGER,
      });
    }
  }
}

for (let i = 0; i < targetRows.length; i += 50) {
  const batch = targetRows.slice(i, i + 50);
  const values = batch.map(t =>
    `(${sqlEscape(t.user_id)}, ${t.product_id}, ${t.period}, ${t.target_qty}, ${t.target_value}, ${sqlEscape(t.set_by)})`
  ).join(',\n  ');
  out(`INSERT INTO mr_targets
  (user_id, product_id, period, target_qty, target_value, set_by)
VALUES
  ${values};
`);
}

console.error(`[gen] mr_targets: ${targetRows.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 6. follow_up_tasks — derived from select recent DCRs (the AI extraction
// hook produces these in real time; we synthesize a realistic backlog).
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── follow_up_tasks (~60 with mix of pending/completed/overdue) ────────────
TRUNCATE follow_up_tasks RESTART IDENTITY CASCADE;

`);

const taskRows = [];
const recentDcrs = dcrRecords.filter(r => r.visit_offset.days < 60).slice(0, 80);
const followUpTaskTemplates = [
  'Send Phase III publication PDF',
  'Schedule follow-up visit in 2 weeks',
  'Provide patient assistance programme details',
  'Share latest safety bulletin',
  'Send dose-adjustment chart',
  'Coordinate KOL invitation for advisory board',
  'Drop additional samples next visit',
  'Connect doctor with medical affairs',
  'Send head-to-head meta-analysis',
  'Confirm CME attendance',
  'Follow up on patient case discussed',
  'Share renal dosing tear-sheet',
];

for (const dcr of sample(recentDcrs, 60)) {
  const dueOffset = randint(-15, 21); // some overdue, some upcoming
  const status = dueOffset < -7 ? pickWeighted([['pending', 2], ['completed', 5], ['overdue', 3]])
                : dueOffset < 0  ? pickWeighted([['pending', 4], ['completed', 4]])
                                 : pickWeighted([['pending', 8], ['completed', 1]]);
  taskRows.push({
    dcr_id: dcr.id,
    user_id: dcr.user_id,
    doctor_name: dcr.name,
    task: pick(followUpTaskTemplates),
    due_date_offset: dueOffset,
    status,
    days_back: dcr.visit_offset.days,
  });
}

const taskValues = taskRows.map(t => {
  const dueDate = t.due_date_offset >= 0
    ? `(CURRENT_DATE + INTERVAL '${t.due_date_offset} days')`
    : `(CURRENT_DATE - INTERVAL '${-t.due_date_offset} days')`;
  return `(${t.dcr_id}, ${sqlEscape(t.user_id)}, ${sqlEscape(t.doctor_name)}, ${sqlEscape(t.task)}, ${dueDate}, ${sqlEscape(t.status)}, ${tsOffset(t.days_back)})`;
}).join(',\n  ');

out(`INSERT INTO follow_up_tasks
  (dcr_id, user_id, doctor_name, task, due_date, status, created_at)
VALUES
  ${taskValues};

`);

console.error(`[gen] follow_up_tasks: ${taskRows.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 7. content_views — e-detailing session telemetry on published content.
// Only references content_versions that are published or approved (ids 1, 3
// per the verification we ran).
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── content_views (~50 detailing sessions over 60 days) ────────────────────
TRUNCATE content_views RESTART IDENTITY CASCADE;

`);

const viewRows = [];
const PUBLISHED_VERSION_IDS = [1, 3]; // see schema verification
for (let i = 0; i < 50; i++) {
  const dcr = pick(dcrRecords.filter(d => d.visit_offset.days < 60));
  const versionId = pick(PUBLISHED_VERSION_IDS);
  const slideIndex = randint(0, 11);
  const duration = (5 + rand() * 30).toFixed(2); // 5-35 seconds per slide
  viewRows.push({
    version_id: versionId,
    user_id: dcr.user_id,
    doctor_id: dcr.doctor_id,
    dcr_id: dcr.id,
    slide_index: slideIndex,
    duration_seconds: duration,
    days_back: dcr.visit_offset.days,
    hours_back: randint(1, 8),
  });
}

const viewValues = viewRows.map(v =>
  `(${v.version_id}, ${sqlEscape(v.user_id)}, ${v.doctor_id}, ${v.dcr_id}, ${v.slide_index}, ${v.duration_seconds}, ${tsOffset(v.days_back, v.hours_back)})`
).join(',\n  ');

out(`INSERT INTO content_views
  (version_id, user_id, doctor_id, dcr_id, slide_index, duration_seconds, viewed_at)
VALUES
  ${viewValues};

`);

console.error(`[gen] content_views: ${viewRows.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 8. nba_recommendations — daily-cached, one row per MR for today.
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── nba_recommendations (today's cached recommendations per MR) ────────────
TRUNCATE nba_recommendations RESTART IDENTITY CASCADE;

`);

for (const mr of MRS) {
  const territoryDocs = DOCTORS.filter(d => d.territory === mr.territory);
  const recs = territoryDocs.map(doc => ({
    doctor_id: doc.id,
    doctor_name: doc.name,
    tier: doc.tier,
    priority: doc.tier === 'A' ? 'high' : doc.tier === 'B' ? 'medium' : 'low',
    score: doc.tier === 'A' ? randint(80, 95) : doc.tier === 'B' ? randint(60, 79) : randint(40, 59),
    reason: pick([
      `Tier-${doc.tier} doctor, last visited ${randint(8, 22)} days ago`,
      `RCPA volume slipping vs competitor — recommend focused detailing`,
      `Open follow-up: send Phase III trial summary`,
      `Tour plan scheduled for tomorrow — pre-call briefing recommended`,
      `Recent positive sentiment — momentum opportunity`,
    ]),
    recommended_product: pick(PRODUCTS).name,
  })).slice(0, 6);

  out(`INSERT INTO nba_recommendations (user_id, date, recommendations, generated_at)
VALUES (${sqlEscape(mr.user_id)}, CURRENT_DATE, ${sqlJson(recs)}::jsonb, NOW());
`);
}

console.error(`[gen] nba_recommendations: 3`);

// ──────────────────────────────────────────────────────────────────────────
// 9. compliance_findings — APPEND ~20 historical findings to the base 12.
// We use INSERT (no TRUNCATE) so the base seeded findings are preserved.
// ──────────────────────────────────────────────────────────────────────────

out(`
-- ── compliance_findings (extends base 12 with ~20 historical) ─────────────
-- NOTE: NOT truncating — extends seed_compliance_findings.sql.

`);

const findingTypes = ['off_label_promotion', 'missing_fair_balance', 'gift_value_threshold',
                      'unconsented_contact', 'unsubstantiated_claim', 'duplicate_ae_report', 'other'];
const severities = ['low', 'medium', 'high', 'critical'];
const statuses = ['open', 'acknowledged', 'dismissed', 'escalated', 'resolved'];

// Historical findings derived from non-recent DCRs flagged by scenario tag.
const flaggableDcrs = dcrRecords.filter(r =>
  ['compliance_off_label', 'compliance_fair_balance', 'compliance_gift_threshold'].includes(r.scenario_tag)
);

const historicalFindings = [];
for (const dcr of sample(flaggableDcrs, 20)) {
  let findingType, evidence, recommendation;
  switch (dcr.scenario_tag) {
    case 'compliance_off_label':
      findingType = 'off_label_promotion';
      evidence = dcr.call_summary.substring(0, 180);
      recommendation = 'Coach the rep on labelled indications. Review training material on off-label discussions.';
      break;
    case 'compliance_fair_balance':
      findingType = 'missing_fair_balance';
      evidence = dcr.call_summary.substring(0, 180);
      recommendation = 'Mandatory fair-balance refresher. Pair every efficacy claim with paired safety information.';
      break;
    case 'compliance_gift_threshold':
      findingType = 'gift_value_threshold';
      evidence = dcr.call_summary.substring(0, 180);
      recommendation = 'Confirm whether tied to advisory board or honorarium. Review against MCI threshold.';
      break;
  }
  const severity = pickWeighted([['low', 1], ['medium', 4], ['high', 4], ['critical', 1]]);
  // Older findings are mostly resolved; recent ones are mostly open.
  const status = dcr.visit_offset.days > 60
    ? pickWeighted([['resolved', 5], ['dismissed', 2], ['acknowledged', 2], ['escalated', 1]])
    : pickWeighted([['open', 5], ['acknowledged', 3], ['escalated', 1]]);
  const reviewerActed = !['open'].includes(status);
  historicalFindings.push({
    finding_type: findingType,
    severity,
    source_table: 'dcr',
    source_row_id: String(dcr.id),
    user_id: dcr.user_id,
    description: `Auto-detected ${findingType.replace(/_/g, ' ')} in DCR call summary.`,
    evidence_quote: evidence,
    recommendation,
    status,
    reviewed_by: reviewerActed ? MANAGER : null,
    reviewed_at_days: reviewerActed ? Math.max(1, dcr.visit_offset.days - randint(1, 5)) : null,
    review_notes: reviewerActed ? pick([
      'Reviewed and coached. Closed.',
      'Standard de minimis under MCI guidelines.',
      'Forwarded to legal review.',
      'Confirmed unsolicited Q&A — no action.',
      'Pharmacovigilance briefed.',
    ]) : null,
    detected_by: 'ai',
    days_back: dcr.visit_offset.days,
  });
}

const findingValues = historicalFindings.map(f => {
  const reviewedAt = f.reviewed_at_days ? tsOffset(f.reviewed_at_days) : 'NULL';
  return `(${sqlEscape(f.finding_type)}, ${sqlEscape(f.severity)}, ${sqlEscape(f.source_table)}, ${sqlEscape(f.source_row_id)}, ${sqlEscape(f.user_id)}, ${sqlEscape(f.description)}, ${sqlEscape(f.evidence_quote)}, ${sqlEscape(f.recommendation)}, ${sqlEscape(f.status)}, ${f.reviewed_by ? sqlEscape(f.reviewed_by) : 'NULL'}, ${reviewedAt}, ${f.review_notes ? sqlEscape(f.review_notes) : 'NULL'}, ${sqlEscape(f.detected_by)}, ${tsOffset(f.days_back)})`;
}).join(',\n  ');

if (findingValues) {
  out(`INSERT INTO compliance_findings
  (finding_type, severity, source_table, source_row_id, user_id, description,
   evidence_quote, recommendation, status, reviewed_by, reviewed_at, review_notes,
   detected_by, created_at)
VALUES
  ${findingValues};

`);
  console.error(`[gen] compliance_findings (extension): ${historicalFindings.length}`);
}

// ──────────────────────────────────────────────────────────────────────────
// 10. medical_queries — APPEND ~30 historical queries
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── medical_queries (extends base 12 with ~30 historical) ──────────────────
-- NOTE: NOT truncating — extends seed_medical_queries.sql.

`);

const queryCategories = ['efficacy', 'safety', 'dosing', 'interaction', 'off_label', 'clinical_data', 'administration'];
const captureViaOptions = ['mr_visit', 'phone', 'email', 'portal', 'event'];
const sendMethods = ['email', 'mr_callback', 'letter'];

const medicalQueryTemplates = [
  { cat: 'dosing',         q: 'Recommended {product} dosing for elderly patients?' },
  { cat: 'dosing',         q: 'How should I adjust {product} in moderate hepatic impairment?' },
  { cat: 'safety',         q: 'Long-term safety profile of {product} beyond 24 months?' },
  { cat: 'safety',         q: 'Reported drug interactions between {product} and warfarin?' },
  { cat: 'efficacy',       q: 'Comparative efficacy of {product} vs current standard of care?' },
  { cat: 'efficacy',       q: 'Subgroup analysis data for {product} in diabetic patients?' },
  { cat: 'interaction',    q: 'CYP3A4 interaction risk for {product} in polypharmacy?' },
  { cat: 'interaction',    q: 'Can {product} be co-prescribed with statins safely?' },
  { cat: 'off_label',      q: 'Off-label experience with {product} in adolescent population?' },
  { cat: 'off_label',      q: 'Any data on {product} for migraine prophylaxis?' },
  { cat: 'clinical_data',  q: 'Phase IV post-marketing data summary for {product}?' },
  { cat: 'clinical_data',  q: 'Real-world evidence for {product} in Indian patients?' },
  { cat: 'administration', q: 'Can {product} be crushed for NG tube administration?' },
  { cat: 'administration', q: 'Storage requirements for {product} in tropical climates?' },
];

const historicalQueries = [];
for (let i = 0; i < 30; i++) {
  const tmpl = pick(medicalQueryTemplates);
  const product = pick(PRODUCTS);
  const doctor = pick(DOCTORS);
  const mr = MR_BY_TERRITORY[doctor.territory];
  const days = randint(15, 360);  // mostly older — to demonstrate history depth
  const urgency = pickWeighted([['low', 2], ['standard', 6], ['high', 2], ['critical', 1]]);
  const status = days > 30 ? pickWeighted([['sent', 6], ['closed_no_action', 1], ['answered', 1]])
                           : pickWeighted([['sent', 2], ['answered', 1], ['in_review', 2], ['open', 1]]);

  const hasAiDraft = status !== 'open' || rand() < 0.7;
  const hasFinalAnswer = ['answered', 'sent'].includes(status);
  const isSent = status === 'sent';

  const aiDraft = hasAiDraft
    ? `Based on the available evidence in our knowledge base [1], ${tmpl.q.replace('{product}', product.name).toLowerCase().replace(/\?$/, '')} — the recommended approach is documented in the prescribing information [2]. ${pick(['No additional safety signals beyond the label.', 'Caution advised in renal impairment.', 'Standard monitoring is sufficient.', 'Refer to medical affairs for case-specific guidance.'])}`
    : null;
  const aiCitations = hasAiDraft ? [
    { marker: 1, source_doc_id: pick([1, 2, 3, 4, 5, 7]), snippet: `Source snippet for ${product.name} (placeholder).` },
    { marker: 2, source_doc_id: pick([1, 2, 3, 4, 5, 7]), snippet: `Secondary source snippet.` },
  ] : null;

  const finalAnswer = hasFinalAnswer
    ? `Thank you for the question. ${aiDraft || ''} For your specific case, recommend ${pick([
        'baseline labs and follow-up at 4 weeks',
        'standard prescribing per the v2 India label',
        'consultation with medical affairs for individualised guidance',
        'reviewing the latest safety bulletin distributed Q1 2026',
      ])} [1]. Happy to share the full publication on request.`
    : null;

  historicalQueries.push({
    doctor_id: doctor.id,
    doctor_name: doctor.name,
    captured_by: mr.user_id,
    captured_via: pick(captureViaOptions),
    product: product.brand,
    question: tmpl.q.replace('{product}', product.name),
    category: tmpl.cat,
    urgency,
    ai_draft: aiDraft,
    ai_citations: aiCitations,
    status,
    has_final: hasFinalAnswer,
    final_answer: finalAnswer,
    final_citations: hasFinalAnswer ? aiCitations : null,
    reviewer: hasFinalAnswer || status === 'in_review' ? 'rev_med_001' : null,
    is_sent: isSent,
    send_method: isSent ? pick(sendMethods) : null,
    days_back: days,
  });
}

const queryValues = historicalQueries.map(q => {
  const aiDraftedAt = q.ai_draft ? `(${tsOffset(q.days_back)} + INTERVAL '5 seconds')` : 'NULL';
  const reviewedAt = q.has_final ? tsOffset(Math.max(1, q.days_back - randint(1, 3))) : 'NULL';
  const sentAt = q.is_sent ? tsOffset(Math.max(1, q.days_back - randint(1, 5))) : 'NULL';
  return `(${q.doctor_id}, ${sqlEscape(q.doctor_name)}, ${sqlEscape(q.captured_by)}, ${sqlEscape(q.captured_via)}, ${sqlEscape(q.product)}, ${sqlEscape(q.question)}, ${sqlEscape(q.category)}, ${sqlEscape(q.urgency)}, ${q.ai_draft ? sqlEscape(q.ai_draft) : 'NULL'}, ${q.ai_citations ? sqlJson(q.ai_citations) + '::jsonb' : 'NULL'}, ${aiDraftedAt}, ${sqlEscape(q.status)}, ${q.reviewer ? sqlEscape(q.reviewer) : 'NULL'}, ${q.final_answer ? sqlEscape(q.final_answer) : 'NULL'}, ${q.final_citations ? sqlJson(q.final_citations) + '::jsonb' : 'NULL'}, ${reviewedAt}, ${sentAt}, ${q.send_method ? sqlEscape(q.send_method) : 'NULL'}, ${tsOffset(q.days_back)})`;
}).join(',\n  ');

out(`INSERT INTO medical_queries
  (doctor_id, doctor_name, captured_by, captured_via, product, question,
   category, urgency, ai_draft_answer, ai_draft_citations, ai_drafted_at,
   status, reviewer_user_id, final_answer, final_citations,
   reviewed_at, sent_at, send_method, created_at)
VALUES
  ${queryValues};

`);

console.error(`[gen] medical_queries (extension): ${historicalQueries.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 11. medical_engagements + engagement_attendees — APPEND ~10 historical
// ──────────────────────────────────────────────────────────────────────────

out(`-- ── medical_engagements (extends base 6 with ~10 historical/future) ────────
-- NOTE: NOT truncating — extends seed_medical_engagements.sql.

`);

const engagementTemplates = [
  { type: 'advisory_board',       title: '{brand} Cardiology Advisory Board', topic: 'Therapeutic positioning', loc: 'Mumbai' },
  { type: 'speaker_program',      title: '{brand} Speaker Programme — {city}', topic: 'Clinical case studies', loc: 'Multi-city' },
  { type: 'symposium',            title: '{brand} National Symposium {year}', topic: 'Latest evidence and guidelines', loc: 'Mumbai' },
  { type: 'consultation',         title: '{brand} KOL Strategy Consultation', topic: 'Brand strategy input', loc: 'Online' },
  { type: 'investigator_meeting', title: '{brand} Investigator-Initiated Trial Meeting', topic: 'Protocol review', loc: 'Bangalore' },
  { type: 'roundtable',           title: '{brand} Renal Dosing Roundtable', topic: 'Dose adjustment guidance', loc: 'Mumbai' },
];

const cities = ['Pune', 'Bangalore', 'Hyderabad', 'Chennai', 'Kolkata'];
const venues = ['JW Marriott', 'Taj Lands End', 'The Oberoi', 'ITC Maratha', 'Hyatt Regency'];

const newEngagements = [];
for (let i = 0; i < 10; i++) {
  const tmpl = pick(engagementTemplates);
  const product = pick(PRODUCTS);
  const isFuture = rand() < 0.3;
  const days = isFuture ? -randint(15, 90) : randint(30, 330);
  const status = isFuture ? pickWeighted([['planned', 5], ['confirmed', 3]])
                          : pickWeighted([['completed', 8], ['cancelled', 2]]);
  const title = tmpl.title.replace('{brand}', product.brand).replace('{city}', pick(cities)).replace('{year}', '2026');

  newEngagements.push({
    title,
    type: tmpl.type,
    product: product.brand,
    topic: tmpl.topic,
    agenda: `Standard ${tmpl.type.replace(/_/g, ' ')} agenda. Pre-reads circulated in advance.`,
    location: `${pick(venues)}, ${tmpl.loc === 'Multi-city' ? pick(cities) : tmpl.loc}`,
    scheduled_days: days,
    duration_minutes: pick([60, 90, 120, 180, 240]),
    sponsor_user_id: pick([MANAGER, ADMIN]),
    status,
    outcomes: status === 'completed' ? pick([
      'Strong consensus on therapeutic positioning. Action items captured.',
      'KOLs raised useful questions on safety profile; medical affairs to follow up.',
      'Speaker feedback was excellent. Recommend annual repeat.',
      'Mixed engagement. Consider format change next time.',
      'Productive — generated 3 IIT proposal leads.',
    ]) : status === 'cancelled' ? pick([
      'Cancelled due to KOL availability conflict.',
      'Postponed to next quarter pending budget review.',
      'Cancelled — will reschedule once safety bulletin is published.',
    ]) : null,
  });
}

const newEngagementValuesArr = newEngagements.map(e => {
  const scheduled = e.scheduled_days < 0
    ? `(NOW() + INTERVAL '${-e.scheduled_days} days')`
    : `(NOW() - INTERVAL '${e.scheduled_days} days')`;
  return `(${sqlEscape(e.title)}, ${sqlEscape(e.type)}, ${sqlEscape(e.product)}, ${sqlEscape(e.topic)}, ${sqlEscape(e.agenda)}, ${sqlEscape(e.location)}, ${scheduled}, ${e.duration_minutes}, ${sqlEscape(e.sponsor_user_id)}, ${sqlEscape(e.status)}, ${e.outcomes ? sqlEscape(e.outcomes) : 'NULL'})`;
}).join(',\n  ');

out(`INSERT INTO medical_engagements
  (title, engagement_type, product, topic, agenda, location, scheduled_at,
   duration_minutes, sponsor_user_id, status, outcomes_summary)
VALUES
  ${newEngagementValuesArr};
`);

// We don't have the new ids without a SELECT after INSERT, so attendees are
// inserted via a CTE that joins on the engagement title (titles are unique
// for the synthetic engagements). The SELECT projects only the 7 columns the
// INSERT expects — explicit projection avoids "more expressions than target
// columns" errors.
out(`
-- ── engagement_attendees for the new engagements (join by title) ───────────
WITH new_eng AS (
  SELECT id, title FROM medical_engagements
  WHERE title IN (${newEngagements.map(e => sqlEscape(e.title)).join(', ')})
)
INSERT INTO engagement_attendees
  (engagement_id, doctor_id, attendee_role, attended, honorarium_amt, honorarium_ccy, feedback)
SELECT new_eng.id, v.doctor_id, v.attendee_role, v.attended, v.honorarium_amt, v.honorarium_ccy, v.feedback
FROM (VALUES
`);

const attendeeRows = [];
for (const e of newEngagements) {
  // Pick 2-4 doctors for the engagement, biased toward specialty match.
  const matchingDocs = DOCTORS.filter(d => {
    if (e.type === 'investigator_meeting') return ['Cardiology', 'Endocrinology'].includes(d.specialty);
    if (e.product === 'Bevaas') return ['Neurology', 'Nephrology', 'Cardiology'].includes(d.specialty);
    if (e.product === 'Derise') return ['Cardiology', 'Nephrology'].includes(d.specialty);
    return true;
  });
  const attendees = sample(matchingDocs.length > 0 ? matchingDocs : DOCTORS, randint(2, 4));
  for (let idx = 0; idx < attendees.length; idx++) {
    const doc = attendees[idx];
    const role = idx === 0 ? pick(['chair', 'speaker', 'organiser']) : pick(['attendee', 'panelist', 'speaker']);
    const isPast = e.scheduled_days > 0 && e.status === 'completed';
    const attended = isPast ? rand() > 0.1 : null;
    const honorarium = role === 'speaker' ? randint(60, 100) * 1000
                     : role === 'chair'   ? randint(50, 80) * 1000
                     : role === 'panelist' ? randint(30, 50) * 1000
                     :                       randint(10, 25) * 1000;
    attendeeRows.push({
      title: e.title,
      doctor_id: doc.id,
      role,
      attended,
      honorarium_amt: e.status === 'cancelled' ? null : honorarium,
      feedback: isPast && attended && role !== 'attendee' ? pick([
        'Engaged audience. Strong delivery.',
        'Questions were thoughtful — recommend repeat invitation.',
        'KOL committed to follow-up case study.',
        'Useful real-world perspective shared.',
      ]) : null,
    });
  }
}

const attendeeValueLines = attendeeRows.map(a =>
  `(${sqlEscape(a.title)}, ${a.doctor_id}, ${sqlEscape(a.role)}, ${sqlBool(a.attended)}, ${a.honorarium_amt === null ? 'NULL' : a.honorarium_amt + '.00'}, 'INR', ${a.feedback ? sqlEscape(a.feedback) : 'NULL'})`
).join(',\n  ');

out(`  ${attendeeValueLines}
) AS v(title, doctor_id, attendee_role, attended, honorarium_amt, honorarium_ccy, feedback)
JOIN new_eng ON new_eng.title = v.title
ON CONFLICT (engagement_id, doctor_id) DO NOTHING;
`);

console.error(`[gen] medical_engagements (extension): ${newEngagements.length}, attendees: ${attendeeRows.length}`);

// ──────────────────────────────────────────────────────────────────────────
// 12. audit_log — extend to ~200 entries over 90 days
// ──────────────────────────────────────────────────────────────────────────

out(`
-- ── audit_log (extends base ~29 with ~170 historical entries) ──────────────
-- NOT truncating — extends seed_audit_log.sql.

`);

const auditExtensions = [];

// 1) DCR creates — one audit row per generated DCR within last 90 days.
for (const dcr of dcrRecords.filter(r => r.visit_offset.days < 90)) {
  const mr = MRS.find(m => m.user_id === dcr.user_id);
  auditExtensions.push({
    actor: dcr.user_id,
    actor_role: 'mr',
    table: 'dcr',
    row_id: String(dcr.id),
    action: 'CREATE',
    before: null,
    after: { id: String(dcr.id), user_id: dcr.user_id, name: dcr.name, product: dcr.product_name },
    route: '/api/dcr',
    method: 'POST',
    ip: mr ? mr.ip : '203.0.113.0',
    reason: null,
    days: dcr.visit_offset.days,
    hours: dcr.visit_offset.hours,
    minutes: dcr.visit_offset.minutes,
  });
}

// Cap the DCR-create audits at 100 to keep the file reasonable.
auditExtensions.splice(100);

// 2) Manager actions distributed across the 90 days.
for (let i = 0; i < 30; i++) {
  const days = randint(1, 90);
  const action = pick([
    { table: 'compliance_findings', row: String(randint(1, 12)),
      action: 'UPDATE', before: { status: 'open' }, after: { status: pick(['acknowledged', 'resolved', 'escalated']) },
      route: '/api/compliance/findings/X', method: 'PATCH', reason: 'Compliance officer triage' },
    { table: 'tour_plans', row: String(randint(1, 5)),
      action: 'UPDATE', before: { status: 'submitted' }, after: { status: pick(['approved', 'rejected']) },
      route: '/api/tour-plans/X/review', method: 'PATCH', reason: 'Manager review' },
    { table: 'expense_claims', row: String(randint(1, 3)),
      action: 'UPDATE', before: { status: 'submitted' }, after: { status: 'approved' },
      route: '/api/expenses/X/review', method: 'PATCH', reason: 'Approved' },
    { table: 'consent_records', row: String(randint(1, 26)),
      action: 'CREATE', before: null, after: { channel: pick(['marketing_email', 'marketing_visit']), status: pick(['granted', 'revoked']) },
      route: '/api/consent', method: 'POST', reason: 'Consent event recorded' },
    { table: 'medical_queries', row: String(randint(1, 12)),
      action: 'UPDATE', before: { status: 'open' }, after: { status: 'in_review', reviewer_user_id: 'rev_med_001' },
      route: '/api/medical-queries/X', method: 'PATCH', reason: 'Reviewer claimed query' },
  ]);
  auditExtensions.push({
    actor: MANAGER,
    actor_role: 'manager',
    table: action.table,
    row_id: action.row,
    action: action.action,
    before: action.before,
    after: action.after,
    route: action.route,
    method: action.method,
    ip: '203.0.113.5',
    reason: action.reason,
    days,
    hours: randint(0, 23),
    minutes: randint(0, 59),
  });
}

// 3) Reviewer (MLR + medical) actions
for (let i = 0; i < 25; i++) {
  const days = randint(1, 90);
  const reviewer = pick(REVIEWERS);
  const role = reviewer === 'rev_med_001' ? 'medical_reviewer'
             : reviewer === 'rev_legal_001' ? 'legal_reviewer'
             : 'regulatory_reviewer';
  const action = pick([
    {
      table: 'mlr_reviews', row: String(randint(1, 12)),
      action: 'UPDATE',
      before: { decision: 'pending' },
      after:  { decision: pick(['approved', 'changes_requested', 'rejected']) },
      route: '/api/mlr/reviews/X', method: 'PATCH',
      reason: `${role.replace(/_/g, ' ')} decision`,
    },
    {
      table: 'medical_queries', row: String(randint(1, 12)),
      action: 'UPDATE',
      before: { status: 'in_review' },
      after:  { status: 'answered' },
      route: '/api/medical-queries/X', method: 'PATCH',
      reason: 'Answer submitted',
    },
  ]);
  auditExtensions.push({
    actor: reviewer,
    actor_role: role,
    table: action.table,
    row_id: action.row,
    action: action.action,
    before: action.before,
    after: action.after,
    route: action.route,
    method: action.method,
    ip: '203.0.113.21',
    reason: action.reason,
    days,
    hours: randint(0, 23),
    minutes: randint(0, 59),
  });
}

// 4) Admin actions (regulatory docs, KOL classifications, content publishing).
for (let i = 0; i < 15; i++) {
  const days = randint(1, 90);
  const action = pick([
    { table: 'kol_profiles', row: String(randint(1, 8)),
      action: 'CREATE', before: null,
      after: { kol_tier: pick(['T1', 'T2', 'T3']), influence_score: randint(45, 92) },
      route: '/api/kols/identify/X', method: 'PATCH',
      reason: 'AI suggestion confirmed' },
    { table: 'content_versions', row: String(randint(1, 6)),
      action: 'UPDATE', before: { status: 'approved' }, after: { status: 'published' },
      route: '/api/content/X/versions/Y/publish', method: 'POST',
      reason: 'Published approved version' },
    { table: 'regulatory_documents', row: String(randint(1, 6)),
      action: 'UPDATE', before: { current_version_id: 1 }, after: { current_version_id: 2 },
      route: '/api/regulatory-documents/X/versions', method: 'POST',
      reason: 'Uploaded new version' },
  ]);
  auditExtensions.push({
    actor: ADMIN,
    actor_role: 'admin',
    table: action.table,
    row_id: action.row,
    action: action.action,
    before: action.before,
    after: action.after,
    route: action.route,
    method: action.method,
    ip: '203.0.113.2',
    reason: action.reason,
    days,
    hours: randint(0, 23),
    minutes: randint(0, 59),
  });
}

// Emit
const auditValuesLines = auditExtensions.map(a =>
  `(${sqlEscape(a.actor)}, ${sqlEscape(a.actor_role)}, ${sqlEscape(a.table)}, ${sqlEscape(a.row_id)}, ${sqlEscape(a.action)}, ${a.before ? sqlJson(a.before) + '::jsonb' : 'NULL'}, ${a.after ? sqlJson(a.after) + '::jsonb' : 'NULL'}, ${sqlEscape(a.route)}, ${sqlEscape(a.method)}, ${sqlEscape(a.ip)}, ${a.reason ? sqlEscape(a.reason) : 'NULL'}, ${tsOffset(a.days, a.hours, a.minutes)})`
).join(',\n  ');

// Write in batches of 50 to stay under the statement size budget.
for (let i = 0; i < auditExtensions.length; i += 50) {
  const batch = auditExtensions.slice(i, i + 50);
  const lines = batch.map(a =>
    `(${sqlEscape(a.actor)}, ${sqlEscape(a.actor_role)}, ${sqlEscape(a.table)}, ${sqlEscape(a.row_id)}, ${sqlEscape(a.action)}, ${a.before ? sqlJson(a.before) + '::jsonb' : 'NULL'}, ${a.after ? sqlJson(a.after) + '::jsonb' : 'NULL'}, ${sqlEscape(a.route)}, ${sqlEscape(a.method)}, ${sqlEscape(a.ip)}, ${a.reason ? sqlEscape(a.reason) : 'NULL'}, ${tsOffset(a.days, a.hours, a.minutes)})`
  ).join(',\n  ');
  out(`INSERT INTO audit_log
  (actor_user_id, actor_role, table_name, row_id, action, before_data, after_data,
   route_path, http_method, ip_address, reason, occurred_at)
VALUES
  ${lines};
`);
}

console.error(`[gen] audit_log (extension): ${auditExtensions.length}`);

// ──────────────────────────────────────────────────────────────────────────
// Done — flush.
// ──────────────────────────────────────────────────────────────────────────

const outputPath = path.resolve(__dirname, '..', 'db', 'seed_synthetic_activity.sql');
fs.writeFileSync(outputPath, chunks.join('\n'), 'utf8');

console.error('');
console.error(`[gen] Done. Output: ${outputPath}`);
console.error(`[gen] Lines: ${chunks.join('\n').split('\n').length}`);
