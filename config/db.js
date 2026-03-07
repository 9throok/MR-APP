/**
 * config/db.js
 *
 * Unified database client using node-postgres (pg).
 *
 * Works for both environments via DATABASE_URL:
 *   Local Docker:  postgresql://postgres:password@postgres:5432/zenapp
 *   Production:    Supabase direct connection string (from Supabase dashboard
 *                  → Project Settings → Database → Connection string → URI)
 *
 * Usage in routes:
 *   const db = require('../config/db');
 *   const { rows } = await db.query('SELECT * FROM dcr WHERE user_id = $1', [userId]);
 */

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // SSL required for Supabase in production, not needed for local Docker
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false,
  max: 10,                // max pool connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

pool.on('error', (err) => {
  console.error('[DB] Unexpected pool error:', err.message);
});

pool.on('connect', () => {
  console.log('[DB] New client connected to database');
});

/**
 * Execute a parameterised SQL query.
 * @param {string} sql   - SQL string with $1, $2 placeholders
 * @param {Array}  params - Parameter values
 * @returns {Promise<{rows: Array, rowCount: number}>}
 */
async function query(sql, params = []) {
  const start = Date.now();
  try {
    const result = await pool.query(sql, params);
    const duration = Date.now() - start;
    console.log(`[DB] query (${duration}ms) rows=${result.rowCount}`);
    return result;
  } catch (err) {
    console.error('[DB] Query error:', err.message, '\nSQL:', sql);
    throw err;
  }
}

module.exports = { query };
