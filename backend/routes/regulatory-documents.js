/**
 * routes/regulatory-documents.js — Phase C.1
 *
 * Lite regulatory document repo. Drug labels, IFUs, MoH approval letters,
 * SOPs, training material, safety communications. Each asset has versions;
 * the latest non-expired active version is the "current" one.
 *
 * Storage mirrors content.js — local Multer disk at uploads/regulatory/<id>/.
 *
 * RBAC:
 *   - Read (list/detail/expiring-soon): any authenticated user
 *   - Write (create/upload version/retire): admin or manager
 */

const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { recordAudit } = require('../middleware/auditLog');

const ALLOWED_EXTS = ['.pdf', '.docx', '.doc', '.txt', '.md', '.png', '.jpg', '.jpeg'];
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const subdir = req.params.id ? String(req.params.id) : 'pending';
    const dir = path.join(__dirname, '..', 'uploads', 'regulatory', subdir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const uploadDoc = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_EXTS.includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error(`File type not allowed. Allowed: ${ALLOWED_EXTS.join(', ')}`), ok);
  },
  limits: { fileSize: MAX_FILE_SIZE }
});

const VALID_DOC_TYPES = ['drug_label', 'ifu', 'moh_approval', 'safety_communication', 'sop', 'training_material', 'other'];
const VALID_STATUSES  = ['active', 'superseded', 'retired', 'archived'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function relocateUpload(uploadedFile, docId) {
  const oldPath = uploadedFile.path;
  const newDir = path.join(__dirname, '..', 'uploads', 'regulatory', String(docId));
  fs.mkdirSync(newDir, { recursive: true });
  const newPath = path.join(newDir, uploadedFile.filename);
  fs.renameSync(oldPath, newPath);
  return `/uploads/regulatory/${docId}/${uploadedFile.filename}`;
}

function discardUpload(uploadedFile) {
  try { if (uploadedFile && uploadedFile.path) fs.unlinkSync(uploadedFile.path); }
  catch (_) { /* swallow */ }
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/regulatory-documents — list documents in the org
// Query: ?doc_type=&jurisdiction=&product_id=
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { doc_type, jurisdiction, product_id } = req.query;
    const params = [req.org_id];
    const where = ['d.org_id = $1'];

    if (doc_type)     { params.push(doc_type);     where.push(`d.doc_type = $${params.length}`); }
    if (jurisdiction) { params.push(jurisdiction); where.push(`d.jurisdiction = $${params.length}`); }
    if (product_id)   { params.push(product_id);   where.push(`d.product_id = $${params.length}`); }

    const { rows } = await db.query(
      `SELECT d.id, d.title, d.doc_type, d.jurisdiction, d.description,
              d.product_id, d.owner_user_id, d.current_version_id,
              d.created_at, d.updated_at,
              p.name AS product_name,
              cv.version_number AS current_version_number,
              cv.status         AS current_version_status,
              cv.effective_date AS current_effective_date,
              cv.expiry_date    AS current_expiry_date,
              cv.file_url       AS current_file_url
       FROM regulatory_documents d
       LEFT JOIN products p
         ON p.id = d.product_id AND p.org_id = d.org_id
       LEFT JOIN regulatory_document_versions cv
         ON cv.id = d.current_version_id AND cv.org_id = d.org_id
       WHERE ${where.join(' AND ')}
       ORDER BY d.updated_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[REGDOC] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/regulatory-documents/expiring — documents expiring in next N days
// Query: ?days=30
// ─────────────────────────────────────────────────────────────────────────────
router.get('/expiring', async (req, res) => {
  try {
    const days = Math.min(parseInt(req.query.days, 10) || 30, 365);
    const { rows } = await db.query(
      `SELECT d.id          AS document_id,
              d.title,
              d.doc_type,
              d.jurisdiction,
              v.id           AS version_id,
              v.version_number,
              v.expiry_date,
              v.status,
              (v.expiry_date - CURRENT_DATE)::int AS days_until_expiry
       FROM regulatory_document_versions v
       JOIN regulatory_documents d
         ON d.id = v.document_id AND d.org_id = v.org_id
       WHERE v.org_id = $1
         AND v.status = 'active'
         AND v.expiry_date IS NOT NULL
         AND v.expiry_date <= CURRENT_DATE + ($2::int * INTERVAL '1 day')
       ORDER BY v.expiry_date ASC`,
      [req.org_id, days]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[REGDOC] expiring error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/regulatory-documents/:id — document + all versions
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: docRows } = await db.query(
      `SELECT d.*, p.name AS product_name
       FROM regulatory_documents d
       LEFT JOIN products p ON p.id = d.product_id AND p.org_id = d.org_id
       WHERE d.id = $1 AND d.org_id = $2`,
      [id, req.org_id]
    );
    if (docRows.length === 0) {
      return res.status(404).json({ error: 'Document not found' });
    }

    const { rows: versions } = await db.query(
      `SELECT * FROM regulatory_document_versions
       WHERE document_id = $1 AND org_id = $2
       ORDER BY version_number DESC`,
      [id, req.org_id]
    );

    res.json({ success: true, data: { document: docRows[0], versions } });
  } catch (err) {
    console.error('[REGDOC] detail error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/regulatory-documents — create document + first version (multipart)
// Form fields: title, doc_type, jurisdiction?, product_id?, description?,
//              effective_date?, expiry_date?
// File field: file
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('admin', 'manager'), uploadDoc.single('file'), async (req, res) => {
  let uploadedFile = req.file;
  try {
    const {
      title, doc_type, jurisdiction, product_id, description,
      effective_date, expiry_date,
    } = req.body;

    if (!title || !doc_type) {
      discardUpload(uploadedFile);
      return res.status(400).json({ error: 'title and doc_type are required' });
    }
    if (!VALID_DOC_TYPES.includes(doc_type)) {
      discardUpload(uploadedFile);
      return res.status(400).json({ error: `doc_type must be one of: ${VALID_DOC_TYPES.join(', ')}` });
    }
    if (!uploadedFile) {
      return res.status(400).json({ error: 'A file upload is required' });
    }

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: docRows } = await client.query(
        `INSERT INTO regulatory_documents
          (org_id, title, doc_type, product_id, jurisdiction, description, owner_user_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [
          req.org_id, title, doc_type,
          product_id || null,
          jurisdiction || null,
          description || null,
          req.user.user_id,
        ]
      );
      const doc = docRows[0];

      const fileUrl = relocateUpload(uploadedFile, doc.id);
      uploadedFile = null; // file moved; don't try to discard later

      const { rows: vRows } = await client.query(
        `INSERT INTO regulatory_document_versions
          (org_id, document_id, version_number, file_url, mime_type, file_size_bytes,
           effective_date, expiry_date, status, uploaded_by)
         VALUES ($1, $2, 1, $3, $4, $5, $6, $7, 'active', $8)
         RETURNING *`,
        [
          req.org_id, doc.id, fileUrl,
          req.file.mimetype || null,
          req.file.size || null,
          effective_date || null,
          expiry_date || null,
          req.user.user_id,
        ]
      );
      const version = vRows[0];

      await client.query(
        `UPDATE regulatory_documents SET current_version_id = $1
         WHERE id = $2 AND org_id = $3`,
        [version.id, doc.id, req.org_id]
      );

      await client.query('COMMIT');

      recordAudit({
        req,
        action: 'CREATE',
        tableName: 'regulatory_documents',
        rowId: doc.id,
        after: { ...doc, current_version_id: version.id },
        reason: `Created regulatory document '${title}' (${doc_type})`,
      });

      res.status(201).json({ success: true, data: { document: { ...doc, current_version_id: version.id }, version } });
    } catch (innerErr) {
      await client.query('ROLLBACK');
      discardUpload(uploadedFile);
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err) {
    discardUpload(uploadedFile);
    console.error('[REGDOC] create error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/regulatory-documents/:id/versions — upload a new version
// Form fields: effective_date?, expiry_date?, change_notes?
// File field: file
// On success, supersedes the previous current_version (status='superseded')
// and points current_version_id to the new row.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/versions', requireRole('admin', 'manager'), uploadDoc.single('file'), async (req, res) => {
  let uploadedFile = req.file;
  try {
    const { id } = req.params;
    const { effective_date, expiry_date, change_notes } = req.body;

    if (!uploadedFile) {
      return res.status(400).json({ error: 'A file upload is required' });
    }

    const { rows: docRows } = await db.query(
      `SELECT * FROM regulatory_documents WHERE id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    if (docRows.length === 0) {
      discardUpload(uploadedFile);
      return res.status(404).json({ error: 'Document not found' });
    }
    const doc = docRows[0];

    const client = await db.pool.connect();
    try {
      await client.query('BEGIN');

      const { rows: maxRows } = await client.query(
        `SELECT COALESCE(MAX(version_number), 0)::int AS max_v
         FROM regulatory_document_versions
         WHERE document_id = $1 AND org_id = $2`,
        [id, req.org_id]
      );
      const nextVersion = maxRows[0].max_v + 1;

      const fileUrl = relocateUpload(uploadedFile, id);
      uploadedFile = null;

      const { rows: vRows } = await client.query(
        `INSERT INTO regulatory_document_versions
          (org_id, document_id, version_number, file_url, mime_type, file_size_bytes,
           effective_date, expiry_date, status, uploaded_by, change_notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'active', $9, $10)
         RETURNING *`,
        [
          req.org_id, id, nextVersion, fileUrl,
          req.file.mimetype || null,
          req.file.size || null,
          effective_date || null,
          expiry_date || null,
          req.user.user_id,
          change_notes || null,
        ]
      );
      const newVersion = vRows[0];

      // Mark prior active version as superseded
      if (doc.current_version_id) {
        await client.query(
          `UPDATE regulatory_document_versions
           SET status = 'superseded'
           WHERE id = $1 AND org_id = $2`,
          [doc.current_version_id, req.org_id]
        );
      }

      await client.query(
        `UPDATE regulatory_documents SET current_version_id = $1
         WHERE id = $2 AND org_id = $3`,
        [newVersion.id, id, req.org_id]
      );

      await client.query('COMMIT');

      recordAudit({
        req,
        action: 'UPDATE',
        tableName: 'regulatory_documents',
        rowId: id,
        before: { current_version_id: doc.current_version_id },
        after: { current_version_id: newVersion.id, new_version_number: nextVersion },
        reason: `Uploaded v${nextVersion} of '${doc.title}'`,
      });

      res.status(201).json({ success: true, data: { version: newVersion } });
    } catch (innerErr) {
      await client.query('ROLLBACK');
      discardUpload(uploadedFile);
      throw innerErr;
    } finally {
      client.release();
    }
  } catch (err) {
    discardUpload(uploadedFile);
    console.error('[REGDOC] version upload error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/regulatory-documents/:id/versions/:vid — change version status
// Body: { status }
// Used to retire/archive a version. Doesn't touch current_version_id; the
// caller is expected to upload a replacement first if needed.
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id/versions/:vid', requireRole('admin', 'manager'), async (req, res) => {
  try {
    const { id, vid } = req.params;
    const { status } = req.body;

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${VALID_STATUSES.join(', ')}` });
    }

    const { rows } = await db.query(
      `UPDATE regulatory_document_versions
       SET status = $1
       WHERE id = $2 AND document_id = $3 AND org_id = $4
       RETURNING *`,
      [status, vid, id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    recordAudit({
      req,
      action: 'UPDATE',
      tableName: 'regulatory_document_versions',
      rowId: vid,
      after: rows[0],
      reason: `Status changed to '${status}'`,
    });

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[REGDOC] version patch error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
