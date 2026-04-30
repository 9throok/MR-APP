# ZenApp — Claude Project Guide

Fast-loading orientation file for Claude Code sessions. Keep concise. Update on phase exit.

## What this is

Pharma Sales Force Automation (SFA) platform with 9 AI features, evolving into a Veeva-class life-sciences suite (CRM + CLM/MLR + Compliance + Medical Affairs + HCP data).

**Active strategic plan:** `/Users/apple/.claude/plans/study-the-readmes-and-graceful-ladybug.md`
**Active phase: Phase B COMPLETE (Weeks 1, 2, 3).** Phase A complete (A.1–A.8). Phase B shipped end-to-end: 6 new DB tables + 1 daily cache table + 3 backend routes + 3 AI features + 2 new frontend pages + EDetailing.tsx rewiring. **Next: Phase C** (Compliance + Medical Affairs + HCP Master Data).

Phase B Week 3 frontend deliverables (just landed):
- [frontend/src/components/ContentLibrary.tsx](frontend/src/components/ContentLibrary.tsx) — admin/manager: list assets, upload new asset (multipart), open detail with version history + per-version MLR decisions + claim counts + AI pre-review summaries, Submit for MLR / Publish (admin) / Distribute-to-all action buttons.
- [frontend/src/components/MLRReviewQueue.tsx](frontend/src/components/MLRReviewQueue.tsx) — role-filtered queue (medical / legal / regulatory), open detail with file link + AI pre-review findings + other reviewers' decisions + extracted claims, decision form (approved / changes_requested / rejected) with required notes for non-approved.
- [frontend/src/components/EDetailing.tsx](frontend/src/components/EDetailing.tsx) — fetches published content from `/api/content` and merges with the existing demo content; per-page (PDF), per-session (video), per-session (HTML) view events fire-and-forget POST to `/api/content-views`.
- [frontend/src/App.tsx](frontend/src/App.tsx) — Page enum + renderer extended with `content-library` and `mlr-queue` routes.
- [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx) — Content Library link in manager/admin block; MLR Queue link in admin block + new isReviewer block (medical/legal/regulatory roles).
- [frontend/src/contexts/AuthContext.tsx](frontend/src/contexts/AuthContext.tsx) — User type extended with the 3 reviewer roles.

## Stack

- **Backend:** Node + Express 4 + Postgres 16 (with pgvector). Routes in [backend/routes/](backend/routes/), services in [backend/services/](backend/services/), prompts in [backend/prompts/](backend/prompts/), migrations in [backend/db/](backend/db/).
- **Frontend:** React 19 + Vite + TypeScript. UI components flat under [frontend/src/components/](frontend/src/components/).
- **Auth:** JWT + bcrypt; roles `mr` / `manager` / `admin` enforced in [backend/middleware/auth.js](backend/middleware/auth.js).
- **LLM:** provider factory in [backend/services/llm/](backend/services/llm/) — supports gemini / openai / groq / anthropic.
- **Embeddings:** Gemini `text-embedding-004` (768 dims) for RAG.

## Where things live (the map you'd otherwise re-discover)

- **Server entry + route registration:** [backend/server.js](backend/server.js)
- **DB migrations:** numbered `migration_v*.sql` in [backend/db/](backend/db/); apply in order per [backend/db/SEED_DATA_GUIDE.md](backend/db/SEED_DATA_GUIDE.md). Latest: `migration_v6_sales.sql`. Next migration should be `migration_v7_*`.
- **Hybrid RAG (FTS + pgvector + RRF):** [backend/services/knowledgeSearch.js](backend/services/knowledgeSearch.js) + [chunker.js](backend/services/chunker.js) + [embeddings.js](backend/services/embeddings.js)
- **Async background-scan pattern (clone for new background AI):** [backend/services/aeDetection.js](backend/services/aeDetection.js)
- **Approval-workflow pattern (clone for tour-plan / expense / leave / MLR approvals):** [backend/routes/doctor-requests.js](backend/routes/doctor-requests.js)
- **Sidebar nav (every user-visible page):** [frontend/src/components/Sidebar.tsx](frontend/src/components/Sidebar.tsx)
- **API tests:** [backend/test.sh](backend/test.sh) — append new endpoints when adding routes.

## Conventions (non-obvious — saved so we don't re-derive)

- Every new table from Phase A onwards needs `org_id uuid NOT NULL` + RLS policy (multi-tenant).
- AI features cache when expensive (NBA caches daily per MR with `UNIQUE (user_id, date)` — follow that pattern).
- File uploads use Multer (see [backend/routes/knowledge.js](backend/routes/knowledge.js) for the canonical setup).
- All routes except `/api/auth/*` and `/health` are JWT-protected via `authenticateToken` middleware.
- pgvector is **optional** — code falls back to FTS-only if the extension is missing. Don't break that fallback.
- **Frontend is a PWA** (Phase A.7+): service worker via [vite-plugin-pwa](frontend/vite.config.ts) precaches the SPA shell, NetworkFirst for `/api/` GETs, CacheFirst for assets. Writes (POST/PATCH/PUT/DELETE) queue to IndexedDB when offline ([utils/offlineQueue.ts](frontend/src/utils/offlineQueue.ts)) and auto-replay on reconnect via [services/apiService.ts](frontend/src/services/apiService.ts). Multipart uploads ([apiUpload](frontend/src/services/apiService.ts)) are NOT queued — they require a live connection. The connectivity banner + install prompt live in [components/OfflineIndicator.tsx](frontend/src/components/OfflineIndicator.tsx).

