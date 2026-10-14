// ============================================================
// Notification Controller
// ============================================================
const { query } = require('../config/database');

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20, unread_only } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const conditions = ['user_id=$1'];
    const vals = [req.user.id];
    if (unread_only === 'true') { conditions.push('is_read=false'); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [notifs, total, unreadCount] = await Promise.all([
      query(
        `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
        [...vals, parseInt(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM notifications ${where}`, vals),
      query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [req.user.id])
    ]);

    res.json({
      success: true,
      notifications: notifs.rows,
      unread_count: parseInt(unreadCount.rows[0].count),
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.rows[0].count)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load notifications.' });
  }
};

// PUT /api/notifications/:id/read
const markAsRead = async (req, res) => {
  try {
    await query(
      'UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2',
      [req.params.id, req.user.id]
    );
    res.json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

// PUT /api/notifications/read-all
const markAllAsRead = async (req, res) => {
  try {
    await query('UPDATE notifications SET is_read=true WHERE user_id=$1 AND is_read=false', [req.user.id]);
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed.' });
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead };
