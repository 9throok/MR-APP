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

3. Create the DCR table in Supabase:
```sql
CREATE TABLE dcr (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  product TEXT NOT NULL,
  samples JSONB,
  call_summary TEXT,
  rating INTEGER,
  user_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
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
docker-compose up -d
```

Stop Docker Compose:
```bash
docker-compose down
```

## API Endpoints

### POST /api/dcr
Create a new DCR entry.

Request body:
```json
{
  "name": "MedPlus Pharmacy",
  "date": "February 27, 2026",
  "product": "Derise 20mg",
  "samples": [{"id": 1, "name": "Sample A - Cardiovascular", "quantity": 120}],
  "callSummary": "Test call",
  "rating": 4,
  "user_id": "1"
}
```
