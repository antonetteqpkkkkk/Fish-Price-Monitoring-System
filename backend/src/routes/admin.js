const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const { pool } = require('../db');
const { handleValidation } = require('../middleware/validation');
const { logAudit } = require('../audit');

/*
  Admin routes.

  - POST /api/admin/login
    Validates credentials, then returns a JWT token.

  Demo mode:
  - Enabled when DATABASE_URL is not set and NODE_ENV != production.
  - Uses DEMO_ADMIN_USER/DEMO_ADMIN_PASS (defaults: admin/admin123).
  - Still issues a JWT so the admin UI works end-to-end without Postgres.
*/

const router = express.Router();

// Wrap async route handlers so thrown errors go to Express' error middleware.
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

router.post(
  '/login',
  [
    body('username').isString().trim().isLength({ min: 1, max: 100 }),
    body('password').isString().isLength({ min: 1, max: 200 }),
  ],
  handleValidation,
  asyncHandler(async (req, res) => {
    const { username, password } = req.body;

    const isProd = process.env.NODE_ENV === 'production';
    const demoMode = !isProd && !process.env.DATABASE_URL;

    if (demoMode) {
      // Demo mode is meant for development only.
      // It allows the full admin UI flow (login -> JWT -> CRUD) without Postgres.
      const demoUser = process.env.DEMO_ADMIN_USER || 'admin';
      const demoPass = process.env.DEMO_ADMIN_PASS || 'admin123';

      if (username !== demoUser || password !== demoPass) {
        // Audit login failures for visibility (helpful during deployment / security review).
        logAudit({ type: 'login_failed_demo', ip: req.ip, path: req.originalUrl, detail: 'bad_demo_credentials' });
        return res.status(403).json({ message: 'Access denied' });
      }

      const token = jwt.sign(
        // JWT payload:
        // - `sub`: subject identifier
        // - `role`: checked by requireAdmin middleware
        { sub: 'demo-admin', username: demoUser, role: 'admin', demo: true },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
      );

      return res.json({ token, username: demoUser, demoMode: true });
    }

    // Normal mode: authenticate against the admin table in Postgres.
    const result = await pool.query('SELECT id, username, password FROM admin WHERE username = $1 LIMIT 1', [username]);
    const admin = result.rows[0];

    if (!admin) {
      logAudit({ type: 'login_failed', ip: req.ip, path: req.originalUrl, detail: 'unknown_user' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const ok = await bcrypt.compare(password, admin.password);
    if (!ok) {
      logAudit({ type: 'login_failed', ip: req.ip, path: req.originalUrl, detail: 'bad_password' });
      return res.status(403).json({ message: 'Access denied' });
    }

    const token = jwt.sign(
      // Production/DB mode token identifies the admin row by id.
      { sub: String(admin.id), username: admin.username, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );

    return res.json({ token, username: admin.username });
  })
);

module.exports = { adminRouter: router };
