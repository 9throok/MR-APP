# ZenApp Backend — Local Setup Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- An LLM API key (one of: Gemini, OpenAI, Groq, or Anthropic)
- **For semantic search (optional):** pgvector PostgreSQL extension — use `pgvector/pgvector:pg16` Docker image instead of `postgres:16` in your docker-compose file. If unavailable, the system falls back to FTS-only search.

## 1. Clone and configure

```bash
git clone <repo-url>
cd zenapp-backend

# Create your .env file from the template
cp .env.example .env
```

Open `.env` and set your LLM API key. Only the key matching `LLM_PROVIDER` is required:

```env
LLM_PROVIDER=gemini
LLM_MODEL=gemini-2.0-flash
GEMINI_API_KEY=your_actual_api_key_here
```

Supported providers:

| Provider | `LLM_PROVIDER` | Default model | Key env var |
|----------|----------------|---------------|-------------|
| Google Gemini | `gemini` | `gemini-2.0-flash` | `GEMINI_API_KEY` |
| OpenAI | `openai` | `gpt-4o` | `OPENAI_API_KEY` |
| Groq | `groq` | `llama-3.3-70b-versatile` | `GROQ_API_KEY` |
| Anthropic | `anthropic` | `claude-haiku-4-5-20251001` | `ANTHROPIC_API_KEY` |

> **Note:** For Groq, also set `LLM_BASE_URL=https://api.groq.com/openai/v1`

## 2. Start the containers

```bash
docker-compose -f docker-compose.local.yml up --build
```

This starts:
- **Postgres 16** on `localhost:5433` (container name: `zenapp-postgres`)
- **Node.js app** on `localhost:3001` (container name: `zenapp-backend-local`)

The database schema (`db/schema.sql`) is automatically applied on first start.

## 3. Run migrations and seed the database

Run these commands **in order** from the `backend/` directory:

```bash
# Step 1: Base data — products + DCR records
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/dummy_data.sql

# Step 2: V2 migration — users, follow_up_tasks, drug_knowledge, adverse_events,
#         doctor_profiles, nba_recommendations tables
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v2.sql

# Step 3: Seed users (MRs, manager, admin — default password: password123)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_users.sql

# Step 4: Seed doctor profiles
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_doctors.sql

# Step 5: Seed clinical knowledge base (drug info, trials, FAQs, safety data)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_knowledge.sql

# Step 6: Seed demo data for V2 features (follow-up tasks, adverse events)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_demo_data.sql

# Step 7: V3 migration — RCPA (prescription audit) table
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v3.sql

# Step 8: Seed RCPA dummy data
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/rcpa_dummy_data.sql

# Step 9: V4 RAG migration — knowledge_chunks (pgvector embeddings, tags), chat_sessions, chat_messages
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v3_rag.sql

# Step 10: Chunk and embed existing knowledge base documents
# This reads all drug_knowledge rows, splits them into ~300-token chunks,
# computes Gemini embeddings, and populates the knowledge_chunks table.
# Requires GEMINI_API_KEY to be set in .env for embeddings.
docker exec zenapp-backend-local node scripts/rechunk.js
```

This creates:
- **9 products** (Derise 10/20/50mg, Rilast Tablet/Capsule/Syrup, Bevaas 5/10/20mg)
- **5 users** — 3 MRs (`mr_rahul_001`, `mr_priya_002`, `mr_robert_003`), 1 manager (`mgr_vikram_001`), 1 admin (`admin_001`)
- **13 doctor profiles** across Mumbai North, Mumbai South, and Delhi NCR territories
- **43 DCR records** spanning ~48 days with competitor mentions in call summaries
- **Follow-up tasks** (pending + overdue) for post-call automation
- **Adverse event records** for pharmacovigilance demo
- **Drug knowledge base** — prescribing info, clinical trials, FAQs, safety data for all products
- **30 RCPA entries** — competitor prescription audit data across all 3 MRs
- **Knowledge chunks** — auto-generated from knowledge base with embeddings and medicine tags

### Login credentials

| Username | Password | Role | User ID |
|----------|----------|------|---------|
| `rahul` | `password123` | MR | `mr_rahul_001` |
| `priya` | `password123` | MR | `mr_priya_002` |
| `robert` | `password123` | MR | `mr_robert_003` |
| `manager1` | `password123` | Manager | `mgr_vikram_001` |
| `admin` | `password123` | Admin | `admin_001` |

