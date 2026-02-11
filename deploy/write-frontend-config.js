const fs = require('fs');
const path = require('path');

function jsStringLiteral(value) {
  // Use JSON string escaping (safe for embedding into a JS string literal).
  // This avoids breaking config.js if API_BASE contains quotes or special chars.
  return JSON.stringify(String(value));
}

const apiBase = process.env.API_BASE || '';

const outPath = path.join(__dirname, '..', 'frontend', 'config.js');
const contents = `// Auto-generated at build time.\n// Netlify: set env var API_BASE to your backend URL (e.g. https://isdapresyo-backend.onrender.com)\n// Local dev: always use same-origin (so localhost uses the local backend).\n(function () {\n  const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';\n  if (isLocal) {\n    window.API_BASE = '';\n    return;\n  }\n\n  window.API_BASE = ${jsStringLiteral(apiBase)};\n})();\n`;

fs.writeFileSync(outPath, contents, 'utf8');
console.log(`Wrote ${outPath} (API_BASE=${apiBase || '(empty)'})`);
