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

**Note:** `seed.sql` and `dummy_data.sql` both insert into the same `dcr` table. `seed.sql` TRUNCATEs first, so if run after `dummy_data.sql` it replaces the data. For demos, run only one of them (seed.sql is recommended as it's lighter).

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
