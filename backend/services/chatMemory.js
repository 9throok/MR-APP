/**
 * Chat Memory Service
 *
 * Manages conversation sessions and message history for the clinical assistant.
 * Stores messages in PostgreSQL for persistence across requests.
 */

const db = require('../config/db');

/**
 * Get an existing session or create a new one
 * @param {string} userId
 * @param {string|null} sessionId - Existing session ID to resume
 * @param {number|null} productId - Product scope for new sessions
 * @returns {Promise<string>} - Session ID (UUID)
 */
async function getOrCreateSession(userId, sessionId = null, productId = null) {
  // If session ID provided, verify it belongs to this user
  if (sessionId) {
    const { rows } = await db.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2',
      [sessionId, userId]
    );
    if (rows.length > 0) {
      // Update last activity timestamp
      await db.query(
        'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
        [sessionId]
      );
      return sessionId;
    }
    // Session not found or doesn't belong to user — create new one
  }

  // Create new session
  const { rows } = await db.query(
    `INSERT INTO chat_sessions (user_id, product_id)
     VALUES ($1, $2)
     RETURNING id`,
    [userId, productId]
  );
  return rows[0].id;
}

/**
 * Get recent messages from a session (for conversation context)
 * @param {string} sessionId
 * @param {number} limit - Number of messages to retrieve (default 6 = 3 turns)
 * @returns {Promise<Array<{role, content}>>}
 */
async function getRecentMessages(sessionId, limit = 6) {
  const { rows } = await db.query(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1
     ORDER BY created_at DESC
     LIMIT $2`,
    [sessionId, limit]
  );
  // Reverse to get chronological order
  return rows.reverse();
}

/**
 * Save a message to the session
 * @param {string} sessionId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message text
 * @param {Object|null} sources - Source metadata for assistant messages
 */
async function saveMessage(sessionId, role, content, sources = null) {
  await db.query(
    `INSERT INTO chat_messages (session_id, role, content, sources)
     VALUES ($1, $2, $3, $4)`,
    [sessionId, role, content, sources ? JSON.stringify(sources) : null]
  );
}

/**
 * List recent sessions for a user
 * @param {string} userId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function listSessions(userId, limit = 10) {
  const { rows } = await db.query(
    `SELECT cs.id, cs.product_id, p.name AS product_name,
            cs.created_at, cs.updated_at,
            (SELECT content FROM chat_messages WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) AS first_message
     FROM chat_sessions cs
     LEFT JOIN products p ON cs.product_id = p.id
     WHERE cs.user_id = $1
     ORDER BY cs.updated_at DESC
     LIMIT $2`,
    [userId, limit]
  );
  return rows;
}

module.exports = { getOrCreateSession, getRecentMessages, saveMessage, listSessions };
