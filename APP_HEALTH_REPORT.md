# ZenApp — Full App Health Report: Disconnected Features & Missing Backend APIs

## Context
ZenApp is a pharmaceutical SFA (Sales Force Automation) platform with an Express.js backend (PostgreSQL) and React frontend. The app has ~30 routes, 49 components, 12 backend route modules, and 9 AI features. This report identifies all components where the UI exists but backend integration is missing or broken.

---

## CATEGORY 1: Backend API Exists But Frontend Doesn't Call It (HIGH PRIORITY)

These are the worst offenders — the backend work is done but the frontend ignores it.

### 1. EnterRcpa.tsx — RCPA Data Entry
- **Backend:** `POST /api/rcpa` and `GET /api/rcpa` are fully implemented in `backend/routes/rcpa.js`
- **Problem:** Component saves all data to `localStorage` only. Never calls `apiPost('/api/rcpa', ...)`. Data is lost if browser storage is cleared.
- **Fix:** Replace localStorage save with `apiPost('/api/rcpa', payload)` in `handleSave()`, and load history via `apiGet('/api/rcpa?user_id=...')`

### 2. Profile.tsx — User Profile
- **Backend:** `AuthContext` provides real user data (`name`, `email`, `user_id`, `territory`, `role`) from `/api/auth/me`
- **Problem:** Component uses a hardcoded `userProfile` object with fake data ("Robert Johnson", "MR-2024-001"). The `userName` prop is passed in but never used.
- **Fix:** Replace hardcoded object with `useAuth()` hook data

---

## CATEGORY 2: Frontend UI Exists But No Backend API At All (17 Components)

These components render UI with hardcoded/dummy data and have zero backend endpoints to support them.

### Core SFA Features (Business-Critical)

| # | Component | Route | What It Does | Backend API Needed |
|---|-----------|-------|--------------|--------------------|
| 1 | **TourPlans.tsx** | `tour-plans` | Calendar-based monthly/weekly tour planning | `GET/POST/PATCH /api/tour-plans` |
| 2 | **TourPlanModal.tsx** | (modal in TourPlans) | Form to create/edit a tour plan entry | (same as above) |
| 3 | **TourPlanRequests.tsx** | `tour-plan-requests` | Manager approval of MR tour plans | `GET/PATCH /api/tour-plan-requests` |
| 4 | **Leaves.tsx** | `leaves` | Leave calendar and application | `GET/POST /api/leaves` |
| 5 | **ApplyLeaveModal.tsx** | (modal in Leaves) | Leave application form | (same as above) |
| 6 | **ExpenseClaim.tsx** | `expense-claim` | View expense claims with status | `GET /api/expense-claims` |
| 7 | **CreateExpenseClaim.tsx** | `create-expense-claim` | Create expense claims with auto-calculations | `POST /api/expense-claims` |
| 8 | **OrderBooking.tsx** | `order-booking` | Book orders for doctors/pharmacies (uses localStorage) | `GET/POST /api/orders` |
| 9 | **Samples.tsx** | `inventory` | Sample/inventory management | `GET/PATCH /api/samples` |
| 10 | **Reports.tsx** | `reports` | Tour plan, daily call, coverage, call average reports (all Chart.js with hardcoded data) | `GET /api/reports/:type` |

### Manager/Team Features

| # | Component | Route | What It Does | Backend API Needed |
|---|-----------|-------|--------------|--------------------|
| 11 | **MRList.tsx** | `mr-list` | List all MRs with search/filter (6 hardcoded MRs) | `GET /api/users?role=mr` (could reuse existing users table) |
| 12 | **MRDetail.tsx** | `mr-detail` | Detailed MR analytics — sales, visits, commissions (all hardcoded charts) | `GET /api/users/:id/performance` (aggregate from existing DCR/sales data) |

### Client/Doctor Features

| # | Component | Route | What It Does | Backend API Needed |
|---|-----------|-------|--------------|--------------------|
| 13 | **Doctor360.tsx** | `doctor360` | 360-degree view — interaction history, call frequency, samples given (hardcoded) | `GET /api/doctors/:id/360` (aggregate from existing DCR/RCPA data) |
| 14 | **HomeReports.tsx** | (embedded in Home) | Dashboard charts — call average, POB, budget (hardcoded Chart.js) | `GET /api/dashboard/summary` |

### Content & Misc

| # | Component | Route | What It Does | Backend API Needed |
|---|-----------|-------|--------------|--------------------|
| 15 | **EDetailing.tsx** | `edetailing` | Medical education videos/PDFs (12 hardcoded items) | `GET /api/edetailing` |
| 16 | **TodaysPlan.tsx** | (legacy, replaced by NBA) | Today's planned visits (7 hardcoded plans) | Already replaced by NextBestAction — consider removing |
| 17 | **OfflineRequests.tsx** | `offline-requests` | Empty state, no implementation | `GET /api/offline-requests` |

---

## CATEGORY 3: Dead/Orphaned Code

