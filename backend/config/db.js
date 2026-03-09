/**
 * config/db.js
 *
 * Unified database client using node-postgres (pg).
 *
 * Works for both environments via DATABASE_URL:
 *   Local Docker:  postgresql://postgres:password@postgres:5432/zenapp
 *   Production:    Supabase connection string (Session Pooler mode recommended)
 *                  Get from: Supabase Dashboard → Project Settings → Database
 *                  → Connect
 *
 * IMPORTANT: URL-encode special characters in password (@ becomes %40, etc.)
 *
 * Usage in routes:
 *   const db = require('../config/db');
 *   const { rows } = await db.query('SELECT * FROM dcr WHERE user_id = $1', [userId]);
 */

const { Pool } = require('pg');

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

const isSupabase = process.env.DATABASE_URL.includes('supabase.co');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isSupabase ? { rejectUnauthorized: false } : false,
  max: 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 20000,
  // Supabase-specific settings
  ...(isSupabase && {
    statement_timeout: 15000,
    query_timeout: 15000,
  }),
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
