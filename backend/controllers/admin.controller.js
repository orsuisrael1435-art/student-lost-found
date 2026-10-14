// ============================================================
// Admin Controller - Dashboard, User & Report Management
// ============================================================
const { query } = require('../config/database');
const { runFullMatching } = require('../services/matching.service');
const { createNotification } = require('../utils/notification.helper');

// GET /api/admin/dashboard
const getDashboard = async (req, res) => {
  try {
    const [totalStudents, totalLost, totalFound, totalMatches, returned, pending] = await Promise.all([
      query(`SELECT COUNT(*) FROM users WHERE role='student'`),
      query(`SELECT COUNT(*) FROM lost_items`),
      query(`SELECT COUNT(*) FROM found_items`),
      query(`SELECT COUNT(*) FROM matches`),
      query(`SELECT COUNT(*) FROM matches WHERE status='returned'`),
      query(`SELECT COUNT(*) FROM lost_items WHERE status='pending'`)
    ]);

    // Items by category
    const lostByCategory = await query(
      `SELECT category, COUNT(*) as count FROM lost_items GROUP BY category ORDER BY count DESC`
    );
    const foundByCategory = await query(
      `SELECT category, COUNT(*) as count FROM found_items GROUP BY category ORDER BY count DESC`
    );

    // Items by building
    const byBuilding = await query(
      `SELECT building, COUNT(*) as lost_count FROM lost_items GROUP BY building ORDER BY lost_count DESC LIMIT 8`
    );

    // Monthly trend (last 6 months)
    const monthlyTrend = await query(
      `SELECT TO_CHAR(created_at,'YYYY-MM') AS month,
              COUNT(CASE WHEN TRUE THEN 1 END) AS count, 'lost' AS type
       FROM lost_items WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY month
       UNION ALL
       SELECT TO_CHAR(created_at,'YYYY-MM') AS month,
              COUNT(*) AS count, 'found' AS type
       FROM found_items WHERE created_at >= NOW() - INTERVAL '6 months'
       GROUP BY month
       ORDER BY month`
    );

    // Recent activity logs
    const recentActivity = await query(
      `SELECT al.*, u.name AS user_name, u.role AS user_role
       FROM activity_logs al LEFT JOIN users u ON al.user_id=u.id
       ORDER BY al.created_at DESC LIMIT 15`
    );

    // Return rate
    const returnRate = totalMatches.rows[0].count > 0
      ? ((parseInt(returned.rows[0].count) / parseInt(totalMatches.rows[0].count)) * 100).toFixed(1)
      : 0;

    res.json({
      success: true,
      dashboard: {
        stats: {
          total_students: parseInt(totalStudents.rows[0].count),
          total_lost: parseInt(totalLost.rows[0].count),
          total_found: parseInt(totalFound.rows[0].count),
          total_matches: parseInt(totalMatches.rows[0].count),
          returned: parseInt(returned.rows[0].count),
          pending_approval: parseInt(pending.rows[0].count),
          return_rate: parseFloat(returnRate)
        },
        lost_by_category: lostByCategory.rows,
        found_by_category: foundByCategory.rows,
        by_building: byBuilding.rows,
        monthly_trend: monthlyTrend.rows,
        recent_activity: recentActivity.rows
      }
    });
  } catch (error) {
    console.error('Admin dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

// GET /api/admin/users
const getUsers = async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20, is_active } = req.query;
    const conditions = [];
    const vals = [];
    let p = 1;

    if (search) {
      conditions.push(`(u.name ILIKE $${p} OR u.email ILIKE $${p+1} OR u.student_id ILIKE $${p+2})`);
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`); p += 3;
    }
    if (role) { conditions.push(`u.role=$${p++}`); vals.push(role); }
    if (is_active !== undefined) { conditions.push(`u.is_active=$${p++}`); vals.push(is_active === 'true'); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      query(
        `SELECT u.id, u.student_id, u.name, u.email, u.phone, u.department, u.year, u.section,
                u.role, u.is_active, u.profile_image, u.created_at,
                (SELECT COUNT(*) FROM lost_items WHERE user_id=u.id) AS lost_count,
                (SELECT COUNT(*) FROM found_items WHERE user_id=u.id) AS found_count
         FROM users u ${where} ORDER BY u.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
        [...vals, parseInt(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM users u ${where}`, vals)
    ]);

    res.json({
      success: true, users: users.rows,
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total.rows[0].count) }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load users.' });
  }
};

// PUT /api/admin/users/:id/toggle-active
const toggleUserActive = async (req, res) => {
  try {
    const result = await query(
      'UPDATE users SET is_active=NOT is_active, updated_at=NOW() WHERE id=$1 RETURNING id, name, is_active',
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    const user = result.rows[0];
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'ADMIN_TOGGLE_USER', `${user.is_active ? 'Activated' : 'Deactivated'} user: ${user.name}`]);
    res.json({ success: true, message: `User ${user.is_active ? 'activated' : 'deactivated'}.`, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to toggle user status.' });
  }
};

// PUT /api/admin/users/:id/role — Super admin can change roles
const updateUserRole = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, message: 'Super Admin only.' });
    }
    const { role } = req.body;
    if (!['student','admin','superadmin'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid role.' });
    }
    const result = await query(
      'UPDATE users SET role=$1, updated_at=NOW() WHERE id=$2 RETURNING id, name, role',
      [role, req.params.id]
    );
    res.json({ success: true, message: 'Role updated.', user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
};

// PUT /api/admin/reports/:id/approve
const approveReport = async (req, res) => {
  try {
    const { type } = req.body; // 'lost' or 'found'
    const table = type === 'lost' ? 'lost_items' : 'found_items';
    await query(`UPDATE ${table} SET is_approved=true, status='active', updated_at=NOW() WHERE id=$1`, [req.params.id]);
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'ADMIN_APPROVE_REPORT', `Approved ${type} report id=${req.params.id}`]);
    res.json({ success: true, message: 'Report approved.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to approve report.' });
  }
};

// PUT /api/admin/reports/:id/reject
const rejectReport = async (req, res) => {
  try {
    const { type, reason } = req.body;
    const table = type === 'lost' ? 'lost_items' : 'found_items';
    const r = await query(`UPDATE ${table} SET is_approved=false, status='closed', updated_at=NOW() WHERE id=$1 RETURNING user_id, item_name`, [req.params.id]);
    if (r.rows.length) {
      await createNotification(r.rows[0].user_id, '❌ Report Rejected',
        `Your ${type} item report for "${r.rows[0].item_name}" was rejected by admin. Reason: ${reason || 'Policy violation'}`,
        'admin');
    }
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'ADMIN_REJECT_REPORT', `Rejected ${type} report id=${req.params.id}. Reason: ${reason}`]);
    res.json({ success: true, message: 'Report rejected.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to reject report.' });
  }
};

// GET /api/admin/analytics
const getAnalytics = async (req, res) => {
  try {
    const [topCategories, topBuildings, avgMatchScore, successRate, weeklyReports] = await Promise.all([
      query(`SELECT category, COUNT(*) FROM lost_items GROUP BY category ORDER BY count DESC LIMIT 5`),
      query(`SELECT building, COUNT(*) as reports FROM lost_items GROUP BY building ORDER BY reports DESC LIMIT 5`),
      query(`SELECT ROUND(AVG(match_score),2) AS avg FROM matches`),
      query(`SELECT
               COUNT(*) FILTER(WHERE status='returned') AS returned,
               COUNT(*) AS total FROM matches`),
      query(`SELECT TO_CHAR(created_at,'YYYY-MM-DD') AS day, COUNT(*) AS count, 'lost' AS type
             FROM lost_items WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY day
             UNION ALL
             SELECT TO_CHAR(created_at,'YYYY-MM-DD') AS day, COUNT(*) AS count, 'found' AS type
             FROM found_items WHERE created_at >= NOW() - INTERVAL '7 days' GROUP BY day
             ORDER BY day`)
    ]);
    res.json({
      success: true,
      analytics: {
        top_categories: topCategories.rows,
        top_buildings: topBuildings.rows,
        avg_match_score: parseFloat(avgMatchScore.rows[0].avg || 0),
        success_rate: successRate.rows[0],
        weekly_reports: weeklyReports.rows
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load analytics.' });
  }
};

// POST /api/admin/run-matching
const triggerMatching = async (req, res) => {
  try {
    const count = await runFullMatching();
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'ADMIN_RUN_MATCHING', `Manual matching run. ${count} new matches.`]);
    res.json({ success: true, message: `Matching complete. ${count} new matches created.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Matching failed.' });
  }
};

// DELETE /api/admin/users/:id
const deleteUser = async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') return res.status(403).json({ success: false, message: 'Super Admin only.' });
    if (parseInt(req.params.id) === req.user.id) return res.status(400).json({ success: false, message: 'Cannot delete yourself.' });
    const r = await query('DELETE FROM users WHERE id=$1 RETURNING name', [req.params.id]);
    if (!r.rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'ADMIN_DELETE_USER', `Deleted user: ${r.rows[0].name}`]);
    res.json({ success: true, message: 'User deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
};

module.exports = {
  getDashboard, getUsers, toggleUserActive, updateUserRole,
  approveReport, rejectReport, getAnalytics, triggerMatching, deleteUser
};
