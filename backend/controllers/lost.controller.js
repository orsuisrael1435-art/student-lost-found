// ============================================================
// Lost Items Controller
// ============================================================
const { query } = require('../config/database');
const { generateLostId } = require('../utils/generateId');
const { createNotification } = require('../utils/notification.helper');
const matchingService = require('../services/matching.service');

// POST /api/lost — Report a lost item
const createLostItem = async (req, res) => {
  try {
    const {
      item_name, category, colour, brand, description,
      lost_date, lost_time, building, room_number, specific_location, additional_info
    } = req.body;

    const lost_id = await generateLostId();
    const image_url = req.file ? `/uploads/items/${req.file.filename}` : null;

    const result = await query(
      `INSERT INTO lost_items
         (lost_id, user_id, item_name, category, colour, brand, description,
          lost_date, lost_time, building, room_number, specific_location, image_url, additional_info, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active')
       RETURNING *`,
      [lost_id, req.user.id, item_name, category, colour || null, brand || null,
       description || null, lost_date, lost_time || null, building,
       room_number || null, specific_location || null, image_url, additional_info || null]
    );

    const lostItem = result.rows[0];

    // Notify student
    await createNotification(req.user.id, '📋 Lost Report Submitted',
      `Your lost item report ${lost_id} for "${item_name}" has been submitted. We will notify you of any matches.`,
      'info', lostItem.id, 'lost');

    // Log activity
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'LOST_REPORT_SUBMITTED', `Lost report ${lost_id}: ${item_name}`]);

    // Trigger matching engine in background (don't await to keep response fast)
    matchingService.findMatchesForLostItem(lostItem).catch(err =>
      console.error('Matching error for lost item:', err.message));

    res.status(201).json({ success: true, message: 'Lost item report submitted successfully!', lost_item: lostItem });
  } catch (error) {
    console.error('Create lost item:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report. Please try again.' });
  }
};

// GET /api/lost — List all active lost items (with filters/search)
const getLostItems = async (req, res) => {
  try {
    const {
      search, category, colour, brand, building, room_number,
      status, date_from, date_to, page = 1, limit = 12, my_items
    } = req.query;

    const conditions = ['li.is_approved = true'];
    const vals = [];
    let p = 1;

    if (my_items === 'true' && req.user) {
      conditions.push(`li.user_id = $${p++}`); vals.push(req.user.id);
    } else {
      conditions.push(`li.status IN ('active','possible_match','matched')`);
    }
    if (search) { conditions.push(`(li.item_name ILIKE $${p++} OR li.description ILIKE $${p++} OR li.brand ILIKE $${p++})`); vals.push(`%${search}%`, `%${search}%`, `%${search}%`); p += 2; }
    if (category) { conditions.push(`li.category ILIKE $${p++}`); vals.push(category); }
    if (colour) { conditions.push(`li.colour ILIKE $${p++}`); vals.push(`%${colour}%`); }
    if (brand) { conditions.push(`li.brand ILIKE $${p++}`); vals.push(`%${brand}%`); }
    if (building) { conditions.push(`li.building ILIKE $${p++}`); vals.push(`%${building}%`); }
    if (room_number) { conditions.push(`li.room_number ILIKE $${p++}`); vals.push(`%${room_number}%`); }
    if (status) { conditions.push(`li.status = $${p++}`); vals.push(status); }
    if (date_from) { conditions.push(`li.lost_date >= $${p++}`); vals.push(date_from); }
    if (date_to) { conditions.push(`li.lost_date <= $${p++}`); vals.push(date_to); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const [items, total] = await Promise.all([
      query(
        `SELECT li.*, u.name AS reporter_name, u.department AS reporter_dept
         FROM lost_items li JOIN users u ON li.user_id = u.id
         ${whereClause} ORDER BY li.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
        [...vals, parseInt(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM lost_items li ${whereClause}`, vals)
    ]);

    res.json({
      success: true,
      items: items.rows,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get lost items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch lost items.' });
  }
};

// GET /api/lost/:id — Get single lost item
const getLostItem = async (req, res) => {
  try {
    const result = await query(
      `SELECT li.*, u.name AS reporter_name, u.department AS reporter_dept, u.student_id AS reporter_student_id
       FROM lost_items li JOIN users u ON li.user_id = u.id
       WHERE li.id = $1 OR li.lost_id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Lost item report not found.' });
    // Hide personal info if not owner/admin
    const item = result.rows[0];
    if (req.user?.id !== item.user_id && !['admin', 'superadmin'].includes(req.user?.role)) {
      delete item.reporter_student_id;
    }
    res.json({ success: true, item });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get item.' });
  }
};

// PUT /api/lost/:id — Update lost item
const updateLostItem = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM lost_items WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    const item = existing.rows[0];
    if (item.user_id !== req.user.id && !['admin', 'superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized to edit this report.' });
    }
    if (['returned', 'closed'].includes(item.status)) {
      return res.status(400).json({ success: false, message: 'Cannot edit a closed/returned report.' });
    }

    const fields = ['item_name','category','colour','brand','description','lost_date','lost_time','building','room_number','specific_location','additional_info'];
    const updates = [], vals = [];
    let p = 1;
    fields.forEach(f => {
      if (req.body[f] !== undefined) { updates.push(`${f}=$${p++}`); vals.push(req.body[f]); }
    });
    if (req.file) { updates.push(`image_url=$${p++}`); vals.push(`/uploads/items/${req.file.filename}`); }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No changes provided.' });

    vals.push(req.params.id);
    const result = await query(
      `UPDATE lost_items SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${p} RETURNING *`, vals
    );
    res.json({ success: true, message: 'Report updated.', item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
};

// DELETE /api/lost/:id
const deleteLostItem = async (req, res) => {
  try {
    const existing = await query('SELECT user_id, lost_id FROM lost_items WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (existing.rows[0].user_id !== req.user.id && !['admin','superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await query('DELETE FROM lost_items WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Lost item report deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }
};

// PUT /api/lost/:id/status
const updateLostItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending','active','possible_match','matched','returned','closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status.' });
    }
    const result = await query(
      'UPDATE lost_items SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *',
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, message: 'Status updated.', item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

module.exports = { createLostItem, getLostItems, getLostItem, updateLostItem, deleteLostItem, updateLostItemStatus };
