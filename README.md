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
│   ├── routes/                   # API routes (auth, DCR, AI, products, doctors, doctor-requests, tasks, knowledge, adverse-events, RCPA)
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

## Setup

For local dev (Docker, migrations, seed data, default logins, all API endpoints), see [backend/SETUP.md](backend/SETUP.md). For migration / seed execution order, see [backend/db/SEED_DATA_GUIDE.md](backend/db/SEED_DATA_GUIDE.md).

## Documentation

| Doc | Purpose |
|-----|---------|
| [backend/SETUP.md](backend/SETUP.md) | Local setup, Docker, migrations, API endpoints, default logins |
| [backend/db/SEED_DATA_GUIDE.md](backend/db/SEED_DATA_GUIDE.md) | Migration + seed execution order |
| [FEATURES.md](FEATURES.md) | Feature inventory — every page, endpoint, and AI prompt |
| [AI_FEATURES_REPORT.md](AI_FEATURES_REPORT.md) | Deep-dive on the 9 AI features |
| [docs/APP_HEALTH_REPORT.md](docs/APP_HEALTH_REPORT.md) | Audit of frontend-only stubs and missing backend APIs |
| [CLAUDE.md](CLAUDE.md) | Orientation file for Claude Code sessions |
