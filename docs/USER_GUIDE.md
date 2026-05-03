# ZenApp — User Guide

Welcome. This document walks through every screen in ZenApp from the perspective of the people who use it: **Medical Representatives (MRs)** in the field, **Managers** running a team, **MLR Reviewers** clearing marketing content, **Medical Affairs Reviewers** answering doctor questions, and **Admins** keeping the lights on.

For each feature you'll find:

- **What it does** — the job it gets done.
- **What it captures** — the data the user enters or the system records.
- **What you see** — the data shown back to the user.
- **AI assist** — when AI is involved, what data it uses, and what it produces.

If you're after a tech inventory of pages and endpoints, see [FEATURES.md](../FEATURES.md). If you want the sales narrative, see [AI_FEATURES_REPORT.md](../AI_FEATURES_REPORT.md). This document is the one to read first when you're trying to learn the tool.

---

## 1. Roles and what they see

ZenApp shows different sidebars to different roles. Pick yours below to know which sections of this guide apply to you.

| Role | What it covers | Sees |
|---|---|---|
| **MR** (Medical Representative) | Field rep visiting doctors, pharmacies, distributors | Field Work, My Customers, Smart Actions, Sample Inventory, Tour Plans, Order Booking, Expense Claim, Leaves |
| **Manager** | Regional sales manager overseeing a team of MRs | Everything an MR sees + Team Management, Sales Dashboards, Compliance, HCP Master Data, Medical Affairs, Tour Plan Requests |
| **Admin** | System owner | Everything a manager sees + Audit Log, Knowledge Base upload, Content Library administration |
| **Medical Reviewer** | Clinician (pharmacist or physician) on the medical-affairs team | Medical Queries inbox + MLR Review Queue (medical role) |
| **Legal Reviewer** | Legal/regulatory counsel reviewing marketing content | MLR Review Queue (legal role) |
| **Regulatory Reviewer** | Regulatory-affairs reviewer | MLR Review Queue (regulatory role) |

Login is at `http://localhost:5173/login.html`. Demo credentials live in `backend/SETUP.md`.

---

## 2. The MR's day — Field Work

These are the screens an MR uses every day. They're the operational core of ZenApp.

### 2.1 Daily Call Report (DCR)

**What it does.** Captures everything that happened on a doctor visit. The single most important record in ZenApp — almost every other feature pulls from DCRs.

**What it captures.**

- Doctor / pharmacy / distributor name
- Date and visit time
- Product discussed
- Free-text **call summary** ("what we talked about")
- Free-text **doctor feedback** ("what they said back")
- Samples distributed (product, lot number, quantity) — this auto-debits the MR's sample stock
- Optional e-detailing data captured during the visit (which slides were shown, for how long)

**What you see.** The form is a simple multi-section page. After submission you bounce back to the home screen. Submitted DCRs appear in **My DCRs** (`/my-dcrs`).

**AI assist — Pre-Call Briefing** *(button on the DCR page before you start)*. AI generates a one-page briefing for the upcoming visit.

- *Input data:* the doctor's profile (specialty, tier, territory), their last 5 DCRs, recent RCPA prescription pattern, any consent revocations, any open follow-up tasks for them.
- *Output:* a 4–6 line briefing covering "what we discussed last time," "open questions to follow up on," "recommended product to detail today," and "any compliance flags." Backed by [`preCallBriefing.js`](../backend/prompts/preCallBriefing.js).

**AI assist — Post-Call Extraction** *(automatic, fires when DCR is submitted)*. AI structures the free-text call summary into reportable fields.

- *Input data:* the call summary + doctor feedback the MR just typed.
- *Output:* extracted competitor mentions (logged to `competitor_intel`), commitments made by the doctor, and follow-up actions (auto-created as `follow_up_tasks`). Backed by [`postCallExtraction.js`](../backend/prompts/postCallExtraction.js).

**AI assist — Adverse Event Detection** *(automatic, fires on every DCR submit)*. The pharmacovigilance net.

- *Input data:* call summary + doctor feedback.
- *Output:* if the model finds any mention of patient harm (side effects, lack of efficacy with patient detail, medication errors, off-label use with negative outcome), it writes a row to `adverse_events` and the manager sees it in the **Drug Safety** page. Errs heavily on the side of flagging — false positives are reviewed by the manager, false negatives are regulatory exposure. Backed by [`aeDetection.js`](../backend/prompts/aeDetection.js).

**AI assist — AI Compliance Watchdog** *(automatic, fires on every DCR submit)*. The promotional-compliance net.

- *Input data:* call summary, doctor feedback, gifts/samples given. Plus the active drug-label regulatory document if one exists for the product.
- *Output:* finds off-label promotion, missing fair-balance (efficacy claim with no safety mention), gift-value-over-threshold issues, unsubstantiated claims. Each finding becomes a row in `compliance_findings` and shows up in the manager's **Compliance Inbox**. Backed by [`complianceWatchdog.js`](../backend/prompts/complianceWatchdog.js).

**AI assist — Rule-based unconsented-contact check** *(automatic, fires on every DCR submit)*. Not LLM-based but worth mentioning in the same context.

