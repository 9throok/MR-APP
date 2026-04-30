const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const db = require('../config/db');
const { requireRole } = require('../middleware/auth');
const { extractAndSubstantiateClaims } = require('../services/contentScanner');
const { runMlrPreReview } = require('../services/mlrPreReview');

// ─────────────────────────────────────────────────────────────────────────────
// Multer setup for content asset uploads
//
// Files land at backend/uploads/content/<asset_id>/<timestamp>-<originalname>.
// The destination function reads `req.params.id` (the asset id) when present.
// On the first POST /api/content (asset creation), the asset doesn't exist
// yet — we land the file in a `pending/` subdirectory and move it after the
// INSERT returns the new asset id. Smaller blast radius than parsing-then-
// inserting upfront.
// ─────────────────────────────────────────────────────────────────────────────

// File types accepted as marketing content. Decks/PDFs are the bulk of real
// detail aids; plain text (.txt / .md) supports one-pagers and HTML-source
// uploads; images and short videos cover banner + clip use cases.
const ALLOWED_EXTS = ['.pdf', '.pptx', '.ppt', '.mp4', '.mov', '.webm', '.png', '.jpg', '.jpeg', '.txt', '.md'];
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB — slide decks and trial videos run large

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const subdir = req.params.id ? String(req.params.id) : 'pending';
    const dir = path.join(__dirname, '..', 'uploads', 'content', subdir);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^\w.\-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const uploadContent = multer({
  storage,
  fileFilter: (_req, file, cb) => {
    const ok = ALLOWED_EXTS.includes(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error(`File type not allowed. Allowed: ${ALLOWED_EXTS.join(', ')}`), ok);
  },
  limits: { fileSize: MAX_FILE_SIZE }
});

const VALID_ASSET_TYPES = ['slide_deck', 'video', 'pdf', 'detail_aid', 'brochure'];
const VALID_VERSION_STATUSES = ['draft', 'in_review', 'changes_requested', 'approved', 'published', 'retired'];

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

// Move a multer-uploaded file from /pending/ to /<asset_id>/ once we know the
// asset id. Returns the new file_url.
function relocateUpload(uploadedFile, assetId) {
  const oldPath = uploadedFile.path;
  const newDir = path.join(__dirname, '..', 'uploads', 'content', String(assetId));
  fs.mkdirSync(newDir, { recursive: true });
  const newPath = path.join(newDir, uploadedFile.filename);
  fs.renameSync(oldPath, newPath);
  return `/uploads/content/${assetId}/${uploadedFile.filename}`;
}

// Best-effort cleanup if the DB insert fails after the upload.
function discardUpload(uploadedFile) {
  try { if (uploadedFile && uploadedFile.path) fs.unlinkSync(uploadedFile.path); }
  catch (_) { /* file may already be moved or never existed */ }
}

