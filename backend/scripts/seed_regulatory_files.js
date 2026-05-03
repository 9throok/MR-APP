#!/usr/bin/env node
/**
 * Seed regulatory document placeholder files.
 *
 * Postgres can't write files, so this helper drops 7 small placeholder text
 * files into backend/uploads/regulatory/<doc_id>/ that match the rows
 * inserted by seed_regulatory_docs.sql. The "Open" link in
 * RegulatoryDocs.tsx will open these files via Express's static handler.
 *
 * Idempotent — safe to re-run.
 *
 * Run from the repo root:  node backend/scripts/seed_regulatory_files.js
 */

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', 'uploads', 'regulatory');

const files = [
  // doc_id 1, version 1 — superseded
  { docId: 1, name: '1700000000000-derise-india-label-v1.pdf',
    body: `DERISE (Drug X) — INDIA PRESCRIBING INFORMATION v1 [SUPERSEDED]

Approved indications:
  - Hypertension (mild to moderate)
  - Heart failure (NYHA Class II-III)

Dosing:
  - Adults: 10mg once daily
  - Renal impairment: not yet characterised

WARNING: This is the v1 label. Superseded by v2. See latest version.

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
  // doc_id 1, version 2 — active current label
  { docId: 1, name: '1750000000000-derise-india-label-v2.pdf',
    body: `DERISE (Drug X) — INDIA PRESCRIBING INFORMATION v2

Approved indications:
  - Hypertension (mild to moderate)
  - Heart failure (NYHA Class II-III)
  - Post-myocardial infarction LV dysfunction (added in v2)

Dosing:
  - Adults: 10mg once daily, titrated up to 50mg
  - Renal impairment (CrCl 30-60 mL/min): reduce dose by 50%
  - Renal impairment (CrCl < 30): not recommended
  - Hepatic impairment: use with caution

Contraindications:
  - Hypersensitivity to Derise or any component
  - Pregnancy (Category D)

Adverse reactions (>1%):
  - Hypotension, dizziness, hyperkalaemia, dry cough

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
  // doc_id 2, version 1 — Bevaas IFU
  { docId: 2, name: '1720000000000-bevaas-ifu.pdf',
    body: `BEVAAS — INSTRUCTIONS FOR USE (IFU) v1

Indication:
  Adjunctive treatment of partial-onset seizures in adults.

Administration:
  - Oral, twice daily with food.
  - Start at 5 mg BID, titrate to 10 mg BID over 2 weeks.

Storage:
  - 25°C; protect from moisture.

Special populations:
  - Renal impairment: see prescribing information.
  - Hepatic impairment: not studied; use with caution.

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
  // doc_id 3 — MoH approval letter
  { docId: 3, name: '1700000000111-moh-approval-derise-2024.pdf',
    body: `MINISTRY OF HEALTH AND FAMILY WELFARE
GOVERNMENT OF INDIA — APPROVAL LETTER

Re: Derise (Drug X) 10mg / 20mg / 50mg tablets

This is to certify that the above-named pharmaceutical product has been
granted marketing authorisation in India under licence number IN-DRG-2024-0184.

Approval is valid for one year from the date of issue and is subject to
periodic safety reporting per CDSCO guidelines.

(Demo placeholder for ZenApp regulatory document seed — expires soon, drives
the "expiring within 60 days" banner on the Regulatory Docs page.)\n`,
  },
  // doc_id 4 — Bevaas safety communication
  { docId: 4, name: '1735000000000-safety-comm-bevaas-2026q1.pdf',
    body: `SAFETY COMMUNICATION — BEVAAS (Q1 2026)

Subject: Updated hepatotoxicity signal under post-marketing surveillance.

Summary:
  Recent post-marketing data from India and Southeast Asia indicates a
  small but statistically significant increase in transaminase elevations
  in patients on Bevaas 10mg BID for >12 months.

Recommended actions:
  1. Baseline LFTs before initiation.
  2. Repeat LFTs at 3 and 6 months.
  3. Discontinue if AST/ALT > 3x ULN.
  4. Update patient counselling materials.

This communication supersedes any prior safety bulletin on this topic.

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
  // doc_id 5 — internal SOP
  { docId: 5, name: '1715000000000-sop-detailing-aid-versioning.txt',
    body: `STANDARD OPERATING PROCEDURE — DETAILING AID VERSIONING

Owner: Marketing Operations
Effective: 2026-01-01

Purpose:
  Define the version-control workflow for marketing detailing aids
  (slide decks, brochures, PDFs) used by field representatives.

Procedure:
  1. New asset created in Content Library at status='draft'.
  2. Marketing owner submits for MLR review.
  3. Medical, Legal, Regulatory reviewers each render a decision.
  4. All three must approve before status flips to 'approved'.
  5. Admin publishes — current_version_id on parent asset is updated.
  6. Previous published version auto-retired.

Revision history:
  v1.0 — 2026-01-01 — Initial version

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
  // doc_id 6 — fair-balance training
  { docId: 6, name: '1718000000000-training-fair-balance-2026.pdf',
    body: `FIELD REP TRAINING — FAIR BALANCE COMPLIANCE (2026 EDITION)

Module: How to discuss efficacy without violating fair-balance rules.

Key points:
  1. Every efficacy claim MUST be paired with relevant safety information.
  2. Comparative claims require head-to-head evidence — no implied
     superiority without published comparator data.
  3. Off-label discussion is prohibited unless responding to an unsolicited
     specific question (and even then, route to medical affairs).
  4. Document fair-balance language in DCR call summaries.

Quiz questions and answer key are included in the appendix.

(Demo placeholder for ZenApp regulatory document seed.)\n`,
  },
];

let written = 0;
for (const { docId, name, body } of files) {
  const dir = path.join(root, String(docId));
  fs.mkdirSync(dir, { recursive: true });
  const filePath = path.join(dir, name);
  fs.writeFileSync(filePath, body, 'utf8');
  written++;
  console.log(`  wrote ${path.relative(path.resolve(__dirname, '..', '..'), filePath)} (${body.length} bytes)`);
}

console.log(`\n[seed_regulatory_files] ${written} files written to ${root}`);