- *Input data:* doctor's latest `marketing_visit` consent state.
- *Output:* if the visit was for a doctor whose `marketing_visit` consent has been **revoked** or **withdrawn**, a `compliance_findings` row is written automatically.

### 2.2 My DCRs

**What it does.** Shows the MR's submitted call reports. Read-only history.

**What you see.** A list of cards: doctor name, product, date, a summary preview, samples given, and any AE/compliance flags raised by AI. Click any row to see the full DCR detail.

### 2.3 My Customers (Clients)

**What it does.** Lists every doctor, pharmacy, and distributor in your territory. The starting point for most field workflows.

**What it captures.** Nothing — read-only directory.

**What you see.** Searchable list with three tabs (Doctors / Pharmacies / Distributors). Each card shows tier, specialty, hospital, last-visit date. Tap a doctor to open **Doctor 360**.

### 2.4 Doctor 360

**What it does.** A complete history of one doctor in one screen.

**What it captures.** Nothing on this page itself; data is pulled from elsewhere.

**What you see.**

- Doctor's profile header (name, specialty, tier, hospital, mobile, email).
- Action buttons: jump straight into **DCR**, **eDetailing**, or (for pharmacies) **RCPA**.
- **Interaction History timeline** — chronological merge of past visits (DCRs) and orders, sorted newest first. Visits show product discussed, samples given, brand. Orders show the order value.
- **Call Frequency chart** — a 6-month bar chart of DCR counts per month.
- **Samples Given chart** — top samples distributed to this doctor, aggregated from past DCRs.

### 2.5 Today's Plan / Next Best Action

**What it does.** Tells the MR who to visit next, ranked by AI-driven priority.

**AI assist — Next Best Action** *(daily-cached recommendations)*. Backed by [`nextBestAction.js`](../backend/prompts/nextBestAction.js).

- *Input data:* every doctor in the MR's territory, their tier (A/B/C), days since last visit, recent RCPA prescription momentum (up/flat/down vs competitor), open follow-up tasks, scheduled tour plans for today, recent adverse events on shared drugs, the doctor's preferred visit day.
- *Output:* a ranked list of 5–10 doctors with a short "why now" rationale per doctor — e.g. "Tier A, prescription volume slipping vs competitor X, last visited 22 days ago" or "Open follow-up: send Phase III trial summary." The recommendations are cached daily per MR (one row per `(user_id, date)` in `nba_recommendations`); the cache regenerates each morning to save LLM cost.

**What you see.** A vertical list of doctor cards with a priority badge, the AI rationale, and direct-action buttons (Start DCR / View Profile / Mark Done).

### 2.6 Tour Plans

**What it does.** Lets the MR plan their week. The MR drafts daily plans (date + station + doctors-to-visit). Plans get submitted to the manager for approval.

**What it captures.**

- Plan date
- Type of tour (Field Work / Meeting / Training / Conference / Other)
- Station (city)
- Start time and end time
- List of doctor visits with order
- Optional notes

**What you see.** A weekly or monthly calendar view. Each day shows the planned doctors as small badges. Status pill on each plan (`draft` / `submitted` / `approved` / `rejected`). "Submit" button sends all draft plans for the current month to the manager in one click.

### 2.7 Sample Inventory

**What it does.** Shows the MR what samples they currently have on hand, by product and lot.

**What it captures.** Nothing on this page; the data is maintained automatically. When the manager allocates samples to an MR, a stock row is created. When the MR distributes samples on a DCR, the stock is debited (FEFO — first-expiring-first-out).

**What you see.** A table with brand (derived from product name), product, quantity on hand, batch/lot number, expiry date.

### 2.8 RCPA (Retail Chemist Prescription Audit)

**What it does.** Captures competitive prescription data from pharmacies. The MR walks into a pharmacy, asks "in the last week, how many of my product vs the competitor's were sold," and logs it.

**What it captures.** Pharmacy name, product, our-brand units sold, competitor product + units, optional notes. Date defaults to today.

**What you see.** Once submitted, RCPA rows feed into the territory dashboards and the AI's product-momentum signals.

**AI assist — Competitor Intelligence** *(automatic, fires on every RCPA submit)*. Backed by [`competitorIntel.js`](../backend/prompts/competitorIntel.js).

- *Input data:* the new RCPA row + recent RCPA history for that competitor across the org.
- *Output:* aggregated competitor intelligence — "Competitor X is gaining share in cardiology in Mumbai North; our share dropped from 62% to 48% over 6 weeks." Surfaces in the manager's **Manager Insights** view.

### 2.9 Order Booking

**What it does.** Lets the MR place an order on behalf of a doctor, pharmacy, or distributor. Useful when the customer asks the MR to "place that 100-unit order for me."

**What it captures.**

- Customer type (doctor / pharmacy / distributor) and the specific customer
- One or more line items: brand → product → SKU → unit price + quantity
- Free-text notes

**What you see.** After confirming, the order goes into history. Order History at the bottom shows every booking made for any customer type, with status pill (`placed` / `fulfilled` / `cancelled`).

### 2.10 Expense Claim

