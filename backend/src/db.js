const { Pool } = require('pg');

/*
  Postgres access.

  - Uses a lazily-created pg Pool so importing modules doesn't require DATABASE_URL.
  - Routes decide whether to use Postgres or the demo mock store.
  - DATABASE_URL format:
      postgresql://USER:PASSWORD@HOST:PORT/DBNAME
*/

let poolInstance = null;

function ensurePool() {
  if (poolInstance) return poolInstance;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    // We intentionally throw here (instead of creating a pool) so callers can
    // decide whether to run in demo mode vs error out.
    throw new Error('DATABASE_URL is required');
  }

  poolInstance = new Pool({
    connectionString,
    // Render and similar platforms often require SSL for managed Postgres.
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  });

  return poolInstance;
}

const pool = {
  // Use like: `await pool.query('SELECT ... WHERE id=$1', [id])`
  query: (...args) => ensurePool().query(...args),
  end: (...args) => (poolInstance ? poolInstance.end(...args) : Promise.resolve()),
};

module.exports = { pool };