## 4. Verify everything works

```bash
# Quick health check
curl http://localhost:3001/health

# Run the full test suite
chmod +x test.sh
./test.sh
```

You should see all tests return `"success": true` with no errors.

To run a single test:
```bash
./test.sh precall
./test.sh product-signals
```

## API Endpoints

### Health
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Server health check |

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/register` | Public | Register a new user |
| POST | `/api/auth/login` | Public | Login and receive JWT token |
| GET | `/api/auth/me` | JWT | Get current user profile |

### DCR (Daily Call Reports)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dcr` | Create a new DCR (auto-triggers adverse event scan) |
| GET | `/api/dcr` | List all DCRs (optional `?user_id=` filter) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |

### Doctors
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/doctors` | List doctor profiles (optional `?territory=` filter) |
| POST | `/api/doctors` | Create doctor profile (manager/admin only) |
| PATCH | `/api/doctors/:id` | Update doctor profile (manager/admin only) |
| DELETE | `/api/doctors/:id` | Delete doctor profile (admin only) |

### Tasks (Follow-up)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List follow-up tasks (optional `?user_id=`, `?status=` filters) |
| PATCH | `/api/tasks/:id` | Update task status |

### Knowledge Base (Clinical Assistant)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/knowledge/upload` | Manager/Admin | Upload drug knowledge file (.txt, .md, .csv) — auto-chunks and embeds |
| GET | `/api/knowledge` | JWT | List knowledge entries (optional `?product_id=` filter) |
| DELETE | `/api/knowledge/:id` | Manager/Admin | Delete knowledge entry (chunks cascade-deleted) |
| GET | `/api/knowledge/preview/:filename` | JWT | Preview uploaded file content |
| GET | `/api/knowledge/sessions` | JWT | List chat sessions for current user |
| POST | `/api/knowledge/chat` | JWT | Chat with clinical assistant (hybrid RAG). Accepts `session_id` for conversation continuity |

### Adverse Events (Pharmacovigilance)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/adverse-events` | List adverse events (optional `?status=`, `?severity=` filters) |
| GET | `/api/adverse-events/stats` | Aggregate stats (total, pending, confirmed, by severity) |
| PATCH | `/api/adverse-events/:id/review` | Review/confirm/dismiss an event (manager/admin only) |

### RCPA (Retail Chemist Prescription Audit)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/rcpa` | Save RCPA prescription entries |
| GET | `/api/rcpa` | List RCPA entries (optional `?user_id=`, `?from_date=`, `?to_date=` filters) |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/precall-briefing` | Pre-call briefing for a doctor visit |
| GET | `/api/ai/territory-gap/:user_id` | Territory coverage gap analysis |
| POST | `/api/ai/manager-query` | Free-text manager query over team data |
| GET | `/api/ai/product-signals` | Product performance signals |
| POST | `/api/ai/post-call-extract` | Extract structured DCR fields from call notes |
| GET | `/api/ai/nba/:user_id` | Next Best Action — daily visit recommendations |
| GET | `/api/ai/competitor-intel` | Competitor intelligence from DCR + RCPA data |

## Common Commands

```bash
# Rebuild after code changes
docker-compose -f docker-compose.local.yml up --build

# Stop containers
docker-compose -f docker-compose.local.yml down

# Stop and remove data (fresh start)
docker-compose -f docker-compose.local.yml down -v

# View app logs
docker logs -f zenapp-backend-local

# View database logs
docker logs -f zenapp-postgres

# Connect to the database directly
docker exec -it zenapp-postgres psql -U postgres -d zenapp