**What it does.** Lets the MR claim travel and field expenses. Manager approves.

**What it captures.** Each claim is a period (start–end date) with one or more line items. Line types:

- **Local Conveyance** — bike/car distance × ₹/km
- **Travel Allowance** — flight/train/bus/taxi between cities, with class
- **General Expense** — mobile, courier, stationery, etc.
- **Daily Allowance** — HQ / EX HQ / Out Station Hotel / Daily Allowance / Own Arrangement, by city, with auto-calculated rates

Each line item can have a receipt photo/PDF attachment.

**What you see.** Three tabs: **Pending** (drafts and submitted-but-not-approved), **Approved**, **Rejected**. Click any row to see the line-item breakdown. "Send for Approval" submits a draft. After approval, the row moves to the Approved tab with the final amount.

### 2.11 Leaves

**What it does.** Calendar-style view of the MR's approved leaves + a form to apply for new leave.

**What it captures.** Leave type (Earned / Sick / Casual / Comp-off / Loss of Pay / Sabbatical / Maternity / Paternity), from-date, to-date, half-day session selection, reason, contact details during leave.

**What you see.** A monthly calendar with leave days color-coded by type. A balance pill at the top shows allocated/used/remaining for each leave type for the year. The "Apply Leave" button opens the application form.

### 2.12 e-Detailing

**What it does.** Lets the MR present marketing content (slide decks, PDFs, videos) to a doctor live during the visit. Tracks which slides were shown and for how long.

**What it captures.** Per-page time-on-slide, video watch time, total session duration. Persisted to `content_views` so marketing can analyze which slides matter and which are skipped.

**What you see.** A library of available content (PDF / video / slide deck / brochure) filtered to what the marketing team has approved and distributed to your role/territory. Open one and present it; ZenApp tracks the timing automatically.

---

## 3. Smart Actions (powered by AI)

Lives in the sidebar under **Smart Actions** for MRs.

### 3.1 Knowledge Base Chat (Clinical Chat)

**What it does.** Lets the MR ask questions about their products in natural language and get cited answers from your internal medical knowledge base.

**AI assist — Hybrid RAG with citations.** Backed by [`clinicalChat.js`](../backend/prompts/clinicalChat.js).

- *Input data:* the MR's question + a hybrid retrieval over `drug_knowledge` (BM25 full-text + pgvector embedding similarity, fused via Reciprocal Rank Fusion) returning the top 6 most relevant chunks.
- *Output:* a 2–4 sentence answer with inline `[1][2]` citation markers. The retrieved chunk text appears below the answer so the MR can verify the source. Embeddings use Gemini `text-embedding-004` (768 dims).

**What you see.** A chat-style interface. Type a question, get an answer with citation footers like "[1] derise_prescribing_info.txt — Renal impairment (CrCl 30-60): reduce dose by 50%."

### 3.2 Follow-up Tasks

**What it does.** Shows the MR every open commitment to a doctor (auto-created from past DCR call summaries by AI, plus manual entries).

**What it captures.** Per task: doctor, due date, description, priority, status (open / done).

**What you see.** A list grouped by due date. Mark tasks done as you fulfill them.

---

## 4. Manager screens

These appear in the sidebar for users with `role = manager` or `admin`.

### 4.1 Tour Plan Requests

**What it does.** The manager-side view of all tour plans MRs have submitted for approval.

**What you see.** A queue of submitted plans across all MRs, with the MR's name, employee ID, planned date, and quarter. **Approve** and **Reject** buttons next to each row. Approving flips status to `approved`; rejecting requires a note.

### 4.2 MR List → MR Detail

**What it does.** The manager's directory of MRs. Click an MR to see their performance and activity.

**What it captures.** Nothing — read-only.

**What you see (MR List).** Card per MR with user_id, name, email, username, territory, status.

**What you see (MR Detail).** Six tabs:

- **Overview** — sales/visits/DCR/RCPA achievement vs target with month-over-month trend, plus radar chart comparing all 4 metrics.
- **Sales Report** — month-by-month sales/target/achievement.
- **Customer Visits** — every DCR this MR submitted (date, doctor, type).
- **DCR Submissions** — full DCR feed with products + samples.
- **RCPA Report** — competitor prescription audits.
- **Commission** — earnings breakdown by month + total commission and bonuses.

### 4.3 Manager Insights / Manager Query

**What it does.** Lets the manager ask plain-English questions about their team's performance.

**AI assist — Manager Query.** Backed by [`managerQuery.js`](../backend/prompts/managerQuery.js).

- *Input data:* the manager's question + the manager's full team context: territory rosters, last 90 days of DCRs, RCPA, sales, follow-up tasks, recent compliance findings.
- *Output:* a natural-language answer that pulls from the team's actual data — e.g. "In the last 30 days your team made 142 calls. Rahul's productivity is 18 calls/week (above average). Robert's RCPA pattern shows competitor X gaining share in cardiology — recommend a focused detailing push." Surfaces the records the model used so the manager can drill in.

### 4.4 Sales Dashboard

**What it does.** A live dashboard of secondary-sales performance — what distributors actually moved, vs MR targets.