### PostCallReview.tsx
- **Status:** Component exists with full UI (modal for reviewing AI-extracted DCR data) but is **never imported anywhere**
- **Context:** DCR.tsx flow goes: Speech -> AI Extract -> Auto-fill form -> Confirm -> Submit. The PostCallReview step was designed but never wired in.
- **Decision needed:** Either integrate into DCR flow (Speech -> Extract -> **Review Modal** -> Submit) or delete the dead code

---

## CATEGORY 4: Partially Working Features (Minor Issues)

### DCR.tsx — Daily Call Report
- **Status:** Fully connected to backend (`POST /api/dcr`), speech recording works, AI extraction works
- **Minor gap:** PostCallReview modal is skipped — AI-extracted data auto-fills the form without a dedicated review step
- **Impact:** Low — users can still review/edit in the form before confirming

### NextBestAction.tsx / TodaysPlanBanner.tsx
- **Status:** Connected to `/api/ai/nba/:userId` and `/api/ai/pharmacy-briefing`
- **Minor gap:** Falls back to static recommendations when no historical data exists (by design)

---

## CATEGORY 5: Features That ARE Fully Working

For completeness, these features are fully connected end-to-end:

| Component | Backend Endpoints | Status |
|-----------|-------------------|--------|
| Login / AuthContext | `/api/auth/login`, `/api/auth/me` | Fully working |
| DCR.tsx | `/api/dcr`, `/api/ai/precall-briefing` | Fully working |
| MyDCRs.tsx | `/api/dcr?user_id=` | Fully working |
| FollowUpTasks.tsx | `/api/tasks` | Fully working |
| DoctorManagement.tsx | `/api/doctors`, `/api/doctor-requests` | Fully working |
| Clients.tsx | `/api/doctors` | Fully working |
| AdverseEvents.tsx | `/api/adverse-events` | Fully working |
| KnowledgeUpload.tsx | `/api/knowledge/*` | Fully working |
| Chatbot.tsx | `/api/knowledge/chat` | Fully working |
| SalesDashboard.tsx | `/api/sales/*` (5 endpoints) | Fully working |
| SalesEntry.tsx | `/api/sales`, `/api/sales/distributors` | Fully working |
| SalesUpload.tsx | `/api/sales/upload`, `/api/targets/upload` | Fully working |
| SalesTargets.tsx | `/api/targets`, `/api/products` | Fully working |
| NextBestAction.tsx | `/api/ai/nba/:userId` | Fully working |
| TerritoryGap.tsx | `/api/ai/territory-gap/:userId` | Fully working |
| ManagerInsights.tsx | `/api/ai/manager-query`, `/api/ai/product-signals`, `/api/ai/competitor-intel` | Fully working |
| DashboardReports.tsx | `/api/dcr`, `/api/rcpa`, `/api/tasks` | Fully working |
| ManagerDashboardReports.tsx | `/api/dcr`, `/api/doctor-requests/stats`, `/api/adverse-events/stats` | Fully working |
| ManagerPulseBanner.tsx | `/api/dcr`, `/api/doctor-requests/stats`, `/api/adverse-events/stats` | Fully working |

---

## Summary Statistics

| Category | Count | Impact |
|----------|-------|--------|
| Backend exists, frontend ignores it | 2 | HIGH — wasted backend work, data not persisted |
| UI exists, no backend at all | 17 | HIGH — entire features are non-functional |
| Dead/orphaned code | 1 | LOW — cleanup needed |
| Partially working | 2 | LOW — minor UX gaps |
| Fully working | 19 | N/A — no action needed |

**Total features needing work: 20 out of ~39 routed features (~51%)**

---

## Recommended Priority Order

### Phase 1 — Quick Wins (use existing backend data/APIs)
1. **Profile.tsx** — Wire to AuthContext
2. **EnterRcpa.tsx** — Replace localStorage with existing `/api/rcpa` calls
3. **MRList.tsx** — Query existing `users` table with `role=mr` filter
4. **MRDetail.tsx** — Aggregate from existing DCR + sales + tasks tables
5. **Doctor360.tsx** — Aggregate from existing DCR + RCPA + doctor_profiles tables
6. **HomeReports.tsx** — Aggregate from existing DCR + sales + tasks tables

### Phase 2 — New Backend APIs Required
7. **Tour Plans** (TourPlans, TourPlanModal, TourPlanRequests) — New `tour_plans` table + CRUD + approval workflow
8. **Leaves** (Leaves, ApplyLeaveModal) — New `leaves` table + CRUD
9. **Expense Claims** (ExpenseClaim, CreateExpenseClaim) — New `expense_claims` table + CRUD
10. **Order Booking** — New `orders` table + CRUD
11. **Samples/Inventory** — New `sample_inventory` table + CRUD
12. **Reports** — New aggregation endpoints from existing data
13. **EDetailing** — New `edetailing_content` table + CRUD

### Phase 3 — Cleanup
14. **PostCallReview.tsx** — Integrate into DCR flow or remove
15. **TodaysPlan.tsx** — Remove (replaced by NextBestAction)
16. **OfflineRequests.tsx** — Implement or remove placeholder

---

## CATEGORY 6: AI Cost Management — Caching Strategy

