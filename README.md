# MR-APP

Full-stack Medical Representative application with React frontend and Express.js backend.

## Project Structure

```
MR-APP/
├── frontend/                  # React + Vite + TypeScript
│   ├── src/
│   │   ├── components/        # React components (DCR, Chatbot, Reports, etc.)
│   │   ├── constants/         # App constants
│   │   ├── contexts/          # React context providers
│   │   ├── services/          # API services
│   │   ├── utils/             # Utility functions
│   │   ├── assets/            # Static assets & images
│   │   ├── App.tsx            # Root component
│   │   └── main.tsx           # Entry point
│   ├── public/                # Public assets
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
├── backend/                   # Express.js + Supabase
│   ├── config/                # Configuration files
│   ├── db/                    # Database scripts & seed data
│   ├── prompts/               # LLM prompt templates
│   ├── routes/                # API routes
│   ├── services/              # Business logic & LLM services
│   ├── server.js              # Entry point
│   ├── Dockerfile
│   ├── docker-compose.yml
│   ├── nginx.conf
│   └── package.json
│
├── .gitignore
└── README.md
```

## Setup

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `backend/.env` file:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. Run:
```bash
npm run dev
```

### Docker (Backend)

```bash
cd backend
docker compose up -d
```