**What it captures.** Nothing on this page; data comes from Sales Entry (uploaded by managers) and `mr_targets` (set quarterly).

**What you see.**

- Performance tab: per-MR / per-product target vs actual with achievement %, period filter defaults to last full month.
- Activity tab: per-MR DCR count, doctors covered, coverage %, and total sales value.
- Scorecard cards: overdue tasks count, doctor coverage health (cold / at-risk / healthy), market share vs competitors.

### 4.5 Visit Coverage / Territory Gap

**What it does.** Identifies high-value doctors who haven't been visited recently.

**AI assist — Territory Gap.** Backed by [`territoryGap.js`](../backend/prompts/territoryGap.js).

- *Input data:* the manager's full doctor master in their region + recent DCR activity per doctor + the doctor's tier and prescription importance.
- *Output:* a prioritized list of "blind spots" — Tier-A doctors not visited in N weeks, Tier-B doctors with declining RCPA but no recent visit, etc., each with a recommended action.

### 4.6 Drug Safety / Adverse Events

**What it does.** Inbox of every potential adverse event the AE Detection AI has flagged from DCRs.

**What it captures.** When the manager triages a finding, they can mark it reviewed, escalate to pharmacovigilance, or dismiss with a note.

**What you see.** Severity-coded list (mild / moderate / severe / critical) with the verbatim quote from the DCR that triggered the flag, the drug, doctor, MR, and date. One-click jump to the source DCR.

### 4.7 Reports

**What it does.** Pre-built operational reports — Tour Plan Report, Daily Call Report, Joint Working Coverage, Call Average. Useful for monthly review meetings.

**What you see.** Pick a report from the dropdown; see a table + bar chart for that report.

> *Note:* this page currently uses a sample dataset for layout demo. A future analytics phase will derive these reports from live data.

---

## 5. Compliance (manager + admin)

Sidebar section **Compliance**. The "trust unlock" piece — what makes pharma buyers say "we can audit this."

### 5.1 Compliance Inbox

**What it does.** Triages findings from the **AI Compliance Watchdog** plus rule-based checks (e.g. unconsented-contact).

**What it captures.** When the user reviews a finding, they decide: **acknowledge / dismiss / escalate / resolve**, with notes. Each decision stamps reviewed_by and reviewed_at and writes an `audit_log` row.

**What you see.** Color-coded list (low / medium / high / critical severity), filterable by status (open / acknowledged / dismissed / escalated / resolved) and finding type. Each row shows:

- Finding type — `off_label_promotion`, `missing_fair_balance`, `gift_value_threshold`, `unconsented_contact`, `unsubstantiated_claim`, `duplicate_ae_report`, `other`
- The verbatim quote that triggered it
- Source record (e.g. "DCR #5 by mr_rahul_001")
- Recommended remediation
- Detected by — `ai`, `human`, or `rule`

**AI assist — see Section 2.1** for the watchdog details that produce these findings.

### 5.2 Consent Register

**What it does.** Per-doctor consent tracking. Required for GDPR-style and India DPDP Act compliance — you must be able to prove a doctor opted in to be marketed to, and revoke that on demand.

**What it captures.** Each consent event is a new append-only row:

- Doctor + channel (`marketing_email` / `marketing_visit` / `sample_distribution` / `data_processing`)
- Status — `granted` / `revoked` / `withdrawn`
- Source — `verbal` / `written` / `digital_signature` / `imported`
- Notes
- Effective from / until dates

**What you see.** Pick a doctor from the searchable list. The right pane shows current state per channel as colored pills, plus the full append-only history below. "+ Record consent event" button to log a new grant/revoke/withdraw.

The compliance watchdog uses this — if a marketing visit is recorded for a doctor with revoked `marketing_visit`, an `unconsented_contact` finding fires.

### 5.3 Regulatory Documents

**What it does.** Repository for the regulated documents that anchor the rest of the system: drug labels, IFUs (Instructions for Use), MoH approval letters, safety communications, SOPs, training material.

**What it captures.** Per document:

- Title, type, jurisdiction (e.g. IN, EU, US-FDA, global)
- Linked product (optional — SOPs and training are usually cross-product)
- Owner
- Plus one or more file uploads with version number, effective date, expiry date, and per-version change notes

**What you see.** A list of all documents. The **"Expiring within 60 days"** banner at the top auto-flags anything close to expiry — important for renewal planning. Click any document to see all versions; "Open" on any version downloads the file.

The AI Compliance Watchdog (Section 5.1) uses the active drug-label here to know what's on-label vs off-label.

### 5.4 Audit Log (admin only)

**What it does.** Tamper-evident append-only ledger of every CREATE / UPDATE / DELETE on regulated tables (DCRs, doctor profiles, MLR reviews, consent records, expenses, samples, content versions, KOL profiles — 18 tables in total).

**What it captures.** Automatically — admins don't write here. Each entry records:

- Actor (user_id + role)
- Table + row id
- Action (CREATE / UPDATE / DELETE)
- before_data + after_data JSONB snapshots
- Route path, HTTP method, IP address
- Optional reason

