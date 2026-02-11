// Frontend runtime configuration.
//
// Netlify build overwrites this file via `deploy/write-frontend-config.js` using the `API_BASE`
// environment variable.
//
// Local dev: the backend can serve this frontend (same-origin), so API_BASE should be empty.
// Production: if this file is NOT overwritten (e.g., you opened the static files elsewhere),
// default to same-origin.
(function () {
	const isLocal = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
	window.API_BASE = isLocal ? '' : '';
})();