// Determine whether the caller can SEE a published version, given the asset's
// distributions. Admin/manager always sees everything. MR sees only versions
// distributed to their user_id, their territory, their role, or 'all'.
function buildDistributionVisibilityClause(req, paramsOffset) {
  if (req.user.role !== 'mr') {
    // Admins/managers/marketing/reviewers see everything in their org
    return { clause: '', params: [] };
  }
  // MR: must have a matching distribution row
  const userId = req.user.user_id;
  const territory = req.user.territory || '';
  const role = req.user.role;
  return {
    clause: `AND EXISTS (
      SELECT 1 FROM content_distributions d
      WHERE d.version_id = v.id AND d.org_id = v.org_id
        AND (
             d.target_type = 'all'
          OR (d.target_type = 'mr'        AND d.target_id = $${paramsOffset + 1})
          OR (d.target_type = 'territory' AND d.target_id = $${paramsOffset + 2})
          OR (d.target_type = 'role'      AND d.target_id = $${paramsOffset + 3})
        )
    )`,
    params: [userId, territory, role]
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content/stats — counts by status (admin/manager dashboard)
// MUST be defined before /:id to avoid param capture.
// ─────────────────────────────────────────────────────────────────────────────
router.get('/stats', requireRole('manager', 'admin'), async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'draft')::int             AS draft,
         COUNT(*) FILTER (WHERE status = 'in_review')::int         AS in_review,
         COUNT(*) FILTER (WHERE status = 'changes_requested')::int AS changes_requested,
         COUNT(*) FILTER (WHERE status = 'approved')::int          AS approved,
         COUNT(*) FILTER (WHERE status = 'published')::int         AS published,
         COUNT(*) FILTER (WHERE status = 'retired')::int           AS retired
       FROM content_versions
       WHERE org_id = $1`,
      [req.org_id]
    );
    res.json({ success: true, stats: rows[0] });
  } catch (err) {
    console.error('[Content] stats error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content — list assets visible to the caller
// MR: only those whose published version is distributed to them.
// Admin/manager/owner: all assets in the org. Filters: ?product_id, ?asset_type
// ─────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { product_id, asset_type } = req.query;
    const conditions = ['a.org_id = $1'];
    const params = [req.org_id];

    if (product_id) {
      params.push(product_id);
      conditions.push(`a.product_id = $${params.length}`);
    }
    if (asset_type) {
      params.push(asset_type);
      conditions.push(`a.asset_type = $${params.length}`);
    }

    if (req.user.role === 'mr') {
      // MR can only see assets that have at least one published version
      // distributed to them (or 'all').
      const { clause, params: distParams } = buildDistributionVisibilityClause(req, params.length);
      params.push(...distParams);
      // Replace `v.id` with the latest published version for this asset
      conditions.push(`EXISTS (
        SELECT 1 FROM content_versions v
        WHERE v.asset_id = a.id AND v.org_id = a.org_id AND v.status = 'published'
          ${clause.replace(/AND v\.org_id = v\.org_id/g, 'AND v.org_id = a.org_id')}
      )`);
    }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const { rows } = await db.query(
      `SELECT a.*,
              p.name AS product_name,
              cv.version_number AS current_version_number,
              cv.file_url       AS current_file_url,
              cv.expiry_date    AS current_expiry_date
       FROM content_assets a
       LEFT JOIN products p ON p.id = a.product_id AND p.org_id = a.org_id
       LEFT JOIN content_versions cv
         ON cv.id = a.current_version_id AND cv.org_id = a.org_id
       ${where}
       ORDER BY a.updated_at DESC, a.id DESC LIMIT 500`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('[Content] list error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/content/:id — asset + all versions (with MLR review status per version)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { rows: assets } = await db.query(
      `SELECT a.*, p.name AS product_name
       FROM content_assets a
       LEFT JOIN products p ON p.id = a.product_id AND p.org_id = a.org_id
       WHERE a.id = $1 AND a.org_id = $2`,
      [id, req.org_id]
    );
    if (assets.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    const asset = assets[0];

    // For MRs, only allow viewing if at least one version is distributed to them.
    // (Owner / admin / reviewers always see.)
    if (req.user.role === 'mr') {
      const { rows: visible } = await db.query(
        `SELECT 1 FROM content_versions v
         WHERE v.asset_id = $1 AND v.org_id = $2 AND v.status = 'published'
           AND EXISTS (
             SELECT 1 FROM content_distributions d
             WHERE d.version_id = v.id AND d.org_id = v.org_id
               AND (
                    d.target_type = 'all'
                 OR (d.target_type = 'mr'        AND d.target_id = $3)
                 OR (d.target_type = 'territory' AND d.target_id = $4)
                 OR (d.target_type = 'role'      AND d.target_id = $5)
               )
           ) LIMIT 1`,
        [id, req.org_id, req.user.user_id, req.user.territory || '', req.user.role]
      );
      if (visible.length === 0) {
        return res.status(403).json({ error: 'Asset not distributed to you' });
      }
    }

    const { rows: versions } = await db.query(
      `SELECT v.*,
              (SELECT json_agg(json_build_object(
                  'reviewer_role', m.reviewer_role,
                  'decision',      m.decision,
                  'reviewer_user_id', m.reviewer_user_id,
                  'reviewed_at',   m.reviewed_at,
                  'decision_notes', m.decision_notes
                ) ORDER BY m.reviewer_role)
               FROM mlr_reviews m
               WHERE m.version_id = v.id AND m.org_id = v.org_id
              ) AS reviews,
              (SELECT COUNT(*) FROM content_claims c
               WHERE c.version_id = v.id AND c.org_id = v.org_id)::int AS claim_count,
              (SELECT COUNT(*) FROM content_claims c
               WHERE c.version_id = v.id AND c.org_id = v.org_id
                 AND c.reviewer_status = 'needs_citation')::int AS needs_citation_count
       FROM content_versions v
       WHERE v.asset_id = $1 AND v.org_id = $2
       ORDER BY v.version_number DESC`,
      [id, req.org_id]
    );

    res.json({ success: true, data: { ...asset, versions } });
  } catch (err) {
    console.error('[Content] get error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content — create a new asset + its v1
// Multipart: file (required) + form fields { title, asset_type, product_id?,
//                                            therapeutic_area?, description? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/', requireRole('manager', 'admin'), uploadContent.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
  }
  const { title, asset_type, product_id, therapeutic_area, description } = req.body;
  if (!title || !asset_type) {
    discardUpload(req.file);
    return res.status(400).json({ error: 'title and asset_type are required' });
  }
  if (!VALID_ASSET_TYPES.includes(asset_type)) {
    discardUpload(req.file);
    return res.status(400).json({ error: `asset_type must be one of: ${VALID_ASSET_TYPES.join(', ')}` });
  }

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Insert the asset first to get the id
    const { rows: assetRows } = await client.query(
      `INSERT INTO content_assets
         (org_id, title, asset_type, product_id, therapeutic_area, description, owner_user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [req.org_id, title, asset_type, product_id || null,
       therapeutic_area || null, description || null, req.user.user_id]
    );
    const asset = assetRows[0];

    // Move the uploaded file from /pending to /<asset_id>/
    const fileUrl = relocateUpload(req.file, asset.id);

    // Create v1 in draft status
    const { rows: versionRows } = await client.query(
      `INSERT INTO content_versions
         (org_id, asset_id, version_number, file_url, mime_type, file_size_bytes, status, change_notes)
       VALUES ($1, $2, 1, $3, $4, $5, 'draft', $6)
       RETURNING *`,
      [req.org_id, asset.id, fileUrl, req.file.mimetype, req.file.size,
       'Initial version.']
    );
    const version = versionRows[0];

    await client.query('COMMIT');

    // Async claim-substantiation hook — fire-and-forget. Never blocks the
    // response and never throws to caller (mirrors aeDetection pattern).
    extractAndSubstantiateClaims(version).catch(err =>
      console.error('[ContentScanner] async error on asset create:', err.message)
    );

    res.status(201).json({ success: true, data: { ...asset, versions: [version] } });
  } catch (err) {
    await client.query('ROLLBACK');
    discardUpload(req.file);
    console.error('[Content] create error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content/:id/versions — upload v2, v3, ... for an existing asset
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/versions', requireRole('manager', 'admin'), uploadContent.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'File is required' });
  }
  const { id } = req.params;
  const { change_notes, expiry_date } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify asset exists in caller's org and load owner for permission check
    const { rows: assetRows } = await client.query(
      'SELECT id, owner_user_id FROM content_assets WHERE id = $1 AND org_id = $2 FOR UPDATE',
      [id, req.org_id]
    );
    if (assetRows.length === 0) {
      await client.query('ROLLBACK');
      discardUpload(req.file);
      return res.status(404).json({ error: 'Asset not found' });
    }
    const asset = assetRows[0];
    if (req.user.role !== 'admin' && asset.owner_user_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      discardUpload(req.file);
      return res.status(403).json({ error: 'Only the asset owner or an admin can upload new versions' });
    }

    // Compute next version number
    const { rows: maxRows } = await client.query(
      `SELECT COALESCE(MAX(version_number), 0)::int AS max_v
       FROM content_versions WHERE asset_id = $1 AND org_id = $2`,
      [id, req.org_id]
    );
    const nextVersion = maxRows[0].max_v + 1;

    const { rows: versionRows } = await client.query(
      `INSERT INTO content_versions
         (org_id, asset_id, version_number, file_url, mime_type, file_size_bytes,
          status, expiry_date, change_notes)
       VALUES ($1, $2, $3, $4, $5, $6, 'draft', $7, $8)
       RETURNING *`,
      [req.org_id, id, nextVersion,
       `/uploads/content/${id}/${req.file.filename}`,
       req.file.mimetype, req.file.size,
       expiry_date || null, change_notes || null]
    );
    const newVersion = versionRows[0];

    await client.query('COMMIT');

    // Async claim-substantiation hook — fire-and-forget.
    extractAndSubstantiateClaims(newVersion).catch(err =>
      console.error('[ContentScanner] async error on version upload:', err.message)
    );

    res.status(201).json({ success: true, data: newVersion });
  } catch (err) {
    await client.query('ROLLBACK');
    discardUpload(req.file);
    console.error('[Content] version upload error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PATCH /api/content/:id — update asset metadata (owner / admin)
// ─────────────────────────────────────────────────────────────────────────────
router.patch('/:id', requireRole('manager', 'admin'), async (req, res) => {
  const { id } = req.params;
  const { title, description, therapeutic_area, owner_user_id } = req.body;

  try {
    const { rows: existing } = await db.query(
      'SELECT owner_user_id FROM content_assets WHERE id = $1 AND org_id = $2',
      [id, req.org_id]
    );
    if (existing.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    if (req.user.role !== 'admin' && existing[0].owner_user_id !== req.user.user_id) {
      return res.status(403).json({ error: 'Only the asset owner or an admin can update metadata' });
    }

    const fields = [];
    const params = [];
    if (title !== undefined)            { params.push(title);             fields.push(`title = $${params.length}`); }
    if (description !== undefined)      { params.push(description);       fields.push(`description = $${params.length}`); }
    if (therapeutic_area !== undefined) { params.push(therapeutic_area);  fields.push(`therapeutic_area = $${params.length}`); }
    if (owner_user_id !== undefined && req.user.role === 'admin') {
      params.push(owner_user_id); fields.push(`owner_user_id = $${params.length}`);
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    params.push(id, req.org_id);
    const { rows } = await db.query(
      `UPDATE content_assets SET ${fields.join(', ')}
       WHERE id = $${params.length - 1} AND org_id = $${params.length}
       RETURNING *`,
      params
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Content] update error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content/:id/versions/:vid/submit — submit a draft for MLR review
// Creates 3 mlr_reviews rows (one per role) in 'pending' status.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/versions/:vid/submit', async (req, res) => {
  const { id, vid } = req.params;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Verify asset + version + ownership + draft status (lock the row)
    const { rows: vRows } = await client.query(
      `SELECT v.*, a.owner_user_id
       FROM content_versions v
       JOIN content_assets a ON a.id = v.asset_id AND a.org_id = v.org_id
       WHERE v.id = $1 AND v.asset_id = $2 AND v.org_id = $3
       FOR UPDATE OF v`,
      [vid, id, req.org_id]
    );
    if (vRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Version not found' });
    }
    const version = vRows[0];
    if (req.user.role !== 'admin' && version.owner_user_id !== req.user.user_id) {
      await client.query('ROLLBACK');
      return res.status(403).json({ error: 'Only the asset owner or an admin can submit for review' });
    }
    if (version.status !== 'draft' && version.status !== 'changes_requested') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Cannot submit version in status '${version.status}'. Only draft or changes_requested can be submitted.`
      });
    }

    // Move version to in_review
    const { rows: updated } = await client.query(
      `UPDATE content_versions
       SET status = 'in_review', submitted_by = $1, submitted_at = NOW()
       WHERE id = $2 AND org_id = $3
       RETURNING *`,
      [req.user.user_id, vid, req.org_id]
    );

    // Reset / create one mlr_reviews row per role.
    // If the version was previously 'changes_requested', existing rows may
    // already exist — we DELETE and re-create so the new cycle starts fresh.
    await client.query(
      'DELETE FROM mlr_reviews WHERE version_id = $1 AND org_id = $2',
      [vid, req.org_id]
    );
    for (const role of ['medical', 'legal', 'regulatory']) {
      await client.query(
        `INSERT INTO mlr_reviews (org_id, version_id, reviewer_role)
         VALUES ($1, $2, $3)`,
        [req.org_id, vid, role]
      );
    }

    await client.query('COMMIT');

    // Async MLR pre-review hook — fire-and-forget. Submit succeeds regardless.
    runMlrPreReview(updated[0]).catch(err =>
      console.error('[MLRPreReview] async error on submit:', err.message)
    );

    res.json({ success: true, data: updated[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Content] submit error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content/:id/versions/:vid/publish — admin publishes an approved version
// Sets the asset's current_version_id and auto-retires the previously-published version.
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/versions/:vid/publish', requireRole('admin'), async (req, res) => {
  const { id, vid } = req.params;
  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    const { rows: vRows } = await client.query(
      `SELECT * FROM content_versions
       WHERE id = $1 AND asset_id = $2 AND org_id = $3 FOR UPDATE`,
      [vid, id, req.org_id]
    );
    if (vRows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Version not found' });
    }
    const version = vRows[0];
    if (version.status !== 'approved') {
      await client.query('ROLLBACK');
      return res.status(409).json({
        error: `Cannot publish version in status '${version.status}'. Only approved versions can be published.`
      });
    }

    // Auto-retire the currently-published version (if any)
    await client.query(
      `UPDATE content_versions SET status = 'retired', retired_at = NOW()
       WHERE asset_id = $1 AND org_id = $2 AND status = 'published'`,
      [id, req.org_id]
    );

    // Promote this version to published
    const { rows: published } = await client.query(
      `UPDATE content_versions
       SET status = 'published', published_at = NOW()
       WHERE id = $1 AND org_id = $2
       RETURNING *`,
      [vid, req.org_id]
    );

    // Update the asset's pointer
    await client.query(
      'UPDATE content_assets SET current_version_id = $1 WHERE id = $2 AND org_id = $3',
      [vid, id, req.org_id]
    );

    await client.query('COMMIT');
    res.json({ success: true, data: published[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('[Content] publish error:', err.message);
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DELETE /api/content/:id — admin deletes asset (cascade kills versions/reviews/etc)
// Files on disk are NOT deleted to preserve audit trail; orphan files can be
// reaped by a periodic cleanup job (not in scope for Phase B).
// ─────────────────────────────────────────────────────────────────────────────
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { rows } = await db.query(
      'DELETE FROM content_assets WHERE id = $1 AND org_id = $2 RETURNING id',
      [id, req.org_id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ success: true, deleted: rows[0].id });
  } catch (err) {
    console.error('[Content] delete error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// POST /api/content/:id/versions/:vid/distributions — push to an audience
// Body: { target_type: 'all' | 'mr' | 'territory' | 'role', target_id? }
// ─────────────────────────────────────────────────────────────────────────────
router.post('/:id/versions/:vid/distributions', requireRole('manager', 'admin'), async (req, res) => {
  const { id, vid } = req.params;
  const { target_type, target_id } = req.body;
  if (!target_type || !['all', 'mr', 'territory', 'role'].includes(target_type)) {
    return res.status(400).json({ error: 'target_type must be one of: all, mr, territory, role' });
  }
  if (target_type !== 'all' && !target_id) {
    return res.status(400).json({ error: 'target_id is required when target_type is not "all"' });
  }
  if (target_type === 'all' && target_id) {
    return res.status(400).json({ error: 'target_id must be omitted when target_type is "all"' });
  }

  try {
    // Confirm the version belongs to the asset within this org
    const { rows: vRows } = await db.query(
      `SELECT id FROM content_versions
       WHERE id = $1 AND asset_id = $2 AND org_id = $3`,
      [vid, id, req.org_id]
    );
    if (vRows.length === 0) {
      return res.status(404).json({ error: 'Version not found' });
    }

    const { rows } = await db.query(
      `INSERT INTO content_distributions
         (org_id, version_id, target_type, target_id, distributed_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [req.org_id, vid, target_type, target_type === 'all' ? null : target_id, req.user.user_id]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    console.error('[Content] distribute error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
