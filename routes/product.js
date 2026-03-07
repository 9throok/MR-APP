const express = require('express');
const router = express.Router();
const db = require('../config/db');

// GET /api/products - Fetch all products
router.get('/', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT * FROM products ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

module.exports = router;
