const router = require('express').Router();
const { query } = require('../config/database');
const { protect, authorize } = require('../middleware/auth.middleware');

// GET /api/categories — Public (all) or admin (include inactive)
router.get('/', async (req, res) => {
  try {
    const showAll = req.query.all === 'true';
    const where = showAll ? '' : `WHERE status='active'`;
    const result = await query(`SELECT * FROM categories ${where} ORDER BY name`);
    res.json({ success: true, categories: result.rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// POST /api/categories — Admin only
router.post('/', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const { name, description, icon } = req.body;
    const r = await query(
      `INSERT INTO categories (name, description, icon) VALUES ($1,$2,$3) RETURNING *`,
      [name, description || null, icon || '📦']
    );
    res.status(201).json({ success: true, category: r.rows[0] });
  } catch (error) {
    if (error.code === '23505') return res.status(409).json({ success: false, message: 'Category already exists.' });
    res.status(500).json({ success: false, message: 'Failed.' });
  }
});

// PUT /api/categories/:id — Admin only
router.put('/:id', protect, authorize('admin','superadmin'), async (req, res) => {
  try {
    const { name, description, icon, status } = req.body;
    const r = await query(
      `UPDATE categories SET name=COALESCE($1,name), description=COALESCE($2,description), icon=COALESCE($3,icon), status=COALESCE($4,status) WHERE id=$5 RETURNING *`,
      [name, description, icon, status, req.params.id]
    );
    res.json({ success: true, category: r.rows[0] });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// DELETE /api/categories/:id
router.delete('/:id', protect, authorize('superadmin'), async (req, res) => {
  try {
    await query('DELETE FROM categories WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Category deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

module.exports = router;
