// ============================================================
// Utility: Generate unique report IDs
// ============================================================
const { query } = require('../config/database');

const generateLostId = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) FROM lost_items WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `LOST-${year}-${String(count).padStart(5, '0')}`;
};

const generateFoundId = async () => {
  const year = new Date().getFullYear();
  const result = await query(
    `SELECT COUNT(*) FROM found_items WHERE EXTRACT(YEAR FROM created_at) = $1`, [year]
  );
  const count = parseInt(result.rows[0].count) + 1;
  return `FOUND-${year}-${String(count).padStart(5, '0')}`;
};

module.exports = { generateLostId, generateFoundId };
