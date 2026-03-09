const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { getLLMService } = require('../services/llm');
const { searchKnowledge } = require('../services/knowledgeSearch');
const { buildClinicalChatMessages } = require('../prompts/clinicalChat');

// Multer config for text file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ['.txt', '.md', '.csv'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Only .txt, .md, and .csv files are allowed'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

// POST /api/knowledge/upload — upload a knowledge base file
router.post('/upload', authenticateToken, requireRole('admin', 'manager'), upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const { product_id, category } = req.body;

    if (!product_id) {
      return res.status(400).json({ error: 'product_id is required' });
    }

    const content = fs.readFileSync(req.file.path, 'utf-8');

    const { rows } = await db.query(
      `INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, filename, category, uploaded_by, uploaded_at`,
      [product_id, req.file.originalname, content, category || 'general', req.user.user_id]
    );

    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Knowledge] Upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge — list knowledge entries
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { product_id } = req.query;
    let query = `SELECT dk.id, dk.product_id, dk.filename, dk.category, dk.uploaded_by, dk.uploaded_at, p.name as product_name
                 FROM drug_knowledge dk
                 LEFT JOIN products p ON dk.product_id = p.id`;
    const params = [];

    if (product_id) {
      query += ' WHERE dk.product_id = $1';
      params.push(product_id);
    }

    query += ' ORDER BY dk.uploaded_at DESC';

    const { rows } = await db.query(query, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Knowledge] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/knowledge/:id — delete a knowledge entry
router.delete('/:id', authenticateToken, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query('DELETE FROM drug_knowledge WHERE id = $1 RETURNING *', [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Knowledge entry not found' });
    }

    res.json({ success: true, message: 'Deleted successfully' });
  } catch (err) {
    console.error('[Knowledge] DELETE error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge/chat — clinical assistant chat
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { query, product_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Search knowledge base
    const knowledgeResults = await searchKnowledge(query, product_id);

    // Build LLM messages with knowledge context
    const messages = buildClinicalChatMessages(query, knowledgeResults);

    const llm = getLLMService();
    const result = await llm.chat(messages, { requireJson: true });

    // Ensure answer is a plain string — recursively flatten any nested objects
    function flatten(val, depth = 0) {
      if (typeof val === 'string') return val;
      if (val == null) return '';
      if (Array.isArray(val)) {
        return val.map(item => flatten(item, depth)).join('\n');
      }
      if (typeof val === 'object') {
        return Object.entries(val).map(([k, v]) => {
          const label = k.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
          const value = flatten(v, depth + 1);
          return `${label}: ${value}`;
        }).join('\n\n');
      }
      return String(val);
    }

    let answer = flatten(result.answer || result);

    res.json({
      success: true,
      answer,
      sources: knowledgeResults.map(r => ({ filename: r.filename, category: r.category, product_name: r.product_name }))
    });
  } catch (err) {
    console.error('[Knowledge] Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
