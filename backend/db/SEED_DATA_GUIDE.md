# ZenApp Seed Data Guide

Reference for maintaining seed data consistency across all tables.

## Execution Order

Run these files **in order** after a fresh database (schema.sql is auto-run by Docker on first start):

| Step | File | Purpose |
|------|------|---------|
| 1 | `schema.sql` | Tables (auto-run by Docker) |
| 2 | `migration_v2.sql` | V2 schema (follow_up_tasks, adverse_events, nba) |
| 3 | `migration_v3.sql` | Doctor profiles, RCPA |
| 4 | `migration_v3_rag.sql` | RAG/knowledge tables |
| 5 | `migration_v4_pharmacies.sql` | Pharmacy profiles |
| 6 | `migration_v5_doctor_requests.sql` | Doctor request/approval workflow |
| 7 | `seed_users.sql` | 5 users (3 MRs, 1 manager, 1 admin) |
| 8 | `seed_doctors.sql` | 14 doctor profiles (TRUNCATEs first) |
| 9 | `seed_pharmacies.sql` | 11 pharmacy profiles |
| 10 | `dummy_data.sql` | Products + 38 DCR records (detailed) |
| 11 | `seed.sql` | Products + 43 DCR records (legacy, lighter) |
| 12 | `rcpa_dummy_data.sql` | 30 RCPA audit records |
| 13 | `seed_demo_data.sql` | Follow-up tasks + adverse events |
| 14 | `seed_knowledge.sql` | Drug knowledge base |
| 15 | `migration_v6_sales.sql` | Sales module (distributors, secondary_sales, mr_targets) |
| 16 | `seed_sales_data.sql` | 6 distributors + ~180 sales records + 108 MR targets |
| 17 | `migration_v7_multitenancy.sql` | Multi-tenancy: `organizations` table + `org_id` on all 17 existing tables, FKs, indexes, RLS (permissive). Backfills existing rows into a single default org so seed data continues to work. |
| 18 | `migration_v8_tour_plans.sql` | Daily MR tour plans: `tour_plans` (one row per MR per day, with submit/approve workflow) + `tour_plan_visits` (ordered child rows for each planned doctor visit). Includes CHECKs for time order, doctor presence, and per-org-per-day uniqueness. |
| 19 | `seed_tour_plans.sql` | 3 demo plans across all status states: Rahul approved, Priya submitted, Robert draft. References doctors seeded in step 8. |
| 20 | `migration_v9_expenses.sql` | Expense claims: `expense_claims` (header per period, with submit/approve workflow) + `expense_line_items` (wide schema covering all 4 claim types: Local Conveyance, Travel Allowance, Daily Allowance, General Expense). CHECKs enforce per-type required fields. Receipts upload to `/uploads/receipts/<claim_id>/`. |
| 21 | `seed_expenses.sql` | 3 demo claims: Rahul approved (4 line items spanning all claim types), Priya submitted, Robert draft. |
| 22 | `migration_v10_leaves.sql` | Leaves: `leaves` (apply/approve workflow, half-day support via from_session/to_session) + `leave_balances` (per-user-per-year-per-type with generated `remaining_days = allocated - used`). 8 leave types matching the frontend (CL, SL, EL, comp_off, LOP, sabbatical, maternity, paternity). |
| 23 | `seed_leaves.sql` | Annual allocations for all 3 MRs (12 CL / 12 SL / 18 EL) + 3 demo applications: Rahul approved (3-day CL), Priya pending (half-day SL), Robert rejected (11-day EL). Rahul's CL balance reflects the approved leave (12 alloc, 3 used, 9 remaining). |
| 24 | `migration_v11_orders.sql` | Order Booking: `orders` (header per booking, customer_type ∈ {doctor, pharmacy, distributor} with discriminator + nullable FKs, status workflow draft → placed → fulfilled / cancelled) + `order_line_items` (product, qty, unit_price, line_total). CHECK ensures exactly one customer FK matches the type. |
| 25 | `seed_orders.sql` | 4 demo orders covering all 3 customer types and 3 status states: Rahul fulfilled (doctor), Priya placed (pharmacy), Robert placed (distributor) + draft (doctor). |
| 26 | `migration_v12_samples.sql` | Sample Inventory: `sample_stock` (cached per-MR-per-product-per-lot quantity, UNIQUE on org+user+product+lot) + `sample_movements` (append-only ledger: allocation / distribution / return / adjustment / expiry). DCR sample distributions auto-write a `distribution` movement via the [services/sampleDistribution.js](backend/services/sampleDistribution.js) hook, debiting the MR's stock FEFO (oldest-expiring-first). |
| 27 | `seed_samples.sql` | Per-MR Q1 allocations (Derise + Bevaas + Rilast lots) + 4 prior distributions to doctors. Cached `sample_stock.quantity` matches the ledger-derived balance. |
| 28 | `migration_v13_clm_mlr.sql` | CLM/MLR content engine (Phase B): `content_assets` (long-lived identity) + `content_versions` (versioned uploads with status workflow) + `mlr_reviews` (per-(version × role) review row) + `content_distributions` (audience targeting) + `content_views` (CLM tracker — every slide/page view with duration) + `content_claims` (extracted marketing claims with substantiation status). Also extends `users.role` CHECK to add `medical_reviewer`, `legal_reviewer`, `regulatory_reviewer`. |
| 29 | `seed_content.sql` | 3 demo MLR reviewers (one per role, password `password123`) + 4 content assets across 3 products + 6 versions covering all 5 active statuses (draft / in_review / changes_requested / approved / published). MLR reviews show three demo states: a halfway-through cycle (medical approved, legal+reg pending), a happy-path approved-by-all, and a regulatory-bounced version. Plus 6 content_views and 3 content_claims (2 auto-cited, 1 needing citation). |
| 30 | `migration_v14_content_recommendations.sql` | CLM-NBA daily cache table (Phase B Week 2). One row per (org, user, date) with the recommendations JSONB blob. Mirrors the `nba_recommendations` shape; the recommender endpoint upserts on the unique key. |
| 31 | `migration_v15_compliance.sql` + `migration_v16_hcp_master.sql` + `migration_v17_medical_affairs.sql` | Phase C schemas: compliance (audit log, consent records, regulatory documents, AI-watchdog findings), HCP master data (institutions, hcp_affiliations, specialty taxonomy, versioned territory_alignments), medical affairs (medical_queries, kol_profiles, medical_engagements, engagement_attendees). |
| 32 | `seed_institutions.sql` | 10 institutions covering all 6 institution_type values across 3 territories + 17 hcp_affiliations rows (14 primary + 3 visiting + 1 closed historical row to demo the affiliation history view). |
| 33 | `seed_territory_alignments.sql` | 7 versioned alignments showing closed history for Rahul (Mumbai S → N) and Priya (Delhi → Mumbai S), plus open current rows for all 3 MRs and the manager. Demonstrates the partial-unique-on-(user,open) constraint. |
| 34 | `seed_consent.sql` | ~20 per-doctor consent rows across all 4 channels and all 3 statuses. Includes Dr. Anil Mehta's withdrawn-then-regranted email history (depth) and Dr. Pradeep Joshi's recently-revoked email (which seeds the unconsented_contact compliance finding). |
| 35 | `seed_kols.sql` | 8 KOLs covering all 4 tiers (T1/T2/T3/emerging) and both `identified_by` values, with sentiment_score range -1 to +2. Each row has realistic AI-style sentiment_evidence + notes. last_engagement_at synced to seed_medical_engagements.sql attendance. |
| 36 | `seed_medical_engagements.sql` | 6 engagements covering 6 of 7 engagement_type values and all 4 status values (planned, confirmed, completed, cancelled) + 14 attendee rows wiring KOLs in as chair/speaker/panelist/attendee with realistic honoraria. The cardio AB at +14 days is the demo's "next week" event. |
| 37 | `node backend/scripts/seed_regulatory_files.js` | Writes 7 small placeholder PDF/TXT files into `backend/uploads/regulatory/<doc_id>/` so the "Open" link in RegulatoryDocs.tsx returns real content. Idempotent. Run BEFORE step 38. |
| 38 | `seed_regulatory_docs.sql` | 6 regulatory documents covering 6 of 7 doc_type values + 7 versions. Includes the MoH approval letter expiring in 50 days to trigger the "Expiring within 60 days" banner — demo moment. Uses the deferrable-FK pattern: insert documents → versions → UPDATE current_version_id. |
| 39 | `seed_compliance_findings.sql` | 12 AI Watchdog findings covering all 6 finding_type, all 5 status, and all 3 detected_by values. Each linked to a real DCR / AE / content_version / expense_claim id. Finding #4 (unconsented_contact for Dr. Pradeep Joshi) cross-references the consent revoke in seed_consent.sql. |
| 40 | `seed_audit_log.sql` | 30 historical audit entries across the last 30 days. Covers DCR creates, MLR review decisions, consent grants/revokes, regulatory doc uploads, compliance finding decisions, expense + tour-plan reviews, KOL classifications, medical query claims, and engagement attendee adds. Realistic before/after JSONB snapshots. |
| 41 | `seed_medical_queries.sql` | 12 doctor scientific queries covering all 5 status values, all 4 urgency values, and 8 categories. Each query with `ai_draft_answer` includes 2-3 sentence prose with `[1][2]` citation markers backed by JSONB referencing real drug_knowledge ids. Final answers (4-6 sentences) are populated for queries that reached `answered` or `sent`. |

