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
const { chunkDocument } = require('../services/chunker');
const { getEmbeddings, toPgVector } = require('../services/embeddings');
const { getOrCreateSession, getRecentMessages, saveMessage, listSessions } = require('../services/chatMemory');
const { rewriteQuery } = require('../services/queryRewriter');

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

    // Insert into drug_knowledge (source of truth)
    const { rows } = await db.query(
      `INSERT INTO drug_knowledge (product_id, filename, content, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, product_id, filename, category, uploaded_by, uploaded_at`,
      [product_id, req.file.originalname, content, category || 'general', req.user.user_id]
    );

    const knowledgeId = rows[0].id;

    // Get product name for tagging
    const productResult = await db.query('SELECT name FROM products WHERE id = $1', [product_id]);
    const productName = productResult.rows[0]?.name || null;

    // Chunk the document
    const chunks = chunkDocument(content, { productName });
    console.log(`[Knowledge] Chunked "${req.file.originalname}" into ${chunks.length} chunks`);

    // Compute embeddings for all chunks
    let embeddings = [];
    try {
      embeddings = await getEmbeddings(chunks.map(c => c.content));
    } catch (err) {
      console.warn('[Knowledge] Embedding generation failed, storing chunks without embeddings:', err.message);
    }

    // Batch insert chunks
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i] ? toPgVector(embeddings[i]) : null;

      await db.query(
        `INSERT INTO knowledge_chunks (knowledge_id, product_id, chunk_index, content, token_count, metadata, tags, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::vector)`,
        [
          knowledgeId, product_id, chunk.chunkIndex, chunk.content,
          chunk.tokenCount, JSON.stringify(chunk.metadata), chunk.tags,
          embedding
        ]
      );
    }

    res.status(201).json({
      success: true,
      data: rows[0],
      chunks_created: chunks.length
    });
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

// DELETE /api/knowledge/:id — delete a knowledge entry (chunks cascade-deleted)
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

// GET /api/knowledge/preview/:filename — get document content for preview
router.get('/preview/:filename', authenticateToken, async (req, res) => {
  try {
    const { filename } = req.params;
    const { rows } = await db.query(
      `SELECT dk.id, dk.filename, dk.content, dk.category, p.name as product_name
       FROM drug_knowledge dk
       LEFT JOIN products p ON dk.product_id = p.id
       WHERE dk.filename = $1
       LIMIT 1`,
      [filename]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Knowledge] Preview error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/knowledge/sessions — list chat sessions for the current user
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const sessions = await listSessions(req.user.user_id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Knowledge] Sessions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge/chat — clinical assistant chat with conversation memory
router.post('/chat', authenticateToken, async (req, res) => {
  try {
    const { query, product_id, session_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Get or create conversation session
    const sessionId = await getOrCreateSession(req.user.user_id, session_id, product_id);

    // Get conversation history for context
    const conversationHistory = await getRecentMessages(sessionId);

    // Rewrite query to be self-contained if there's history
    const rewrittenQuery = await rewriteQuery(query, conversationHistory);

    // Search knowledge base with rewritten query
    const knowledgeResults = await searchKnowledge(rewrittenQuery, product_id);

    // Build LLM messages with knowledge context and conversation history
    const messages = buildClinicalChatMessages(rewrittenQuery, knowledgeResults, conversationHistory);

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

    const sources = knowledgeResults.map(r => ({
      filename: r.filename,
      category: r.category,
      product_name: r.product_name,
      section: r.metadata?.section || null
    }));

    // Save messages to conversation history
    await saveMessage(sessionId, 'user', query);
    await saveMessage(sessionId, 'assistant', answer, sources);

    res.json({
      success: true,
      answer,
      sources,
      session_id: sessionId
    });
  } catch (err) {
    console.error('[Knowledge] Chat error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
