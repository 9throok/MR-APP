const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const db = require('../config/db');
const { authenticateToken, generateToken } = require('../middleware/auth');

const SALT_ROUNDS = 10;

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { username, email, password, name, role, territory, user_id } = req.body;

    if (!username || !password || !name || !user_id) {
      return res.status(400).json({ error: 'username, password, name, and user_id are required' });
    }

    const validRoles = ['mr', 'manager', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'mr';

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const { rows } = await db.query(
      `INSERT INTO users (username, email, password_hash, role, name, territory, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, username, email, role, name, territory, user_id, created_at`,
      [username, email || null, password_hash, userRole, name, territory || null, user_id]
    );

    const user = rows[0];
    const token = generateToken(user);

    res.status(201).json({ success: true, user, token });
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'Username or user_id already exists' });
    }
    console.error('[Auth] Register error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const username = req.body.username?.trim();
    const password = req.body.password?.trim();

    if (!username || !password) {
      return res.status(400).json({ error: 'username and password are required' });
    }

    const { rows } = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );

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
      'SELECT id, username, email, role, name, territory, user_id, created_at FROM users WHERE id = $1',
      [req.user.id]
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
