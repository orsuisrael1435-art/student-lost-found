require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  const hash = await bcrypt.hash('Password@123', 10);
  console.log('New hash:', hash);

  // Verify hash works
  const valid = await bcrypt.compare('Password@123', hash);
  console.log('Hash verification:', valid);

  const r = await pool.query('UPDATE users SET password_hash = $1', [hash]);
  console.log('Updated users:', r.rowCount);

  // Also check registration works by testing a bcrypt round-trip
  const regHash = await bcrypt.hash('Test@1234', 10);
  const regValid = await bcrypt.compare('Test@1234', regHash);
  console.log('Registration bcrypt test:', regValid);

  await pool.end();
  console.log('Done!');
}

fix().catch(e => { console.error(e); process.exit(1); });