# Re-seed (full reset — run down -v first, then start, then all seed steps above)
```

## Project Structure

```
backend/
├── server.js                   # Express app entry point
├── config/db.js                # PostgreSQL connection pool
├── middleware/auth.js           # JWT authentication & role-based access
├── routes/
│   ├── auth.js                 # Register, login, profile
│   ├── dcr.js                  # DCR CRUD endpoints
│   ├── ai.js                   # AI-powered endpoints (7 features)
│   ├── product.js              # Product list
│   ├── doctors.js              # Doctor profile CRUD
│   ├── tasks.js                # Follow-up task management
│   ├── knowledge.js            # Knowledge base upload, chat (RAG)
│   ├── adverse-events.js       # Pharmacovigilance dashboard
│   └── rcpa.js                 # RCPA prescription audit
├── prompts/
│   ├── preCallBriefing.js      # Pre-call briefing prompt
│   ├── territoryGap.js         # Territory gap analysis prompt
│   ├── managerQuery.js         # Manager natural language query prompt
│   ├── productSignals.js       # Product performance signals prompt
│   ├── postCallExtraction.js   # Post-call structured extraction prompt
│   ├── aeDetection.js          # Adverse event detection prompt
│   ├── nextBestAction.js       # Next Best Action (daily plan) prompt
│   ├── clinicalChat.js         # Clinical assistant chatbot prompt
│   └── competitorIntel.js      # Competitor intelligence prompt
├── services/
│   ├── aeDetection.js          # Async adverse event background scanner
│   ├── knowledgeSearch.js      # Hybrid search (FTS + vector) with RRF scoring
│   ├── chunker.js              # Section-aware document chunking with tag extraction
│   ├── embeddings.js           # Gemini text-embedding-004 (768 dims)
│   ├── chatMemory.js           # Conversation session & message persistence
│   ├── queryRewriter.js        # LLM-powered context-dependent query rewriting
│   ├── queryPreprocessor.js    # Pharma synonym expansion & query cleaning
│   └── llm/
│       ├── index.js            # LLM provider factory
│       ├── base.js             # Base provider class
│       └── providers/
│           ├── openai.js       # OpenAI / Groq provider
│           ├── anthropic.js    # Anthropic provider
│           └── gemini.js       # Google Gemini provider
├── db/
│   ├── schema.sql              # V1 schema — products, dcr (auto-run on first start)
│   ├── dummy_data.sql          # Products + 43 DCR records
│   ├── migration_v2.sql        # V2 — users, tasks, knowledge, adverse_events, doctors, nba
│   ├── seed_users.sql          # 5 users (3 MRs, 1 manager, 1 admin)
│   ├── seed_doctors.sql        # 13 doctor profiles
│   ├── seed_knowledge.sql      # Drug knowledge base (prescribing info, trials, FAQs, safety)
│   ├── seed_demo_data.sql      # Follow-up tasks + adverse events demo data
│   ├── migration_v3.sql        # V3 — RCPA table
│   ├── rcpa_dummy_data.sql     # 30 RCPA competitor prescription entries
│   ├── migration_v3_rag.sql    # V4 — knowledge_chunks (pgvector), chat_sessions, chat_messages
│   └── seed.sql                # Legacy seed (products + DCRs, same as dummy_data.sql)
├── scripts/
│   └── rechunk.js              # One-time script: chunk + embed existing knowledge base
├── docker-compose.local.yml    # Local dev compose file
├── docker-compose.yml          # Production compose file
├── Dockerfile
├── .env.example                # Environment template
└── test.sh                     # API test script
```

## Database Tables

| Table | Migration | Description |
|-------|-----------|-------------|
| `products` | schema.sql | Product catalog (9 products) |
| `dcr` | schema.sql | Daily Call Reports |
| `users` | migration_v2.sql | User accounts with JWT auth & roles |
| `follow_up_tasks` | migration_v2.sql | Post-call follow-up tasks |
| `drug_knowledge` | migration_v2.sql | Knowledge base with GIN full-text index |
| `adverse_events` | migration_v2.sql | Pharmacovigilance records |
| `doctor_profiles` | migration_v2.sql | Doctor details, tier, territory, preferences |
| `nba_recommendations` | migration_v2.sql | Daily NBA cache (one per MR per day) |
| `rcpa` | migration_v3.sql | Retail chemist prescription audit data |
| `knowledge_chunks` | migration_v3_rag.sql | Chunked knowledge with embeddings (pgvector) and medicine tags |
| `chat_sessions` | migration_v3_rag.sql | Conversation sessions per user |
| `chat_messages` | migration_v3_rag.sql | Chat message history (user + assistant turns) |

## Exposing for Frontend (ngrok)

To connect a hosted frontend to your local backend:

```bash
ngrok http 3001
```

Then use the ngrok URL (e.g. `https://xxxx.ngrok-free.dev`) as the API base URL in your frontend config.