| 42 | `node backend/scripts/seed_synthetic_activity.js` → `seed_synthetic_activity.sql` | **Final pass — 12-month deep history.** Auto-generated SQL that TRUNCATEs and rebuilds the activity tables (`dcr`, `rcpa`, `secondary_sales`, `mr_targets`, `follow_up_tasks`, `content_views`, `nba_recommendations`, `adverse_events`) with ~12 months of synthetic field activity, then APPENDs to `compliance_findings`, `medical_queries`, `medical_engagements`, `engagement_attendees`, `audit_log` so dashboards like Sales Performance, Visit Coverage, Doctor 360 call frequency, and the AI Watchdog inbox have realistic depth. All dates use `CURRENT_DATE` / `NOW()` arithmetic — re-running auto-rolls the window forward (no manual rollover job needed). Output volumes per pass: ~533 DCRs, ~200 RCPA, 324 sales rows, 324 targets, 60 follow-ups, 50 content views, 13 adverse events, 32 compliance findings (12 base + 20 hist), 42 medical queries (12 base + 30 hist), 16 engagements (6 base + 10 hist), 199 audit entries (29 base + 170 hist). Flagship doctors (Dr. Anil Mehta, Dr. Pradeep Joshi, Dr. Suresh Kumar) get hand-distributed scenario mixes for rich Doctor-360 timelines; the other 11 doctors get weighted-random scenarios covering safety / off-label / fair-balance / gift-threshold / competitor / pushback. Generator is deterministic via a fixed RNG seed — override with `SEED=<int>`. |

