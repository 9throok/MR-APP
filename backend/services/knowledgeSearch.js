const db = require('../config/db');
const { getEmbedding, toPgVector } = require('./embeddings');
const { preprocessQuery } = require('./queryPreprocessor');

/**
 * Hybrid Knowledge Search
 *
 * Combines PostgreSQL full-text search (FTS) with vector similarity search
 * using Reciprocal Rank Fusion (RRF) for optimal retrieval.
 *
 * Searches knowledge_chunks (not full documents) for precise context.
 */
async function searchKnowledge(query, orgId, productId = null, { limit = 10, tags = null } = {}) {
  if (!orgId) {
    throw new Error('searchKnowledge requires an orgId for tenant isolation');
  }

  // Preprocess query: expand synonyms for FTS, clean for semantic
  const { ftsQuery, semanticQuery } = preprocessQuery(query);

  // Get query embedding for semantic search
  let queryEmbedding;
  try {
    queryEmbedding = await getEmbedding(semanticQuery);
  } catch (err) {
    console.warn('[KnowledgeSearch] Embedding failed, falling back to FTS-only:', err.message);
    queryEmbedding = null;
  }

  const params = [];
  let paramIdx = 0;

  // $1 = FTS query text
  params.push(ftsQuery);
  paramIdx++;
  const ftsParam = `$${paramIdx}`;

  // $2 = embedding vector (or null)
  const embeddingLiteral = queryEmbedding ? toPgVector(queryEmbedding) : null;
  params.push(embeddingLiteral);
  paramIdx++;
  const embParam = `$${paramIdx}`;

  // $3 = limit
  params.push(limit);
  paramIdx++;
  const limitParam = `$${paramIdx}`;

  // $4 = org_id (always required for tenant isolation)
  params.push(orgId);
  paramIdx++;
  const orgFilter = `AND kc.org_id = $${paramIdx}`;

  // Build optional filters
  let productFilter = '';
  if (productId) {
    params.push(productId);
    paramIdx++;
    productFilter = `AND kc.product_id = $${paramIdx}`;
  }

  let tagFilter = '';
  if (tags && tags.length > 0) {
    params.push(tags);
    paramIdx++;
    tagFilter = `AND kc.tags @> $${paramIdx}`;
  }

  // Hybrid search with RRF (Reciprocal Rank Fusion)
  // If embeddings are unavailable, falls back to FTS-only
  const sql = queryEmbedding
    ? buildHybridQuery(ftsParam, embParam, limitParam, orgFilter, productFilter, tagFilter)
    : buildFTSOnlyQuery(ftsParam, limitParam, orgFilter, productFilter, tagFilter);

  try {
    const { rows } = await db.query(sql, params);
    return rows;
  } catch (err) {
    console.error('[KnowledgeSearch] Query error:', err.message);
    // Fallback to simple FTS if hybrid query fails (e.g., pgvector not installed)
    return fallbackFTSSearch(query, orgId, productId, limit);
  }
}

/**
 * Hybrid search: FTS + Vector similarity combined via RRF
 */
function buildHybridQuery(ftsParam, embParam, limitParam, orgFilter, productFilter, tagFilter) {
  return `
    WITH fts AS (
      SELECT kc.id,
             ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', ${ftsParam})) AS fts_score,
             ROW_NUMBER() OVER (ORDER BY ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', ${ftsParam})) DESC) AS fts_rank
      FROM knowledge_chunks kc
      WHERE to_tsvector('english', kc.content) @@ plainto_tsquery('english', ${ftsParam})
      ${orgFilter}
      ${productFilter}
      ${tagFilter}
      LIMIT 20
    ),
    semantic AS (
      SELECT kc.id,
             1 - (kc.embedding <=> ${embParam}::vector) AS sim_score,
             ROW_NUMBER() OVER (ORDER BY kc.embedding <=> ${embParam}::vector) AS sem_rank
      FROM knowledge_chunks kc
      WHERE kc.embedding IS NOT NULL
      ${orgFilter}
      ${productFilter}
      ${tagFilter}
      ORDER BY kc.embedding <=> ${embParam}::vector
      LIMIT 20
    ),
    combined AS (
      SELECT
        COALESCE(f.id, s.id) AS id,
        COALESCE(1.0 / (60 + f.fts_rank), 0) + COALESCE(1.0 / (60 + s.sem_rank), 0) AS rrf_score,
        f.fts_score,
        s.sim_score
      FROM fts f
      FULL OUTER JOIN semantic s ON f.id = s.id
      WHERE COALESCE(1.0 / (60 + f.fts_rank), 0) + COALESCE(1.0 / (60 + s.sem_rank), 0) > 0.005
    )
    SELECT kc.id, kc.knowledge_id, kc.content, kc.chunk_index, kc.metadata, kc.tags,
           kc.token_count, dk.filename, dk.category, p.name AS product_name,
           c.rrf_score AS rank
    FROM combined c
    JOIN knowledge_chunks kc ON kc.id = c.id
    JOIN drug_knowledge dk ON kc.knowledge_id = dk.id AND dk.org_id = kc.org_id
    LEFT JOIN products p ON kc.product_id = p.id AND p.org_id = kc.org_id
    ORDER BY c.rrf_score DESC
    LIMIT ${limitParam}
  `;
}

/**
 * FTS-only search (when embeddings are unavailable)
 */
function buildFTSOnlyQuery(ftsParam, limitParam, orgFilter, productFilter, tagFilter) {
  return `
    SELECT kc.id, kc.knowledge_id, kc.content, kc.chunk_index, kc.metadata, kc.tags,
           kc.token_count, dk.filename, dk.category, p.name AS product_name,
           ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', ${ftsParam})) AS rank
    FROM knowledge_chunks kc
    JOIN drug_knowledge dk ON kc.knowledge_id = dk.id AND dk.org_id = kc.org_id
    LEFT JOIN products p ON kc.product_id = p.id AND p.org_id = kc.org_id
    WHERE to_tsvector('english', kc.content) @@ plainto_tsquery('english', ${ftsParam})
    ${orgFilter}
    ${productFilter}
    ${tagFilter}
    AND ts_rank(to_tsvector('english', kc.content), plainto_tsquery('english', ${ftsParam})) > 0.01
    ORDER BY rank DESC
    LIMIT ${limitParam}
  `;
}

/**
 * Simple fallback if hybrid/FTS queries fail entirely
 */
async function fallbackFTSSearch(query, orgId, productId, limit) {
  const keywords = query
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  if (keywords.length === 0) return [];

  const params = [orgId];
  if (productId) params.push(productId);

  const likeClauses = keywords.map(kw => {
    params.push(`%${kw}%`);
    return `kc.content ILIKE $${params.length}`;
  });

  const { rows } = await db.query(
    `SELECT kc.id, kc.knowledge_id, kc.content, kc.chunk_index, kc.metadata, kc.tags,
            kc.token_count, dk.filename, dk.category, p.name AS product_name
     FROM knowledge_chunks kc
     JOIN drug_knowledge dk ON kc.knowledge_id = dk.id AND dk.org_id = kc.org_id
     LEFT JOIN products p ON kc.product_id = p.id AND p.org_id = kc.org_id
     WHERE kc.org_id = $1
     ${productId ? `AND kc.product_id = $2` : ''}
     AND (${likeClauses.join(' OR ')})
     ORDER BY kc.created_at DESC
     LIMIT $${params.length + 1}`,
    [...params, limit]
  );

  return rows;
}

module.exports = { searchKnowledge };
