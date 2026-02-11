require('dotenv').config();

const bcrypt = require('bcryptjs');
const { pool } = require('../src/db');

async function main() {
  const username = process.argv[2];
  const password = process.argv[3];

  if (!username || !password) {
    console.log('Usage: node scripts/create-admin.js <username> <password>');
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO admin (username, password)
     VALUES ($1, $2)
     ON CONFLICT (username)
     DO UPDATE SET password = EXCLUDED.password`,
    [username, hash]
  );

  console.log(`Admin user "${username}" created/updated.`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
