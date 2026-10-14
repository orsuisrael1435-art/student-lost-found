const router = require('express').Router();
const {
  getDashboard, getUsers, toggleUserActive, updateUserRole,
  approveReport, rejectReport, getAnalytics, triggerMatching, deleteUser
} = require('../controllers/admin.controller');
const { protect, authorize } = require('../middleware/auth.middleware');
const { query } = require('../config/database');

const adminAuth = [protect, authorize('admin', 'superadmin')];

router.get('/dashboard', ...adminAuth, getDashboard);
router.get('/analytics', ...adminAuth, getAnalytics);
router.get('/users', ...adminAuth, getUsers);
router.put('/users/:id/toggle-active', ...adminAuth, toggleUserActive);
router.put('/users/:id/role', ...adminAuth, updateUserRole);
router.delete('/users/:id', ...adminAuth, deleteUser);
router.put('/reports/:id/approve', ...adminAuth, approveReport);
router.put('/reports/:id/reject', ...adminAuth, rejectReport);
router.post('/run-matching', ...adminAuth, triggerMatching);

// GET all lost items for admin
router.get('/lost', ...adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = [];
    const vals = [];
    let p = 1;
    if (status) { conditions.push(`li.status=$${p++}`); vals.push(status); }
    if (search) { conditions.push(`(li.item_name ILIKE $${p} OR li.lost_id ILIKE $${p+1})`); vals.push(`%${search}%`, `%${search}%`); p += 2; }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const result = await query(
      `SELECT li.*, u.name AS student_name, u.student_id AS student_roll FROM lost_items li JOIN users u ON li.user_id=u.id ${where} ORDER BY li.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
      [...vals, parseInt(limit), offset]
    );
    const total = await query(`SELECT COUNT(*) FROM lost_items li ${where}`, vals);
    res.json({ success: true, items: result.rows, pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// GET all found items for admin
router.get('/found', ...adminAuth, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const result = await query(
      `SELECT fi.*, u.name AS student_name, u.student_id AS student_roll FROM found_items fi JOIN users u ON fi.user_id=u.id ORDER BY fi.created_at DESC LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );
    const total = await query(`SELECT COUNT(*) FROM found_items`);
    res.json({ success: true, items: result.rows, pagination: { total: parseInt(total.rows[0].count), page: parseInt(page), limit: parseInt(limit) } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// GET all matches for admin
router.get('/matches', ...adminAuth, async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, l.lost_id, l.item_name AS lost_name, fi.found_id, fi.item_name AS found_name,
              ou.name AS owner_name, fu.name AS finder_name
       FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
       JOIN users ou ON l.user_id=ou.id JOIN users fu ON fi.user_id=fu.id
       ORDER BY m.created_at DESC LIMIT 50`
    );
    res.json({ success: true, matches: result.rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

// GET activity logs for admin
router.get('/activity-logs', ...adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const result = await query(
      `SELECT al.*, u.name AS user_name, u.role FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id ORDER BY al.created_at DESC LIMIT $1`,
      [parseInt(limit)]
    );
    res.json({ success: true, logs: result.rows });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed.' }); }
});

module.exports = router;
