/**
 * Chat Memory Service
 *
 * Manages conversation sessions and message history for the clinical assistant.
 * Stores messages in PostgreSQL for persistence across requests.
 * All operations are scoped by org_id.
 */

const db = require('../config/db');

/**
 * Get an existing session or create a new one
 * @param {string} userId
 * @param {string} orgId
 * @param {string|null} sessionId - Existing session ID to resume
 * @param {number|null} productId - Product scope for new sessions
 * @returns {Promise<string>} - Session ID (UUID)
 */
async function getOrCreateSession(userId, orgId, sessionId = null, productId = null) {
  // If session ID provided, verify it belongs to this user AND org
  if (sessionId) {
    const { rows } = await db.query(
      'SELECT id FROM chat_sessions WHERE id = $1 AND user_id = $2 AND org_id = $3',
      [sessionId, userId, orgId]
    );
    if (rows.length > 0) {
      // Update last activity timestamp
      await db.query(
        'UPDATE chat_sessions SET updated_at = NOW() WHERE id = $1',
        [sessionId]
      );
      return sessionId;
    }
    // Session not found or doesn't belong to user/org — create new one
  }

  // Create new session
  const { rows } = await db.query(
    `INSERT INTO chat_sessions (org_id, user_id, product_id)
     VALUES ($1, $2, $3)
     RETURNING id`,
    [orgId, userId, productId]
  );
  return rows[0].id;
}

/**
 * Get recent messages from a session (for conversation context)
 * @param {string} sessionId
 * @param {string} orgId
 * @param {number} limit - Number of messages to retrieve (default 6 = 3 turns)
 * @returns {Promise<Array<{role, content}>>}
 */
async function getRecentMessages(sessionId, orgId, limit = 6) {
  const { rows } = await db.query(
    `SELECT role, content FROM chat_messages
     WHERE session_id = $1 AND org_id = $2
     ORDER BY created_at DESC
     LIMIT $3`,
    [sessionId, orgId, limit]
  );
  // Reverse to get chronological order
  return rows.reverse();
}

/**
 * Save a message to the session
 * @param {string} sessionId
 * @param {string} orgId
 * @param {string} role - 'user' or 'assistant'
 * @param {string} content - Message text
 * @param {Object|null} sources - Source metadata for assistant messages
 */
async function saveMessage(sessionId, orgId, role, content, sources = null) {
  await db.query(
    `INSERT INTO chat_messages (org_id, session_id, role, content, sources)
     VALUES ($1, $2, $3, $4, $5)`,
    [orgId, sessionId, role, content, sources ? JSON.stringify(sources) : null]
  );
}

/**
 * List recent sessions for a user within their org
 * @param {string} userId
 * @param {string} orgId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function listSessions(userId, orgId, limit = 10) {
  const { rows } = await db.query(
    `SELECT cs.id, cs.product_id, p.name AS product_name,
            cs.created_at, cs.updated_at,
            (SELECT content FROM chat_messages
             WHERE session_id = cs.id ORDER BY created_at ASC LIMIT 1) AS first_message
     FROM chat_sessions cs
     LEFT JOIN products p ON cs.product_id = p.id AND p.org_id = cs.org_id
     WHERE cs.user_id = $1 AND cs.org_id = $2
     ORDER BY cs.updated_at DESC
     LIMIT $3`,
    [userId, orgId, limit]
  );
  return rows;
}

module.exports = { getOrCreateSession, getRecentMessages, saveMessage, listSessions };
