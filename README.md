# ZenApp Backend

Express.js backend server for MR application with Supabase integration.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file with your Supabase credentials:
```
PORT=3001
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Run

### Local Development
```bash
npm run dev
```

### Production
```bash
npm start
```

### Docker

Build and run with Docker:
```bash
docker build -t zenapp-backend .
docker run -p 3001:3001 --env-file .env zenapp-backend
```

Or use Docker Compose:
```bash
# Start services
docker compose up -d

# Stop services
docker compose down

# Rebuild and restart (after code changes)
docker compose down
docker compose build --no-cache
docker compose up -d

# View logs
docker compose logs app

# Follow logs in real-time
docker compose logs -f app
```

