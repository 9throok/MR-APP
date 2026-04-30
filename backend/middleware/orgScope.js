const DEFAULT_ORG_ID = '00000000-0000-0000-0000-000000000001';

// Attach req.org_id from the JWT payload (set by authenticateToken).
// Falls back to the default org when a token predates the multi-tenancy
// migration so existing clients keep working during the rollout.
function attachOrgScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  req.org_id = req.user.org_id || DEFAULT_ORG_ID;
  next();
}

module.exports = { attachOrgScope, DEFAULT_ORG_ID };
