# ZenApp V2 - AI Features & JWT Auth

## What was built

### Phase 0: JWT Authentication
- `backend/middleware/auth.js` — JWT verify + role-based access control
- `backend/routes/auth.js` — Login, register, /me endpoints
- `frontend/src/contexts/AuthContext.tsx` — React auth state management
- `frontend/src/services/apiService.ts` — Fetch wrapper with auto JWT headers
- Updated `frontend/src/components/Login.tsx` — Real API authentication

### Phase 1: AI Post-Call Automation
- `backend/prompts/postCallExtraction.js` — LLM prompt for transcript extraction
- `POST /api/ai/post-call-extract` endpoint in `backend/routes/ai.js`
- `backend/routes/tasks.js` — Follow-up tasks CRUD
- `frontend/src/components/PostCallReview.tsx` — AI extraction review modal
- `frontend/src/components/FollowUpTasks.tsx` — Task management page

### Phase 2: Clinical Assistant Chatbot (Enhanced RAG Pipeline)
- `backend/services/knowledgeSearch.js` — Hybrid search: FTS + pgvector semantic similarity with RRF scoring
- `backend/services/chunker.js` — Section-aware document chunking (~300 tokens) with auto medicine tag extraction
- `backend/services/embeddings.js` — Gemini text-embedding-004 (768 dims) for semantic search
- `backend/services/chatMemory.js` — Conversation session & message persistence
- `backend/services/queryRewriter.js` — LLM-powered query rewriting for follow-up questions
- `backend/services/queryPreprocessor.js` — Pharma synonym expansion (50+ medical term mappings)
- `backend/prompts/clinicalChat.js` — Knowledge-grounded LLM prompt with conversation history support
- `backend/routes/knowledge.js` — File upload (auto-chunks + embeds), chat with session memory, sessions list
- `backend/scripts/rechunk.js` — One-time script to chunk + embed existing knowledge base
- `backend/db/migration_v3_rag.sql` — knowledge_chunks (pgvector), chat_sessions, chat_messages tables
- `frontend/src/components/KnowledgeUpload.tsx` — Admin file upload page
- Updated `frontend/src/components/Chatbot.tsx` — Now uses clinical API backend

### Phase 3: Adverse Event Detection
- `backend/prompts/aeDetection.js` — Pharmacovigilance screening prompt
- `backend/services/aeDetection.js` — Async AE scanner (non-blocking)
- `backend/routes/adverse-events.js` — AE list, stats, review
- Auto-scans every DCR submission via hook in `backend/routes/dcr.js`
- `frontend/src/components/AdverseEvents.tsx` — Pharmacovigilance dashboard

### Phase 4: NBA Engine
- `backend/prompts/nextBestAction.js` — Daily plan generation prompt
- `GET /api/ai/nba/:user_id` endpoint with daily caching
- `backend/routes/doctors.js` — Doctor profiles CRUD
- `frontend/src/components/NextBestAction.tsx` — AI plan page with ranked cards
- `frontend/src/components/DoctorManagement.tsx` — Doctor CRUD page

---

## Database: 6 new tables

All defined in `backend/db/migration_v2.sql`:

| Table | Purpose |
|-------|---------|
| `users` | JWT auth with roles (mr, manager, admin) |
| `follow_up_tasks` | Post-call follow-up tracking |
| `drug_knowledge` | Knowledge base with full-text search |
| `adverse_events` | Pharmacovigilance AE records |
| `doctor_profiles` | Doctor CRM with tier/specialty |
| `nba_recommendations` | Cached daily AI visit plans |

---

## Getting Started

```bash
# All commands run from the project root (zenapp-backend/)

# 1. Start Postgres + Backend in Docker
docker-compose -f backend/docker-compose.local.yml up -d

# 2. Seed base schema + dummy data (products, DCRs, etc.)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/dummy_data.sql

# 3. Run V2 migration (users, tasks, knowledge, AE, doctors, NBA tables)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/migration_v2.sql

# 4. Seed users (password: password123)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_users.sql

# 5. Seed doctor profiles
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_doctors.sql

# 6. Seed knowledge base (chatbot KB articles)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_knowledge.sql

# 7. Seed demo data (follow-up tasks, adverse events, varied DCR summaries)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < backend/db/seed_demo_data.sql

# 8. Install & start frontend
cd frontend && npm install && npm run dev

# 9. Login with: username "robert" / password "password123"
```

### Seeded Users

| Username | Password | Role | Name |
|----------|----------|------|------|
| rahul | password123 | mr | Rahul Sharma |
| priya | password123 | mr | Priya Patel |
| robert | password123 | mr | Robert Johnson |
| manager1 | password123 | manager | Vikram Singh |
| admin | password123 | admin | Admin User |

---

## New API Endpoints (14 total)

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login, returns JWT |
| GET | `/api/auth/me` | Get current user from token |

### Follow-up Tasks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks?user_id=X&status=pending` | List tasks |
| PATCH | `/api/tasks/:id` | Update task status |

### Knowledge Base & Clinical Chat
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/knowledge/upload` | Upload text file (admin/manager) |
| GET | `/api/knowledge?product_id=X` | List knowledge entries |
| DELETE | `/api/knowledge/:id` | Delete entry (admin/manager) |
| GET | `/api/knowledge/sessions` | List chat sessions for current user |
| POST | `/api/knowledge/chat` | Clinical assistant query (accepts `session_id` for conversation continuity) |

### Adverse Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adverse-events?status=pending` | List AEs |
| GET | `/api/adverse-events/stats` | Aggregate counts |
| PATCH | `/api/adverse-events/:id/review` | Confirm/dismiss AE |

### AI Features
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/post-call-extract` | Extract structured data from transcript |
| GET | `/api/ai/nba/:user_id` | Today's AI visit recommendations |

### Doctor Profiles
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors?tier=A&territory=X` | List doctors |
| POST | `/api/doctors` | Create doctor (manager/admin) |
| PATCH | `/api/doctors/:id` | Update doctor (manager/admin) |
| DELETE | `/api/doctors/:id` | Delete doctor (admin) |

---

## New npm packages

- `bcrypt` — Password hashing
- `jsonwebtoken` — JWT creation/verification
- `multer` — File upload handling

---

## Architecture Notes

- **AE detection is async/non-blocking** — runs after DCR save, never slows submission
- **Clinical assistant uses hybrid RAG** — combines FTS + pgvector semantic search via Reciprocal Rank Fusion (RRF). Documents are chunked (~300 tokens) with Gemini embeddings (768 dims). Conversation memory enables follow-up questions. Pharma synonym dictionary expands queries for better recall.
- **NBA results are cached daily** per MR (UNIQUE constraint on user_id + date)
- **All AI features use the existing `getLLMService()` factory pattern**
- **All routes are JWT-protected** except `/api/auth/*` and `/health`
- **pgvector optional** — if not installed, system gracefully falls back to FTS-only search
