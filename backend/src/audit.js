const fs = require('fs');
const path = require('path');

const auditLogPath = path.join(__dirname, '..', 'logs', 'audit.log');

// Append-only audit log for security-relevant events (auth failures, login failures, etc).
// Logging failures must NEVER break the request path.

function logAudit(event) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      ...event,
    });
    fs.appendFileSync(auditLogPath, line + '\n', 'utf8');
  } catch {
    // Do not crash request path on logging failure
  }
}

module.exports = { logAudit };
