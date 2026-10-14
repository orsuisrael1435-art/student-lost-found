// ============================================================
// Database Initializer — runs schema + seed on first deploy
// Usage: node scripts/init-db.js
// ============================================================
require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

async function init() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running database schema...');
    const schema = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Schema created');

    console.log('🔄 Running seed data...');
    const seed = fs.readFileSync(path.join(__dirname, '../../database/seed.sql'), 'utf8');
    await client.query(seed);
    console.log('✅ Seed data inserted');

    console.log('\n🎉 Database initialized successfully!');
    console.log('Demo credentials:');
    console.log('  Student:    israel@college.edu / Password@123');
    console.log('  Admin:      admin@college.edu  / Password@123');
    console.log('  SuperAdmin: superadmin@college.edu / Password@123');
  } catch (err) {
    console.error('❌ Init error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

init();