**What you see.** Filterable feed (by table, actor, action, date range). Each row expands to show the full before/after JSON diff. **Stats** tab summarizes the last 30 days by table and by actor.

The first question in any pharma audit is "show me everything that happened to this DCR" — this page answers it in 2 clicks.

---

## 6. HCP Master Data (manager + admin)

Sidebar section **HCP Master Data**. Replaces flat free-text doctor profiles with proper master data.

### 6.1 Institutions

**What it does.** Hospital, clinic, and medical-center master. Lets you target "all cardiologists at Apollo Mumbai" instead of just searching free-text strings.

**What it captures.** Per institution:

- Name, type (`hospital_public` / `hospital_private` / `clinic` / `nursing_home` / `medical_center` / `diagnostic_center` / `other`)
- Bed count, city, state, territory, tier
- Address, phone, website
- Notes

**What you see.** List with type / city / territory / tier / affiliated-doctor count. Click an institution to see the affiliated doctors with their roles (consultant / HOD / visiting / attending) and effective dates.

### 6.2 HCP Data Quality

**What it does.** Curation dashboard. Surfaces doctor records that need attention so the master data stays clean.

**What you see.** Five sections:

- **Missing affiliation** — doctors with no institution link
- **Free-text specialty** — doctors whose `specialty` text doesn't map to the controlled taxonomy (32 codes: cardiology, endocrinology, nephrology, neurology, etc.)
- **No specialty at all** — doctors with neither free-text nor taxonomy code
- **Duplicate candidates** — 2+ doctors sharing the same lower(name) + territory
- **Stale profiles** — never enriched, or enriched > 180 days ago

Each row has an **AI Enrich** button.

**AI assist — HCP Enrichment.** Backed by [`hcpEnrichment.js`](../backend/prompts/hcpEnrichment.js).

- *Input data:* the doctor's existing sparse profile (name, free-text specialty, hospital text, territory, tier, phone) + the controlled specialty taxonomy.
- *Output:* a JSON suggestion with: `specialty_code` (mapped to taxonomy), confidence (high/medium/low), `likely_credentials` (e.g. ["MBBS", "MD General Medicine", "DM Cardiology"]), `likely_hospital_type`, a 1–3 sentence enrichment summary, and `data_quality_flags` listing what's still uncertain.
- *Persistence:* the manager reviews the suggestion and clicks **Apply specialty + persist** (writes the taxonomy code and stamps `last_enriched_at`) or **Persist notes only** (just stamps the timestamp + stashes the raw suggestion in `enrichment_metadata`).

### 6.3 Territory Alignments *(used by manager assignments)*

**What it does.** Versioned MR↔territory history. Solves "who covered Mumbai-North in March 2024 vs September 2024?"

**What it captures.** Each alignment has user_id, territory, role-at-time, effective-from, effective-until. At most one open alignment per user. Reassigning auto-closes the prior alignment.

**What you see.** Currently consumed by the system rather than displayed on a dedicated page — the data drives historical attribution in reports.

---

## 7. Medical Affairs (manager + admin + medical reviewer)

Sidebar section **Medical Affairs**. The "Veeva also has a med-affairs product" answer, lite version.

### 7.1 Medical Queries

**What it does.** Tracks scientific questions doctors ask. The MR captures the question via the **Capture query** form on this page (or via DCR notes that get promoted). AI drafts a response. A medical reviewer approves or edits before it's sent.

**What it captures.**

- Doctor (from list, optional doctor_id)
- Question text
- Captured via — `mr_visit` / `phone` / `email` / `portal` / `event` / `other`
- Product
- Category — `efficacy` / `safety` / `dosing` / `interaction` / `off_label` / `clinical_data` / `administration` / `other`
- Urgency — `low` / `standard` / `high` / `critical`

**What you see.** Triage queue sortable by urgency. Each row shows status badge (`open` / `in_review` / `answered` / `sent` / `closed_no_action`), urgency, doctor, question preview. Click to see the full thread:

- Original question
- AI-drafted answer with inline `[1][2]` citation markers
- The retrieved knowledge-base snippets backing each citation
- Final reviewer-edited answer (when status is `answered` or `sent`)
- Send method (email / mr_callback / letter)

Reviewer actions in the modal: **Claim** (open → in_review), **Save as answered**, **Mark sent**, **Re-draft with AI**, **Close (no action)**.

**AI assist — Medical Query Auto-Answer.** Backed by [`medicalQueryAnswer.js`](../backend/prompts/medicalQueryAnswer.js).

- *Input data:* the question + RAG-retrieved chunks from `drug_knowledge` (top 6 hits via FTS + pgvector + RRF).
- *Output:* a JSON object with: a 2–3 sentence draft `answer` with inline `[1][2]` markers, `confidence` (high/medium/low), `evidence_sufficient` (bool), a `citations` array of `{marker, source_doc_id, snippet}`, and a `caveats` note for the reviewer flagging gaps. Critical guardrail: the model is told to refuse to answer (and say so) if the evidence doesn't cover the question — better than confabulating.

### 7.2 KOL Dashboard

**What it does.** Lists Key Opinion Leaders — doctors with outsized influence on prescribing. Different from "high-prescribers" — a doctor can be a high prescriber without being a KOL, and vice versa.

