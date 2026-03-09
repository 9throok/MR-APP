# ZenApp Backend — Local Setup Guide

## Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and Docker Compose installed
- An LLM API key (one of: Gemini, OpenAI, Groq, or Anthropic)

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

## 3. Seed the database

```bash
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed.sql
```

This creates sample data:
- **9 products** (Derise, Rilast, Bevaas variants)
- **3 MRs** — `mr_rahul_001`, `mr_priya_002`, `mr_robert_003`
- **13 doctors** across the three MRs
- **43 DCR records** spanning ~48 days

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

### DCR (Daily Call Reports)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/dcr` | Create a new DCR |
| GET | `/api/dcr` | List all DCRs (optional `?user_id=` filter) |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/precall-briefing` | Pre-call briefing for a doctor visit |
| GET | `/api/ai/territory-gap/:user_id` | Territory coverage gap analysis |
| POST | `/api/ai/manager-query` | Free-text manager query over team data |
| GET | `/api/ai/product-signals` | Product performance signals |

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

# Re-seed (resets all DCR and product data)
docker exec -i zenapp-postgres psql -U postgres -d zenapp < db/seed.sql
```

## Project Structure

```
zenapp-backend/
├── server.js                 # Express app entry point
├── config/db.js              # PostgreSQL connection pool
├── routes/
│   ├── dcr.js                # DCR CRUD endpoints
│   ├── ai.js                 # AI-powered endpoints
│   └── product.js            # Product list endpoint
├── prompts/
│   ├── preCallBriefing.js    # Pre-call briefing prompt
│   ├── territoryGap.js       # Territory gap analysis prompt
│   ├── managerQuery.js       # Manager query prompt
│   └── productSignals.js     # Product signals prompt
├── services/llm/
│   ├── index.js              # LLM provider factory
│   ├── base.js               # Base provider class
│   └── providers/
│       ├── openai.js         # OpenAI / Groq provider
│       ├── anthropic.js      # Anthropic provider
│       └── gemini.js         # Google Gemini provider
├── db/
│   ├── schema.sql            # Database schema (auto-run on first start)
│   └── seed.sql              # Sample data for development
├── docker-compose.local.yml  # Local dev compose file
├── docker-compose.yml        # Production compose file
├── Dockerfile
├── .env.example              # Environment template
└── test.sh                   # API test script
```

## Exposing for Frontend (ngrok)

To connect a hosted frontend to your local backend:

```bash
ngrok http 3001
```

Then use the ngrok URL (e.g. `https://xxxx.ngrok-free.dev`) as the API base URL in your frontend config.
