const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/products - Fetch all products for the current org
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query(
      'SELECT * FROM products WHERE org_id = $1 ORDER BY id',
      [req.org_id]
    );
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

module.exports = router;