**What it captures (when classifying).**

- Tier — `T1` (national / cross-specialty), `T2` (regional / specialty), `T3` (local), `emerging`
- Influence score (0–100)
- Advisory board member (Y/N), speaker bureau (Y/N), publication count
- Sentiment toward our products (-2 to +2)
- Sentiment evidence (a quote or note)
- Last engagement date + type (auto-stamps when a KOL is added as an attendee on a Medical Engagement)

**What you see.** Sortable list with tier badge, score, advisory/speaker flags, publications, sentiment, last engagement, and source (`human` or `ai` identified). Top stats: total KOLs, advisory board members, speaker bureau members, AI-suggested.

**AI assist — KOL Identifier.** Backed by [`kolIdentifier.js`](../backend/prompts/kolIdentifier.js).

- *Input data:* a doctor's recent (90-day) DCRs, RCPA prescription volume, active institution affiliations, existing KOL row if any, and their specialty/territory.
- *Output:* a JSON suggestion with `recommended_tier` (T1/T2/T3/emerging/not_kol), `influence_score` (0–100), 1–3 sentence `rationale`, `key_signals` array (e.g. "advisory board member at Lilavati", "high RCPA volume in Mumbai cardio cluster"), `suggested_actions` (e.g. "invite as panelist on Q3 advisory board"), and `data_gaps` (e.g. "publication count unknown — verify").
- *Persistence:* the manager reviews and clicks **Confirm + persist** to upsert into `kol_profiles` with `identified_by='ai'`.

### 7.3 Medical Engagements

**What it does.** Manages advisory boards, speaker programs, symposia, consultations, investigator meetings, roundtables. Both for ROI tracking and Sunshine-Act-style transparency reporting.

**What it captures.**

- Engagement: title, type, product, topic, agenda, location, scheduled_at, duration_minutes, sponsor (user_id), status (`planned` / `confirmed` / `completed` / `cancelled`), outcomes_summary
- Attendees: doctor, role (`attendee` / `speaker` / `chair` / `panelist` / `organiser`), attended (yes/no), honorarium amount + currency, feedback

**What you see.** List of engagements with status pill, scheduled date, location, attendee count. Click to see the full attendee roster — each attendee row shows the doctor's KOL tier next to their name, useful when planning.

**Side effect:** when you add a doctor as an attendee, the doctor's KOL profile's `last_engagement_at` and `last_engagement_type` auto-update. So the KOL dashboard always knows who you saw last and when.

---

## 8. Marketing & MLR (admin + reviewers)

Sidebar section **Smart Actions** for admin/manager (Content Library, MLR Queue) and **MLR Review** for the three reviewer roles.

### 8.1 Content Library *(admin/manager)*

**What it does.** Central marketing-asset repository. Every detail aid, slide deck, brochure, video, and PDF a rep might show a doctor lives here. Each asset has versioned uploads.

**What it captures.** Per asset: title, asset type (`slide_deck` / `video` / `pdf` / `detail_aid` / `brochure`), product, therapeutic area, owner. Per version: file upload, expiry date, change notes; status moves through `draft` → `in_review` → `approved` / `changes_requested` → `published` → `retired`.

**What you see.** Top stats (count by status). Asset cards with status badge. Click to see version history with each version's MLR review state, AI-extracted claims, and AI pre-review summary inline. Action buttons per version: **Submit for MLR** (draft → in_review), **Publish** (admin only, on approved versions), **Distribute** (target the asset to a list of MRs / territories / roles / all).

**AI assist — Claim Substantiation.** Backed by [`claimExtraction.js`](../backend/prompts/claimExtraction.js).

- *Input data:* the uploaded file's text content (PDF/PPTX/TXT extracted text).
- *Output:* every marketing claim found in the asset (e.g. "38% reduction in primary endpoint", "twice as effective as competitor"), each looked up against `drug_knowledge` via RAG. The result is rows in `content_claims` with a `reviewer_status` of `auto` (citation found and high-confidence), `needs_citation` (no support found), or `confirmed`/`dismissed` after reviewer triage. Reviewers see "5 of 7 claims have citations" inline in the MLR queue.

**AI assist — MLR Pre-Review.** Backed by [`mlrPreReview.js`](../backend/prompts/mlrPreReview.js).

- *Input data:* the asset's text content + the asset's metadata (product, therapeutic area).
- *Output:* a JSON pre-review with categorized findings — off-label claims, missing fair-balance, unsubstantiated comparisons, vague qualifiers, audience concerns. Each finding has severity, an excerpt, an explanation, and a suggested fix. Saved to `content_versions.ai_pre_review_notes` JSONB. Reviewers see the AI's findings inline before they read the asset itself.

**AI assist — Content Recommender.** Backed by [`contentRecommender.js`](../backend/prompts/contentRecommender.js).

- *Input data:* MR's pending tour-plan visits, doctor profiles, visit history, content_views history, currently-published assets for the relevant therapeutic areas.
- *Output:* a ranked `{doctor, recommended_assets, why}` list — "Bring the Bevaas Cardio Slide Deck v2 when you visit Dr. Mehta tomorrow because…". Cached daily per MR.

