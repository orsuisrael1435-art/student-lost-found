// ============================================================
// Database Configuration - PostgreSQL Connection Pool
// Supports both DATABASE_URL (Render/Railway) and individual vars
// ============================================================
const { Pool } = require('pg');

let poolConfig;

if (process.env.DATABASE_URL) {
  // Render / Railway / Heroku style — full connection string
  poolConfig = {
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  };
} else {
  // Local development — individual env vars
  poolConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'student_lost_found',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  };
}

const pool = new Pool(poolConfig);

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection error:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

// Helper query function
const query = async (text, params) => {
  try {
    const res = await pool.query(text, params);
    return res;
  } catch (error) {
    console.error('Database query error:', { text: text.substring(0, 80), error: error.message });
    throw error;
  }
};

const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
