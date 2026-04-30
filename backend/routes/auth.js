const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticateToken, generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;
const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// Resolve which org a registration request belongs to.
// Priority:
//   1. org_slug provided -> join that org (must already exist)
//   2. org_name provided -> create a new org for this user
//   3. neither -> attach to the default org (single-tenant migration mode)
async function resolveOrgForRegistration({ org_slug, org_name }) {
  if (org_slug) {
    const { rows } = await db.query(
      'SELECT id FROM organizations WHERE slug = $1',
      [org_slug]
    );
    if (rows.length === 0) {
      const err = new Error(`Organization with slug "${org_slug}" not found`);
      err.statusCode = 404;
      throw err;
    }
    return rows[0].id;
  }

  if (org_name) {
    const slug = org_name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { rows } = await db.query(
      `INSERT INTO organizations (name, slug) VALUES ($1, $2) RETURNING id`,
      [org_name, slug]
    );
    return rows[0].id;
  }

  return DEFAULT_ORG_ID;
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role, territory, user_id, org_slug, org_name } = req.body;

    if (!username || !password || !name || !user_id) {
      return res.status(400).json({ error: 'username, password, name, and user_id are required' });
    }

    const validRoles = ['mr', 'manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'mr';

    const org_id = await resolveOrgForRegistration({ org_slug, org_name });

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO users (org_id, username, email, password_hash, role, name, territory, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, org_id, username, email, role, name, territory, user_id, created_at`,
      [org_id, username, email || null, password_hash, userRole, name, territory || null, user_id]
    );

    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({ success: true, user, token });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username, email, or user_id already exists in this organization' });
    }
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
// Optional `org_slug` body field disambiguates when the same username exists in multiple orgs.
// If omitted, falls back to the default org for backwards compatibility.
router.post('/login', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();
    const org_slug = req.body.org_slug?.trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    let rows;
    if (org_slug) {
      ({ rows } = await db.query(
        `SELECT u.* FROM users u
         JOIN organizations o ON o.id = u.org_id
         WHERE u.username = $1 AND o.slug = $2`,
        [username, org_slug]
      ));
    } else {
      ({ rows } = await db.query(
        'SELECT * FROM users WHERE username = $1 AND org_id = $2',
        [username, DEFAULT_ORG_ID]
      ));
    }

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const user = rows[0];
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    const token = generateToken(user);

    const { password_hash, ...userWithoutPassword } = user;
    res.json({ success: true, user: userWithoutPassword, token });
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, org_id, username, email, role, name, territory, user_id, created_at
       FROM users WHERE id = $1 AND org_id = $2`,
      [req.user.id, req.user.org_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ success: true, user: rows[0] });
  } catch (err) {
    console.error('[Auth] Me error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