**Single-shot demo seeder:** `bash backend/db/apply_demo_seeds.sh` runs steps 37–42 (the Phase B/C demo bundle including the synthetic-activity pass) in dependency order against the local `zenapp_local` DB. Each seed is idempotent (TRUNCATE first), so it's safe to re-run any time the demo state drifts. The synthetic-activity pass also uses relative-date arithmetic, so simply re-running the script every few months refreshes the demo with a new "last 12 months" anchored to whatever today is.

**Why this design:** Most dashboards (Sales Performance, Visit Coverage, Doctor 360 call frequency, AI Watchdog 30-day stats) need rich history to look real. Hand-writing 500+ rows is impractical and brittle. A deterministic generator gives us the depth without losing version-control sanity — only the small `.js` file is hand-maintained; the large `.sql` artifact is regenerated as needed and excluded from review noise.

**Note on multi-tenancy:** After step 17, every existing row belongs to the default org (`00000000-0000-0000-0000-000000000001`). The seed users will continue to log in normally because the `/api/auth/login` endpoint falls back to the default org when no `org_slug` is supplied. To create a second org for testing, register a new user with `{ "org_name": "Acme Pharma", ... }` in the request body — the registration handler will mint a new org and attach the user to it. Use `org_slug` on subsequent logins to disambiguate.