### 8.2 MLR Review Queue *(reviewers)*

**What it does.** The approval workflow for marketing content. Every published asset version must pass three parallel reviewers — medical, legal, regulatory. All three must approve before it goes live.

**What it captures.** Per review: the reviewer's decision (`approved` / `changes_requested` / `rejected`) and decision notes (required for non-approved decisions).

**What you see (reviewer's queue).** Filtered to your role — medical_reviewer sees the medical column, legal_reviewer sees the legal column, etc. Each row shows the asset title, version, who submitted, and submitted date. Click to open:

- File link (download or preview)
- The AI pre-review findings (severity-coloured chips)
- The other two reviewers' decisions side-by-side
- Marketing claims with citation status
- Decision form

**Auto-flip rules** when you submit a decision:

- All 3 roles approved → version auto-flips to `approved` (admin can then publish).
- Any one role requests changes or rejects → version flips to `changes_requested` (marketing must upload a v2).

---

## 9. Account & utilities

### 9.1 Profile

Edit your name, email, phone, language preference. Read-only for territory and role (set by admin).

### 9.2 Offline Requests

ZenApp is a **PWA** — it works without an internet connection. When you submit a DCR, leave application, expense claim, etc. while offline, the request is queued in IndexedDB. This page shows the queue: each pending request with its method, path, and queued time. When you come back online, the queue auto-replays. You can also force-replay or discard from this page.

Multipart uploads (receipt photos, content uploads) are NOT queued — they require a live connection.

### 9.3 Knowledge Base Upload *(admin)*

**What it does.** Lets the admin upload PDFs, TXT files, or DOCX containing drug prescribing information, clinical trial summaries, FAQs, etc. These power the Knowledge Base Chat (Section 3.1) and Medical Query Auto-Answer (Section 7.1).

**Behind the scenes.** Uploaded files are split into chunks, embedded with Gemini `text-embedding-004`, and stored in `knowledge_chunks` with the embedding vector. Hybrid retrieval (BM25 + pgvector + RRF) is used to find the right chunks at query time.

---

## 10. AI features at a glance

A summary table of every AI feature, where it fires, and what it produces:

| # | AI feature | When it fires | Inputs | Output | Backed by |
|---|---|---|---|---|---|
| 1 | Pre-Call Briefing | MR clicks "Brief me" before a visit | Doctor profile, last 5 DCRs, RCPA, consent state, follow-ups | One-page briefing | `preCallBriefing.js` |
| 2 | Post-Call Extraction | DCR submitted | Free-text call summary + feedback | Competitor mentions + follow-up tasks | `postCallExtraction.js` |
| 3 | Adverse Event Detection | DCR submitted | Call summary + feedback | Adverse event rows | `aeDetection.js` |
| 4 | Compliance Watchdog | DCR submitted | Call summary + gifts + active drug label | `compliance_findings` rows | `complianceWatchdog.js` |
| 5 | Next Best Action | Daily-cached per MR | Doctor master + DCRs + RCPA + tasks | Ranked priority list | `nextBestAction.js` |
| 6 | Knowledge Base Chat | MR asks a question | Question + RAG retrieval over `drug_knowledge` | Cited answer | `clinicalChat.js` |
| 7 | Manager Query | Manager asks a question | Question + team's full data | NL answer with drill-in records | `managerQuery.js` |
| 8 | Territory Gap | Manager opens the page | Doctor master + DCRs + tier/importance | Prioritized blind-spot list | `territoryGap.js` |
| 9 | Competitor Intelligence | RCPA submitted | New RCPA + recent competitor history | Aggregated competitive intel | `competitorIntel.js` |
| 10 | Product Signals | Reports / dashboards | Per-product RCPA + sales trends | Up/flat/down product momentum | `productSignals.js` |
| 11 | HCP Enrichment | Manager clicks "AI Enrich" on a doctor | Sparse doctor profile + taxonomy | Specialty mapping + credentials suggestion | `hcpEnrichment.js` |
| 12 | KOL Identifier | Manager clicks "AI Identify" on a doctor | DCRs + RCPA + affiliations + existing KOL row | Tier suggestion + rationale + actions | `kolIdentifier.js` |
| 13 | Medical Query Auto-Answer | Query captured | Question + RAG over `drug_knowledge` | Citation-tagged draft answer | `medicalQueryAnswer.js` |
| 14 | Claim Substantiation | Content version uploaded | Asset text + RAG | `content_claims` rows with citation status | `claimExtraction.js` |
| 15 | MLR Pre-Review | Content version submitted for review | Asset text + metadata | Pre-review notes (off-label / fair-balance / etc.) | `mlrPreReview.js` |
| 16 | Content Recommender | Daily-cached per MR | Tour plans + visit history + published content | "Bring this asset to that doctor" list | `contentRecommender.js` |

**LLM backend** is pluggable (`backend/services/llm/`) — supports Gemini, OpenAI, Groq, and Anthropic. Production runs on Gemini for cost reasons. RAG embeddings always use Gemini `text-embedding-004` (768 dims).

---

## 11. Permissions cheat sheet

| Action | MR | Manager | Admin | Reviewers |
|---|---|---|---|---|
| Submit DCR | ✓ | ✓ | ✓ | — |
| See own DCRs | ✓ | ✓ | ✓ | — |
| See team's DCRs | — | ✓ | ✓ | — |
| Submit tour plan | ✓ | — | — | — |
| Approve tour plan | — | ✓ | ✓ | — |
| Submit expense claim | ✓ | ✓ | — | — |
| Approve expense claim | — | ✓ | ✓ | — |
| Apply for leave | ✓ | ✓ | — | — |
| Approve leave | — | ✓ | ✓ | — |
| See KOL dashboard | — | ✓ | ✓ | medical_reviewer (read) |
| Identify a KOL via AI | — | ✓ | ✓ | medical_reviewer |
| Capture medical query | ✓ | ✓ | ✓ | ✓ |
| Answer medical query | — | — | ✓ | medical_reviewer |
| Approve content (medical) | — | — | ✓ | medical_reviewer |
| Approve content (legal) | — | — | ✓ | legal_reviewer |
| Approve content (regulatory) | — | — | ✓ | regulatory_reviewer |
| Publish content | — | — | ✓ | — |
| Compliance Inbox | — | ✓ | ✓ | — |
| Consent Register | — | ✓ | ✓ | — |
| Regulatory Docs | — | ✓ | ✓ | — |
| Audit Log | — | — | ✓ | — |
| MR List / Detail | — | ✓ | ✓ | — |
| Tour Plan Requests | — | ✓ | ✓ | — |

---

## 12. Demo data on first login

If you're running ZenApp locally, the seeded demo DB ships with:

- **3 MRs** (`rahul`, `priya`, `robert`), 1 manager (`manager1`), 1 admin (`admin`), 3 MLR reviewers (`reviewer_med`, `reviewer_legal`, `reviewer_reg`). All passwords: `password123`.
- **14 doctors** across Mumbai North / Mumbai South / Delhi NCR. Three flagship doctors (Dr. Anil Mehta, Dr. Pradeep Joshi, Dr. Suresh Kumar) have hand-distributed 25-DCR histories so their Doctor-360 timelines are rich.
- **~533 DCRs over 12 months** with realistic call summaries covering positive routine visits, detailing sessions, KOL engagements, sample drops, RCPA checks, mild & major safety concerns, off-label discussions, fair-balance lapses, gift-threshold flags, competitor threats, doctor pushback, and no-shows. Distribution skews toward the last 90 days (denser recent activity) with tail-off to 12 months.
- **~200 RCPA records over 12 months** showing competitive prescription momentum (some products gaining share, others slipping).
- **324 monthly sales rows + 324 monthly targets** spanning 12 months × 3 MRs × 9 products. Sales trend upward with seasonality and noise so achievement charts look real.
- **60 follow-up tasks** with a mix of pending / completed / overdue.
- **50 e-detailing content views** distributed across published assets.
- **13 adverse events** auto-derived from major-safety-signal DCRs.
- **3 NBA recommendation caches** (one per MR for today).
- **10 institutions** with 18 affiliations covering all 14 doctors.
- **8 KOLs** across all 4 tiers, mixed AI-identified and human-classified.
- **16 medical engagements** (6 hand-crafted + 10 historical/future) covering advisory boards, speaker programs, symposia, consultations, investigator meetings, roundtables — across `planned`, `confirmed`, `completed`, `cancelled`.
- **42 medical queries** (12 hand-crafted + 30 historical) spanning every status from `open` to `sent`, with full AI-drafted prose + citations.
- **32 compliance findings** (12 hand-crafted + 20 historical) across all severities and finding types.
- **6 regulatory documents** with one MoH approval expiring in 50 days (drives the demo banner).
- **4 content assets** with 6 MLR review states.
- **199 historical audit log entries** spanning the last 90 days — DCR creates, MLR decisions, consent flips, regulatory uploads, KOL classifications, expense reviews, etc.

**The data auto-rolls.** Every date uses `CURRENT_DATE` / `NOW()` arithmetic — when the real clock advances, "last week" still means last week, "expiring in 50 days" still means 50 days, and "Q3 2026 advisory board next week" stays "next week" until the day passes. To regenerate the synthetic history with fresh randomization (e.g. quarterly demo refresh), re-run the seeder:

```bash
bash backend/db/apply_demo_seeds.sh
```

The script is idempotent — every base seed `TRUNCATE`s its slice first, the synthetic-activity script regenerates and applies its SQL output, and the relative-date arithmetic anchors everything to whatever today is at run time.

---

## 13. Where to go next

- Setting up locally — [backend/SETUP.md](../backend/SETUP.md)
- Migration + seed execution order — [backend/db/SEED_DATA_GUIDE.md](../backend/db/SEED_DATA_GUIDE.md)
- Architecture and tech inventory — [FEATURES.md](../FEATURES.md)
- AI sales narrative — [AI_FEATURES_REPORT.md](../AI_FEATURES_REPORT.md)
- Project orientation for engineers — [CLAUDE.md](../CLAUDE.md)