## Implemented inventory (refresh on each phase exit)

**Backend routes registered in [server.js](backend/server.js) (20):** auth, dcr, ai, products, tasks, knowledge, adverse-events, doctors, doctor-requests, rcpa, sales, targets, tour-plans, expenses, leaves, orders, samples, content, mlr, content-views.

**AI features (9 prompts in [backend/prompts/](backend/prompts/)):** preCallBriefing, postCallExtraction, territoryGap, managerQuery, productSignals, nextBestAction, clinicalChat, aeDetection, competitorIntel.

**DB tables (35):** organizations, products, dcr, users, follow_up_tasks, drug_knowledge, knowledge_chunks, chat_sessions, chat_messages, adverse_events, doctor_profiles, doctor_requests, nba_recommendations, rcpa, pharmacy_profiles, distributors, secondary_sales, mr_targets, tour_plans, tour_plan_visits, expense_claims, expense_line_items, leaves, leave_balances, orders, order_line_items, sample_stock, sample_movements, content_assets, content_versions, mlr_reviews, content_distributions, content_views, content_claims, content_recommendations. Every tenant table has `org_id uuid NOT NULL` (FK → organizations.id) since `migration_v7_multitenancy.sql`.

**Frontend-only stubs (Phase A targets — UI exists, no API/DB):**
- Daily Tour Plans backend ✓ shipped (A.2). Frontend ([TourPlans.tsx](frontend/src/components/TourPlans.tsx)) still uses local state — wiring it to `/api/tour-plans` is a follow-up.
- Quarterly STP/MTP requests ([TourPlanRequests.tsx](frontend/src/components/TourPlanRequests.tsx)) — separate feature, deferred to Phase A.x.
- Expense Claims backend ✓ shipped (A.3). Frontend ([ExpenseClaim.tsx](frontend/src/components/ExpenseClaim.tsx), [CreateExpenseClaim.tsx](frontend/src/components/CreateExpenseClaim.tsx)) still hardcoded — wiring to `/api/expenses` is a follow-up.
- Leaves backend ✓ shipped (A.4). Frontend ([Leaves.tsx](frontend/src/components/Leaves.tsx), [ApplyLeaveModal.tsx](frontend/src/components/ApplyLeaveModal.tsx)) still hardcoded — wiring to `/api/leaves` is a follow-up.
- Order Booking backend ✓ shipped (A.5). Frontend ([OrderBooking.tsx](frontend/src/components/OrderBooking.tsx)) still uses localStorage — wiring to `/api/orders` is a follow-up.
- Sample Inventory backend ✓ shipped (A.6) — `/api/samples/stock`, `/api/samples/movements`, `/api/samples/allocate|return|adjust`. **DCR auto-debit hook**: every DCR with `samples` array auto-writes `distribution` movements via [services/sampleDistribution.js](backend/services/sampleDistribution.js), debiting the MR's stock FEFO. Frontend ([Samples.tsx](frontend/src/components/Samples.tsx)) still hardcoded — wiring is a follow-up.
- Reports (`Reports.tsx` — Chart.js with hardcoded data)
- MR List / MR Detail (`MRList.tsx`, `MRDetail.tsx` — hardcoded MRs)
- See [docs/APP_HEALTH_REPORT.md](docs/APP_HEALTH_REPORT.md) for the full disconnected-feature audit.

**In-flight on current branch:** Phase A complete. RLS policies are PERMISSIVE for now (strict enforcement deferred until `db.query()` is refactored to per-request clients with `SET LOCAL app.org_id`). Tenant isolation today comes from app-level `WHERE org_id = $1` filtering in every route.

## Phased roadmap (one-liners — see plan file for detail)

- **Phase 0** — docs hygiene: this file + slim README + move legacy docs.
- **Phase A** — finish SFA stubs (tour plans, expenses, leaves, orders, samples) + multi-tenancy retrofit + PWA.
- **Phase B** — CLM/MLR content engine: content library, MLR approval workflow, AI claim substantiation, view tracking.
- **Phase C** — Compliance (audit log, consent, sample chain-of-custody, regulatory docs) + Medical Affairs (medical queries, KOLs) + HCP master data layer.

## Out of scope (don't waste cycles)

- Salesforce sync / AppExchange listing
- Native iOS / Android apps (PWA only)
- Full Veeva Vault (R&D-grade DMS, eSignature, regulatory submissions)
- Clinical trials / CTMS / patient data / site monitoring
- Drug supply chain / serialization

## Setup pointers

- **Local dev / docker / migrations / seed sequence / default logins:** [backend/SETUP.md](backend/SETUP.md) (canonical)
- **Migration + seed execution order:** [backend/db/SEED_DATA_GUIDE.md](backend/db/SEED_DATA_GUIDE.md)
- **Feature inventory (every page + endpoint + AI prompt):** [FEATURES.md](FEATURES.md)
- **AI feature deep-dive / sales narrative:** [AI_FEATURES_REPORT.md](AI_FEATURES_REPORT.md)
- **Disconnected-feature audit (drives Phase A scope):** [docs/APP_HEALTH_REPORT.md](docs/APP_HEALTH_REPORT.md)
