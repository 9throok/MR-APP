# ZenApp — Pharmaceutical SFA Platform

Full-stack Sales Force Automation platform for pharmaceutical Medical Representatives (MRs), with 9 AI-powered features. Built with React frontend and Express.js backend.

## Key Features

- **Daily Call Reports (DCR)** — Record doctor visits with AI-powered post-call extraction
- **AI Pre-Call Briefing** — Auto-generated visit preparation from past interactions
- **Territory Gap Analysis** — Identify neglected doctors and coverage gaps
- **Manager Insights** — Natural language queries, product signals, and competitor intelligence
- **Next Best Action (NBA)** — AI-optimized daily visit plans for each MR
- **Clinical Assistant Chatbot** — Enhanced RAG with hybrid search (FTS + vector), document chunking, conversation memory, and pharma synonym expansion
- **Adverse Event Detection** — Automated pharmacovigilance scanning on every DCR
- **Competitor Intelligence** — Combined DCR + RCPA analysis for competitive strategy
- **RCPA Tracking** — Retail chemist prescription audit data capture and analysis

## Project Structure

```
zenapp-backend/
├── frontend/                     # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/           # React components (DCR, Chatbot, Reports, Manager Insights, etc.)
│   │   ├── constants/            # App constants
│   │   ├── contexts/             # React context providers (Auth)
│   │   ├── services/             # API services
│   │   ├── utils/                # Utility functions
│   │   ├── assets/               # Static assets & images
│   │   ├── App.tsx               # Root component with routing
│   │   └── main.tsx              # Entry point
│   ├── public/                   # Public assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                      # Express.js + PostgreSQL
│   ├── config/                   # Database connection pool
│   ├── middleware/                # JWT auth & role-based access control
│   ├── db/                       # Schema, migrations (v2, v3), seed data
│   ├── prompts/                  # 9 LLM prompt templates
│   ├── routes/                   # API routes (auth, DCR, AI, products, doctors, tasks, knowledge, adverse-events, RCPA)
│   ├── services/                 # AE detection, knowledge search (hybrid FTS+vector), chunker, embeddings, chat memory, query rewriter, query preprocessor, multi-LLM provider factory
│   ├── scripts/                  # One-time migration scripts (rechunk.js)
│   ├── server.js                 # Entry point
│   ├── Dockerfile
│   ├── docker-compose.local.yml  # Local dev (Postgres + Node)
│   ├── docker-compose.yml        # Production
│   └── package.json
│
├── AI_FEATURES_REPORT.md         # Detailed report on all 9 AI features
├── .gitignore
└── README.md
```

## Quick Start

### Backend (Docker)

```bash
cd backend

# Configure environment
cp .env.example .env
# Edit .env — set your LLM_PROVIDER and API key

# Start Postgres + Node
docker-compose -f docker-compose.local.yml up --build

# Run migrations and seed data (in order)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/dummy_data.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v2.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_users.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_doctors.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_knowledge.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed_demo_data.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v3.sql
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/rcpa_dummy_data.sql

# V4 RAG migration — knowledge_chunks (with pgvector), chat_sessions, chat_messages
# Requires pgvector extension (included in postgres:16 Docker image)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/migration_v3_rag.sql

# Chunk + embed existing knowledge base documents
docker exec zenapp-backend-local node scripts/rechunk.js
```

> **Note:** The RAG migration (`migration_v3_rag.sql`) requires the pgvector PostgreSQL extension. The default `postgres:16` Docker image does not include it. If pgvector is not available, the system will fall back to FTS-only search (no semantic/vector search). To enable pgvector, use `pgvector/pgvector:pg16` as your Docker image instead.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3001`.

### Default Logins

| Username | Password | Role |
|----------|----------|------|
| `rahul` | `password123` | MR |
| `priya` | `password123` | MR |
| `robert` | `password123` | MR |
| `manager1` | `password123` | Manager |
| `admin` | `password123` | Admin |

> See [backend/SETUP.md](backend/SETUP.md) for full setup guide, all API endpoints, and database details.
