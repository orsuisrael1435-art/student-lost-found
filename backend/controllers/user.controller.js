// ============================================================
// User / Dashboard Controller
// ============================================================
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');

// GET /api/users/profile
const getProfile = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.student_id, u.name, u.email, u.phone, u.department, u.year, u.section,
              u.role, u.profile_image, u.created_at,
              (SELECT COUNT(*) FROM lost_items WHERE user_id = u.id) AS total_lost,
              (SELECT COUNT(*) FROM found_items WHERE user_id = u.id) AS total_found,
              (SELECT COUNT(*) FROM lost_items WHERE user_id = u.id AND status='returned') AS items_returned
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    res.json({ success: true, profile: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load profile.' });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, year, section } = req.body;
    const fields = [], vals = [];
    let p = 1;
    if (name) { fields.push(`name=$${p++}`); vals.push(name); }
    if (phone) { fields.push(`phone=$${p++}`); vals.push(phone); }
    if (department) { fields.push(`department=$${p++}`); vals.push(department); }
    if (year) { fields.push(`year=$${p++}`); vals.push(year); }
    if (section) { fields.push(`section=$${p++}`); vals.push(section); }
    if (req.file) { fields.push(`profile_image=$${p++}`); vals.push(`/uploads/profiles/${req.file.filename}`); }
    if (!fields.length) return res.status(400).json({ success: false, message: 'No fields to update.' });
    vals.push(req.user.id);
    const r = await query(
      `UPDATE users SET ${fields.join(',')}, updated_at=NOW() WHERE id=$${p} RETURNING id,name,email,phone,department,year,section,profile_image`,
      vals
    );
    res.json({ success: true, message: 'Profile updated.', user: r.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update profile.' });
  }
};

// PUT /api/users/change-password
const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const r = await query('SELECT password_hash FROM users WHERE id=$1', [req.user.id]);
    const valid = await bcrypt.compare(current_password, r.rows[0].password_hash);
    if (!valid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const hash = await bcrypt.hash(new_password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);
    await query('UPDATE users SET password_hash=$1, updated_at=NOW() WHERE id=$2', [hash, req.user.id]);
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to change password.' });
  }
};

// GET /api/users/dashboard
const getDashboard = async (req, res) => {
  try {
    const uid = req.user.id;
    const [[lc, fc, mc, rc, un], recentLost, recentFound, activeMatches] = await Promise.all([
      Promise.all([
        query('SELECT COUNT(*) FROM lost_items WHERE user_id=$1', [uid]),
        query('SELECT COUNT(*) FROM found_items WHERE user_id=$1', [uid]),
        query(`SELECT COUNT(*) FROM matches m JOIN lost_items l ON m.lost_item_id=l.id WHERE l.user_id=$1 AND m.status NOT IN ('false_match','closed')`, [uid]),
        query(`SELECT COUNT(*) FROM lost_items WHERE user_id=$1 AND status='returned'`, [uid]),
        query('SELECT COUNT(*) FROM notifications WHERE user_id=$1 AND is_read=false', [uid])
      ]),
      query(`SELECT id,lost_id,item_name,category,colour,brand,building,room_number,lost_date,status,image_url,created_at FROM lost_items WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [uid]),
      query(`SELECT id,found_id,item_name,category,colour,brand,building,room_number,found_date,status,image_url,created_at FROM found_items WHERE user_id=$1 ORDER BY created_at DESC LIMIT 5`, [uid]),
      query(`SELECT m.id,m.match_score,m.status AS match_status,l.item_name AS lost_item_name,l.lost_id,l.colour,fi.item_name AS found_item_name,fi.found_id,fi.building,fi.room_number FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id WHERE l.user_id=$1 AND m.status NOT IN ('false_match','closed') ORDER BY m.match_score DESC LIMIT 5`, [uid])
    ]);

    res.json({
      success: true,
      dashboard: {
        stats: {
          my_lost_items: parseInt(lc.rows[0].count),
          my_found_items: parseInt(fc.rows[0].count),
          possible_matches: parseInt(mc.rows[0].count),
          returned_items: parseInt(rc.rows[0].count),
          unread_notifications: parseInt(un.rows[0].count)
        },
        recent_lost: recentLost.rows,
        recent_found: recentFound.rows,
        active_matches: activeMatches.rows
      }
    });
  } catch (error) {
    console.error('Dashboard:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, getDashboard };