**Note:** `seed.sql` and `dummy_data.sql` both insert into the same `dcr` table. `seed.sql` TRUNCATEs first, so if run after `dummy_data.sql` it replaces the data. For demos, run only one of them (seed.sql is recommended as it's lighter).

### Step 17 — Knowledge Chunks (rechunk.js)

After all SQL seeds are loaded, run the rechunk script to populate `knowledge_chunks` with chunked text and vector embeddings from `drug_knowledge`:

```bash
GEMINI_API_KEY=<your_key> DATABASE_URL=<your_db_url> node backend/scripts/rechunk.js
```

- **Source table:** `drug_knowledge` (populated by `seed_knowledge.sql`)
- **Target table:** `knowledge_chunks` (created by `migration_v3_rag.sql`)
- **Requires:** `GEMINI_API_KEY` env var for computing embeddings
- **Safe to re-run:** clears existing chunks before re-inserting
- **Without this step**, the chatbot/RAG features will not work — semantic search depends on the embeddings in `knowledge_chunks`

## MR → Territory → Doctor/Pharmacy Mapping

### Rahul Sharma (`mr_rahul_001`) — Mumbai North

| Doctor | Specialty | Tier |
|--------|-----------|------|
| Dr. Anil Mehta | Cardiology | A |
| Dr. Sunita Verma | General Medicine | B |
| Dr. Pradeep Joshi | Nephrology | A |
| Dr. Kavita Rao | Endocrinology | B |
| Dr. Ramesh Patil | Dermatology | B |

Pharmacies: CVS Pharmacy, Walgreens, Rite Aid, Walmart Pharmacy

### Priya Mehta (`mr_priya_002`) — Mumbai South

| Doctor | Specialty | Tier |
|--------|-----------|------|
| Dr. Meena Shah | Internal Medicine | B |
| Dr. Vikram Desai | Cardiology | B |
| Dr. Rajesh Kapoor | Neurology | A |
| Dr. Anita Patel | General Medicine | C |

Pharmacies: CVS Pharmacy, Kroger Pharmacy, Target Pharmacy, Costco Pharmacy

### Robert (`mr_robert_003`) — Delhi NCR

| Doctor | Specialty | Tier |
|--------|-----------|------|
| Dr. Neha Sharma | Neurology | B |
| Dr. Suresh Kumar | Cardiology | A |
| Dr. Amit Gupta | General Medicine | B |
| Dr. Pooja Singh | Endocrinology | A |
| Dr. Rakesh Mishra | Internal Medicine | C |

Pharmacies: MedPlus Pharmacy, Apollo Pharmacy, Wellness Forever Pharmacy, Safeway Pharmacy

## DCR Date Strategy (Visit Coverage demo)

Each MR must have a mix of visit recency to demonstrate all states on the Visit Coverage page (default 30-day threshold):

| Status | Days since last visit | Target per MR |
|--------|----------------------|---------------|
| **Healthy** | < 15 days | 2 doctors |
| **At-risk** | 15–29 days | 1–2 doctors |
| **Cold** | 30+ days | 1–2 doctors |

### Current distribution

**Rahul:**
- Healthy: Dr. Anil Mehta (~1 day), Dr. Sunita Verma (~3 days)
- At-risk: Dr. Pradeep Joshi (~18 days), Dr. Kavita Rao (~22 days)
- Cold: Dr. Ramesh Patil (~35 days)

**Priya:**
- Healthy: Dr. Meena Shah (~1 day)
- At-risk: Dr. Vikram Desai (~25 days)
- Cold: Dr. Rajesh Kapoor (~35 days), Dr. Anita Patel (~55 days)

**Robert:**
- Healthy: Dr. Neha Sharma (~2 days), Dr. Suresh Kumar (~4 days)
- At-risk: Dr. Amit Gupta (~15 days), Dr. Pooja Singh (~29 days)
- Cold: Dr. Rakesh Mishra (~40 days)

## Checklist for Updating Seed Data

When modifying seed data, verify all of these:

1. **Name consistency** — Doctor names in `dcr`, `follow_up_tasks`, `adverse_events`, `rcpa`, and `nba_recommendations` must exactly match `doctor_profiles.name`. Use full names (e.g. "Dr. Anil Mehta", not "Dr. Mehta").

2. **Territory alignment** — Each MR's DCR entries should only reference doctors and pharmacies from their territory. Cross-territory references break NBA recommendations and pre-call briefings.

3. **Date distribution** — Maintain a mix of healthy/at-risk/cold doctors (see table above). All dates use `CURRENT_DATE - N` so they stay relative. Don't make all visits recent — that prevents Visit Coverage from demonstrating cold/at-risk states.

4. **DCR ID stability** — INSERT order determines auto-generated IDs. `seed_demo_data.sql` references specific DCR IDs (e.g. DCR 19 = Robert's Dr. Neha Sharma/Derise10). Don't reorder INSERTs without updating ID references.

5. **RCPA pharmacy names** — Must match `pharmacy_profiles.name` for the correct territory. Robert's pharmacies are Delhi NCR (MedPlus, Apollo, etc.), not Mumbai (CVS, Walgreens).

6. **Products** — Only use the 9 seeded products: Derise 10mg/20mg/50mg, Rilast Tablet/Capsule/Syrup, Bevaas 5mg/10mg/20mg.

7. **Static NBA fallback** — `backend/routes/ai.js` → `getStaticNBA()` has hardcoded doctor/pharmacy names. Update if names change.

8. **seed_doctors.sql TRUNCATEs** — Re-running `seed_doctors.sql` wipes all doctor_profiles, including doctors created via the approval workflow. Only re-run during a full re-seed, not for incremental updates.

9. **knowledge_chunks (rechunk.js)** — After seeding, run `node backend/scripts/rechunk.js` with `GEMINI_API_KEY` set. This is NOT a SQL file — it's a Node script that chunks `drug_knowledge` rows and computes embeddings. Without it, the chatbot/RAG features return empty results.

## Quick Verification Queries

```sql
-- Check all DCR doctors match doctor_profiles
SELECT d.name, d.user_id, dp.name IS NOT NULL AS has_profile
FROM (SELECT DISTINCT name, user_id FROM dcr) d
LEFT JOIN doctor_profiles dp ON dp.name = d.name
ORDER BY d.user_id;

-- Check visit recency distribution (Visit Coverage demo)
SELECT name, user_id,
  (CURRENT_DATE - MAX(date)) AS days_since,
  CASE
    WHEN (CURRENT_DATE - MAX(date)) >= 30 THEN 'COLD'
    WHEN (CURRENT_DATE - MAX(date)) >= 15 THEN 'AT-RISK'
    ELSE 'HEALTHY'
  END AS status
FROM dcr
GROUP BY name, user_id
ORDER BY user_id, days_since DESC;

-- Check RCPA pharmacies match pharmacy_profiles
SELECT DISTINCT r.pharmacy, r.user_id, pp.name IS NOT NULL AS has_profile
FROM rcpa r
LEFT JOIN pharmacy_profiles pp ON pp.name = r.pharmacy
ORDER BY r.user_id;
```
