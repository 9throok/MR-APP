const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const db = require('../config/db');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { attachOrgScope } = require('../middleware/orgScope');
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
router.post('/upload', authenticateToken, attachOrgScope, requireRole('admin', 'manager'), upload.single('file'), async (req, res) => {
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
      `INSERT INTO drug_knowledge (org_id, product_id, filename, content, category, uploaded_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, org_id, product_id, filename, category, uploaded_by, uploaded_at`,
      [req.org_id, product_id, req.file.originalname, content, category || 'general', req.user.user_id]
    );

    const knowledgeId = rows[0].id;

    // Get product name for tagging — must belong to same org
    const productResult = await db.query(
      'SELECT name FROM products WHERE id = $1 AND org_id = $2',
      [product_id, req.org_id]
    );
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

    // Batch insert chunks (org_id inherited from parent doc)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      const embedding = embeddings[i] ? toPgVector(embeddings[i]) : null;

      await db.query(
        `INSERT INTO knowledge_chunks (org_id, knowledge_id, product_id, chunk_index, content, token_count, metadata, tags, embedding)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9::vector)`,
        [
          req.org_id, knowledgeId, product_id, chunk.chunkIndex, chunk.content,
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
router.get('/', authenticateToken, attachOrgScope, async (req, res) => {
  try {
    const { product_id } = req.query;
    const conditions = ['dk.org_id = $1'];
    const params = [req.org_id];

    if (product_id) {
      params.push(product_id);
      conditions.push(`dk.product_id = $${params.length}`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT dk.id, dk.product_id, dk.filename, dk.category, dk.uploaded_by, dk.uploaded_at, p.name as product_name
       FROM drug_knowledge dk
       LEFT JOIN products p ON dk.product_id = p.id AND p.org_id = dk.org_id
       ${where}
       ORDER BY dk.uploaded_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Knowledge] GET error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/knowledge/:id — delete a knowledge entry (chunks cascade-deleted)
router.delete('/:id', authenticateToken, attachOrgScope, requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM drug_knowledge WHERE id = $1 AND org_id = $2 RETURNING *',
      [id, req.org_id]
    );

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
router.get('/preview/:filename', authenticateToken, attachOrgScope, async (req, res) => {
  try {
    const { filename } = req.params;
    const { rows } = await db.query(
      `SELECT dk.id, dk.filename, dk.content, dk.category, p.name as product_name
       FROM drug_knowledge dk
       LEFT JOIN products p ON dk.product_id = p.id AND p.org_id = dk.org_id
       WHERE dk.filename = $1 AND dk.org_id = $2
       LIMIT 1`,
      [filename, req.org_id]
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
router.get('/sessions', authenticateToken, attachOrgScope, async (req, res) => {
  try {
    const sessions = await listSessions(req.user.user_id, req.org_id);
    res.json({ success: true, data: sessions });
  } catch (err) {
    console.error('[Knowledge] Sessions error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/knowledge/chat — clinical assistant chat with conversation memory
router.post('/chat', authenticateToken, attachOrgScope, async (req, res) => {
  try {
    const { query, product_id, session_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    // Get or create conversation session
    const sessionId = await getOrCreateSession(req.user.user_id, req.org_id, session_id, product_id);

    // Get conversation history for context
    const conversationHistory = await getRecentMessages(sessionId, req.org_id);

    // Rewrite query to be self-contained if there's history
    const rewrittenQuery = await rewriteQuery(query, conversationHistory);

    // Search knowledge base with rewritten query (org-scoped)
    const knowledgeResults = await searchKnowledge(rewrittenQuery, req.org_id, product_id);

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
    await saveMessage(sessionId, req.org_id, 'user', query);
    await saveMessage(sessionId, req.org_id, 'assistant', answer, sources);

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
