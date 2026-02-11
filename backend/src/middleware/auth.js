const jwt = require('jsonwebtoken');
const { logAudit } = require('../audit');

// Protect admin-only endpoints using a Bearer JWT.
// Expected header: Authorization: Bearer <token>
//
// Why 403 (instead of 401)?
// - This API treats all auth failures the same to avoid leaking whether a token
//   is missing vs invalid (simple hardening). Either is acceptable for an MVP.
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice('Bearer '.length) : null;

  if (!token) {
    logAudit({ type: 'auth_missing', ip: req.ip, path: req.originalUrl });
    return res.status(403).json({ message: 'Access denied' });
  }

  try {
    // Verifies signature + expiration.
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (!payload || payload.role !== 'admin') {
      logAudit({ type: 'auth_invalid_role', ip: req.ip, path: req.originalUrl });
      return res.status(403).json({ message: 'Access denied' });
    }

    req.user = payload;
    return next();
  } catch (err) {
    // Do not leak verification details to clients.
    logAudit({ type: 'auth_invalid_token', ip: req.ip, path: req.originalUrl, detail: String(err.message || err) });
    return res.status(403).json({ message: 'Access denied' });
  }
}

module.exports = { requireAdmin };