### Current State
- **11 AI-powered endpoints** making LLM calls (all default to Claude Haiku 4.5, 2048 max tokens, temp 0.3)
- **Only 1 endpoint has caching today:** NBA (`nba_recommendations` table, per-user per-day)
- **Knowledge embeddings** are cached permanently in `knowledge_chunks.embedding` (pgvector)
- **All other AI endpoints regenerate on every request** — no caching at all

### AI Endpoints: Caching Classification

#### DO NOT CACHE (unique per request)
| Endpoint | Why | Cost Level |
|----------|-----|------------|
| `POST /ai/manager-query` | Free-text query — every question is different | **HIGH** (up to 300 DCRs in context) |
| `POST /ai/post-call-extract` | Each transcript is unique | **Variable** |
| `POST /knowledge/chat` | Conversational, session-dependent (already 2 LLM calls/msg) | **HIGH** |
| AE Detection (background) | One-time per DCR creation, results stored in `adverse_events` table | **Low** (already effectively cached) |

#### SHOULD CACHE (data changes slowly, same inputs frequent)

| Endpoint | Cache Key | Suggested TTL | Invalidation Trigger | Est. Cost Savings |
|----------|-----------|---------------|----------------------|-------------------|
| `POST /ai/precall-briefing` | `user_id + doctor_name + date` | **Same-day** (reset at midnight) | New DCR for that doctor | **High** — MRs often re-open briefing for same doctor |
| `POST /ai/pharmacy-briefing` | `user_id + pharmacy_name + week` | **7 days** | New RCPA entry for that pharmacy | **High** — pharmacy data changes monthly |
| `GET /ai/territory-gap/:user_id` | `user_id + date` | **4 hours** | New DCR by that user | **Medium** — checked a few times per day |
| `GET /ai/product-signals` | `filter_hash(dates + user_ids + products)` | **6 hours** | New DCR entries | **Medium** — managers check periodically |
| `GET /ai/competitor-intel` | `filter_hash(dates + user_ids)` | **12 hours** | New DCR/RCPA with competitor mentions | **Medium-High** — trends are slow-moving |
| `GET /ai/nba/:user_id` | `user_id + date` | **Daily** (already implemented) | Manual `refresh=true` param | Already cached |

### Recommended Caching Implementation

#### Database Cache Table (Recommended — consistent with NBA pattern)
```sql
CREATE TABLE ai_cache (
  id SERIAL PRIMARY KEY,
  cache_key VARCHAR(255) UNIQUE NOT NULL,  -- e.g., "precall:user5:DrSmith:2026-03-21"
  endpoint VARCHAR(100) NOT NULL,
  response JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP NOT NULL,
  invalidated BOOLEAN DEFAULT FALSE
);
CREATE INDEX idx_ai_cache_key ON ai_cache(cache_key);
CREATE INDEX idx_ai_cache_expires ON ai_cache(expires_at);
```

#### Cache Lookup Flow (middleware or per-route)
1. Build cache key from request params
2. `SELECT response FROM ai_cache WHERE cache_key = $1 AND expires_at > NOW() AND NOT invalidated`
3. If hit -> return cached response with `cached: true` flag
4. If miss -> call LLM -> store result -> return

#### Invalidation Policy
| Trigger Event | Invalidate These Caches |
|---------------|------------------------|
| New DCR created | `precall:*:doctorName:*`, `territory-gap:userId:*`, `product-signals:*`, `competitor-intel:*` |
| New RCPA entry | `pharmacy-briefing:*:pharmacyName:*`, `competitor-intel:*` |
| Manual refresh | User clicks refresh button -> bypass cache for that endpoint |
| TTL expiry | Automatic — `expires_at` column handles this |
| Nightly cleanup | `DELETE FROM ai_cache WHERE expires_at < NOW() - INTERVAL '7 days'` |

### Cost Projections

**Assumptions:** 20 MRs, 3 managers, ~50 AI calls/day across all endpoints

| Scenario | Daily LLM Calls | Est. Monthly Cost (Haiku) |
|----------|-----------------|---------------------------|
| **No caching (current)** | ~50 calls/day | ~$15-25/month |
| **With caching (proposed)** | ~20-25 calls/day | ~$6-12/month |
| **Savings** | ~50% fewer calls | **~$10-15/month saved** |

The bigger win is **latency** — cached responses return in <50ms vs 2-5s for LLM calls. This significantly improves UX for:
- Pre-call briefings (MRs checking same doctor multiple times before a visit)
- Territory gap (MRs reviewing coverage throughout the day)
- Product signals & competitor intel (managers reviewing same dashboard repeatedly)

### Additional Cost Controls
1. **Rate limiting per user** — Cap AI calls per user per hour (e.g., 20/hr for MRs, 50/hr for managers)
2. **Token budget tracking** — Log token usage per endpoint in a `ai_usage_log` table for cost monitoring
3. **Model tiering** — Use Haiku for all routine analysis (current), reserve Sonnet/Opus for complex manager queries only
4. **Frontend debouncing** — Prevent rapid re-fetching of same AI endpoint (already partially done with loading states)
