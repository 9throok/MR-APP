const db = require('../config/db');

/**
 * Search the drug_knowledge table using PostgreSQL full-text search.
 * Falls back to ILIKE if FTS returns no results.
 */
async function searchKnowledge(query, productId = null, limit = 5) {
  const params = [];
  let productFilter = '';

  if (productId) {
    params.push(productId);
    productFilter = `AND dk.product_id = $${params.length}`;
  }

  // Convert query to tsquery format — split words and join with | (OR)
  // Using OR ensures partial matches rank results instead of requiring ALL terms
  const tsQuery = query
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .join(' | ');

  if (tsQuery) {
    params.push(tsQuery);
    const ftsParam = `$${params.length}`;

    const { rows } = await db.query(
      `SELECT dk.id, dk.product_id, dk.filename, dk.content, dk.category,
              p.name as product_name,
              ts_rank(to_tsvector('english', dk.content), to_tsquery('english', ${ftsParam})) AS rank
       FROM drug_knowledge dk
       LEFT JOIN products p ON dk.product_id = p.id
       WHERE to_tsvector('english', dk.content) @@ to_tsquery('english', ${ftsParam})
       ${productFilter}
       ORDER BY rank DESC
       LIMIT $${params.length + 1}`,
      [...params, limit]
    );

    if (rows.length > 0) return rows;
  }

  // Fallback: ILIKE search using key words (longest words from query)
  const keywords = query
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .sort((a, b) => b.length - a.length)
    .slice(0, 3);

  if (keywords.length === 0) return [];

  const likeParams = [];
  if (productId) {
    likeParams.push(productId);
  }

  // Build OR conditions for each keyword
  const likeClauses = keywords.map(kw => {
    likeParams.push(`%${kw}%`);
    return `dk.content ILIKE $${likeParams.length}`;
  });

  const { rows: fallbackRows } = await db.query(
    `SELECT dk.id, dk.product_id, dk.filename, dk.content, dk.category,
            p.name as product_name
     FROM drug_knowledge dk
     LEFT JOIN products p ON dk.product_id = p.id
     WHERE (${likeClauses.join(' OR ')})
     ${productId ? `AND dk.product_id = $1` : ''}
     ORDER BY dk.uploaded_at DESC
     LIMIT $${likeParams.length + 1}`,
    [...likeParams, limit]
  );

  return fallbackRows;
}

module.exports = { searchKnowledge };
