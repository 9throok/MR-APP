# ZenApp - Complete Feature List

## Core App Features

| # | Feature | Frontend Page | Backend Route |
|---|---------|--------------|---------------|
| 1 | JWT Login/Register | Login.tsx | `POST /api/auth/login`, `/register`, `/me` |
| 2 | Home Dashboard | Home.tsx | — |
| 3 | Daily Call Report (DCR) | DCR.tsx | `POST /api/dcr` |
| 4 | My DCRs | MyDCRs.tsx | `GET /api/dcr` |
| 5 | Clients | Clients.tsx | — |
| 6 | Doctor 360 | Doctor360.tsx | — |
| 7 | Today's Plan | TodaysPlan.tsx | — |
| 8 | Tour Plans | TourPlans.tsx | — |
| 9 | Tour Plan Requests | TourPlanRequests.tsx | — |
| 10 | E-Detailing | EDetailing.tsx | — |
| 11 | Leaves | Leaves.tsx | — |
| 12 | Samples/Inventory | Samples.tsx | — |
| 13 | Expense Claims | ExpenseClaim.tsx | — |
| 14 | Create Expense Claim | CreateExpenseClaim.tsx | — |
| 15 | Enter RCPA | EnterRcpa.tsx | — |
| 16 | Order Booking | OrderBooking.tsx | — |
| 17 | Reports | Reports.tsx | — |
| 18 | Profile | Profile.tsx | — |
| 19 | MR List (Manager) | MRList.tsx | — |
| 20 | MR Detail (Manager) | MRDetail.tsx | — |
| 21 | Offline Requests | OfflineRequests.tsx | — |
| 22 | Doctor Management | DoctorManagement.tsx | `CRUD /api/doctors` |
| 23 | Follow-up Tasks | FollowUpTasks.tsx | `GET/PATCH /api/tasks` |
| 24 | Knowledge Base Upload | KnowledgeUpload.tsx | `POST/GET/DELETE /api/knowledge` |
| 25 | Speech Recording | SpeechRecorder.tsx | — (browser API) |

---

## AI Features (8 total)

### V1 AI Features (Original)

| # | AI Feature | Where in UI | Backend Endpoint | Prompt File |
|---|-----------|-------------|-----------------|-------------|
| 1 | **Pre-Call Briefing** | Inside DCR page (auto-loads when doctor selected) | `POST /api/ai/precall-briefing` | `prompts/preCallBriefing.js` |
| 2 | **Territory Gap Analysis** | Sidebar → "Territory Gap" | `GET /api/ai/territory-gap/:user_id` | `prompts/territoryGap.js` |
| 3 | **Manager Query** | Sidebar → "Manager Insights" (query tab) | `POST /api/ai/manager-query` | `prompts/managerQuery.js` |
| 4 | **Product Signals** | Sidebar → "Manager Insights" (signals tab) | `GET /api/ai/product-signals` | `prompts/productSignals.js` |

### V2 AI Features (New)

| # | AI Feature | Where in UI | Backend Endpoint | Prompt File |
|---|-----------|-------------|-----------------|-------------|
| 5 | **Post-Call Extraction** | DCR page (PostCallReview modal) | `POST /api/ai/post-call-extract` | `prompts/postCallExtraction.js` |
| 6 | **Clinical Assistant Chatbot** | Floating chat widget (bottom-right, always visible) | `POST /api/knowledge/chat` | `prompts/clinicalChat.js` |
| 7 | **Adverse Event Detection** | Auto-runs on DCR submit; dashboard at Sidebar → "Adverse Events" | Background scan + `GET/PATCH /api/adverse-events` | `prompts/aeDetection.js` |
| 8 | **Next Best Action (NBA)** | Sidebar → "AI Plan" | `GET /api/ai/nba/:user_id` | `prompts/nextBestAction.js` |

---

## AI Feature Details

### 1. Pre-Call Briefing
Automatically generates a briefing when an MR selects a doctor in the DCR form. Analyzes past visit history and provides:
- Summary of relationship
- Last visit details
- Pending items (amber)
- Talking points (green)
- Watch out warnings (red)

### 2. Territory Gap Analysis
Identifies coverage gaps in an MR's territory by analyzing visit frequency per doctor. Highlights doctors who haven't been visited recently and prioritizes follow-ups.

### 3. Manager Query
Free-text natural language query interface for managers. Analyzes team DCR data to answer questions like "Which MR has the highest conversion rate?" or "What products are underperforming in Mumbai?"

### 4. Product Signals
Aggregates product-level statistics from DCR data and surfaces performance signals — what's working, what isn't, and emerging trends.

### 5. Post-Call Extraction
Takes raw call transcript/notes and extracts structured data: products discussed, samples dropped, doctor feedback, sentiment, follow-up tasks, and competitor mentions. MR reviews before saving as DCR.

### 6. Clinical Assistant Chatbot
Knowledge-grounded chatbot that answers drug-related questions from uploaded text files. Uses PostgreSQL full-text search (GIN index) to find relevant content, then injects as LLM context. Only answers from the knowledge base — says "I don't know" otherwise.

### 7. Adverse Event Detection
NLP layer that auto-scans DCR call notes for potential adverse events after every DCR submission. Runs asynchronously (non-blocking — never slows submission). Flagged AEs appear on a pharmacovigilance dashboard for review (confirm/dismiss).

### 8. Next Best Action (NBA)
Generates a prioritized daily visit plan for each MR. Considers doctor profiles, visit history, pending tasks, and territory data. Returns ranked recommendations with talking points and priority levels. Results are cached daily per MR.

---

## Tech Stack

- **Backend:** Express.js + PostgreSQL (pg pool)
- **Frontend:** React 19 + Vite + TypeScript
- **Auth:** JWT (jsonwebtoken) + bcrypt
- **AI:** Multi-LLM provider factory (OpenAI, Groq, Anthropic, Gemini)
- **Search:** PostgreSQL full-text search (GIN index)
- **File Upload:** Multer
- **Containerization:** Docker + docker-compose

---

## Database Tables (8 total)

| Table | Purpose |
|-------|---------|
| `products` | Product catalog |
| `dcr` | Daily Call Reports |
| `users` | JWT auth with roles (mr, manager, admin) |
| `follow_up_tasks` | Post-call follow-up tracking |
| `drug_knowledge` | Knowledge base with full-text search |
| `adverse_events` | Pharmacovigilance AE records |
| `doctor_profiles` | Doctor CRM with tier/specialty |
| `nba_recommendations` | Cached daily AI visit plans |
