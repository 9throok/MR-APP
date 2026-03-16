-- Migration v3: Enhanced RAG system
-- Adds: knowledge_chunks (with tags, embeddings), chat_sessions, chat_messages
-- Requires: pgvector extension for semantic search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================================
-- Knowledge Chunks (Phase 1: Chunking + Phase 2: Embeddings)
-- ============================================================
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id            SERIAL       PRIMARY KEY,
  knowledge_id  INT          NOT NULL REFERENCES drug_knowledge(id) ON DELETE CASCADE,
  product_id    INT          REFERENCES products(id) ON DELETE CASCADE,
  chunk_index   INT          NOT NULL,
  content       TEXT         NOT NULL,
  token_count   INT,
  metadata      JSONB        DEFAULT '{}',
  tags          TEXT[]       DEFAULT '{}',
  embedding     vector(768),
  created_at    TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chunks_knowledge ON knowledge_chunks(knowledge_id);
CREATE INDEX IF NOT EXISTS idx_chunks_product ON knowledge_chunks(product_id);
CREATE INDEX IF NOT EXISTS idx_chunks_fts ON knowledge_chunks USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_chunks_tags ON knowledge_chunks USING GIN (tags);

-- ivfflat index for vector similarity search (create after data is populated for best results)
-- CREATE INDEX idx_chunks_embedding ON knowledge_chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- ============================================================
-- Chat Sessions & Messages (Phase 3: Conversation Memory)
-- ============================================================
CREATE TABLE IF NOT EXISTS chat_sessions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT         NOT NULL,
  product_id  INT          REFERENCES products(id),
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  updated_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id          SERIAL       PRIMARY KEY,
  session_id  UUID         NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role        VARCHAR(20)  NOT NULL CHECK (role IN ('user', 'assistant')),
  content     TEXT         NOT NULL,
  sources     JSONB,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id, created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id, updated_at DESC);
