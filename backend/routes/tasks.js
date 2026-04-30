const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/tasks — list follow-up tasks for a user
router.get('/', async (req, res) => {
  try {
    const { user_id, status } = req.query;
    const conditions = ['org_id = $1'];
    const params = [req.org_id];

    if (user_id) {
      params.push(user_id);
      conditions.push(`user_id = $${params.length}`);
    }
    if (status) {
      params.push(status);
      conditions.push(`status = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const { rows } = await db.query(
      `SELECT * FROM follow_up_tasks ${where} ORDER BY due_date ASC NULLS LAST, created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Tasks] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/tasks/:id — update task status
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !['pending', 'completed', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Valid status required: pending, completed, overdue' });
    }

    const { rows } = await db.query(
      'UPDATE follow_up_tasks SET status = $1 WHERE id = $2 AND org_id = $3 RETURNING *',
      [status, id, req.org_id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Tasks] PATCH error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
