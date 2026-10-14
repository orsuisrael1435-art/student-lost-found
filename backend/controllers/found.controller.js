// ============================================================
// Found Items Controller
// ============================================================
const { query } = require('../config/database');
const { generateFoundId } = require('../utils/generateId');
const { createNotification } = require('../utils/notification.helper');
const matchingService = require('../services/matching.service');

// POST /api/found
const createFoundItem = async (req, res) => {
  try {
    const {
      item_name, category, colour, brand, description,
      found_date, found_time, building, room_number, specific_location, additional_details
    } = req.body;

    const found_id = await generateFoundId();
    const image_url = req.file ? `/uploads/items/${req.file.filename}` : null;

    const result = await query(
      `INSERT INTO found_items
         (found_id, user_id, item_name, category, colour, brand, description,
          found_date, found_time, building, room_number, specific_location, image_url, additional_details, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'active') RETURNING *`,
      [found_id, req.user.id, item_name, category, colour || null, brand || null,
       description || null, found_date, found_time || null, building,
       room_number || null, specific_location || null, image_url, additional_details || null]
    );

    const foundItem = result.rows[0];

    await createNotification(req.user.id, '✅ Found Report Submitted',
      `Your found item report ${found_id} for "${item_name}" has been submitted. Thank you for helping!`,
      'info', foundItem.id, 'found');

    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'FOUND_REPORT_SUBMITTED', `Found report ${found_id}: ${item_name}`]);

    matchingService.findMatchesForFoundItem(foundItem).catch(err =>
      console.error('Matching error for found item:', err.message));

    res.status(201).json({ success: true, message: 'Found item report submitted! Thank you.', found_item: foundItem });
  } catch (error) {
    console.error('Create found item:', error);
    res.status(500).json({ success: false, message: 'Failed to submit report.' });
  }
};

// GET /api/found
const getFoundItems = async (req, res) => {
  try {
    const {
      search, category, colour, brand, building, room_number,
      status, date_from, date_to, page = 1, limit = 12, my_items
    } = req.query;

    const conditions = ['fi.is_approved = true'];
    const vals = [];
    let p = 1;

    if (my_items === 'true' && req.user) {
      conditions.push(`fi.user_id = $${p++}`); vals.push(req.user.id);
    } else {
      conditions.push(`fi.status IN ('active','possible_match','owner_contacted')`);
    }
    if (search) {
      conditions.push(`(fi.item_name ILIKE $${p} OR fi.description ILIKE $${p+1} OR fi.brand ILIKE $${p+2})`);
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`); p += 3;
    }
    if (category) { conditions.push(`fi.category ILIKE $${p++}`); vals.push(category); }
    if (colour) { conditions.push(`fi.colour ILIKE $${p++}`); vals.push(`%${colour}%`); }
    if (brand) { conditions.push(`fi.brand ILIKE $${p++}`); vals.push(`%${brand}%`); }
    if (building) { conditions.push(`fi.building ILIKE $${p++}`); vals.push(`%${building}%`); }
    if (room_number) { conditions.push(`fi.room_number ILIKE $${p++}`); vals.push(`%${room_number}%`); }
    if (status) { conditions.push(`fi.status = $${p++}`); vals.push(status); }
    if (date_from) { conditions.push(`fi.found_date >= $${p++}`); vals.push(date_from); }
    if (date_to) { conditions.push(`fi.found_date <= $${p++}`); vals.push(date_to); }

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [items, total] = await Promise.all([
      query(
        `SELECT fi.id, fi.found_id, fi.item_name, fi.category, fi.colour, fi.brand,
                fi.description, fi.found_date, fi.found_time, fi.building, fi.room_number,
                fi.specific_location, fi.image_url, fi.status, fi.created_at,
                fi.user_id, u.department AS finder_dept
         FROM found_items fi JOIN users u ON fi.user_id = u.id
         ${where} ORDER BY fi.created_at DESC LIMIT $${p++} OFFSET $${p++}`,
        [...vals, parseInt(limit), offset]
      ),
      query(`SELECT COUNT(*) FROM found_items fi ${where}`, vals)
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
    console.error('Get found items:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch found items.' });
  }
};

// GET /api/found/:id
const getFoundItem = async (req, res) => {
  try {
    const result = await query(
      `SELECT fi.*, u.department AS finder_dept FROM found_items fi
       JOIN users u ON fi.user_id = u.id WHERE fi.id=$1 OR fi.found_id=$1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Found item not found.' });

    const item = result.rows[0];
    // Privacy: Never expose finder personal details publicly
    const safeItem = {
      ...item,
      finder_name: undefined,
      finder_phone: undefined,
      finder_email: undefined
    };
    res.json({ success: true, item: safeItem });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get item.' });
  }
};

// PUT /api/found/:id
const updateFoundItem = async (req, res) => {
  try {
    const existing = await query('SELECT * FROM found_items WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    const item = existing.rows[0];
    if (item.user_id !== req.user.id && !['admin','superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }

    const fields = ['item_name','category','colour','brand','description','found_date','found_time','building','room_number','specific_location','additional_details'];
    const updates = [], vals = [];
    let p = 1;
    fields.forEach(f => { if (req.body[f] !== undefined) { updates.push(`${f}=$${p++}`); vals.push(req.body[f]); } });
    if (req.file) { updates.push(`image_url=$${p++}`); vals.push(`/uploads/items/${req.file.filename}`); }
    if (!updates.length) return res.status(400).json({ success: false, message: 'No changes provided.' });

    vals.push(req.params.id);
    const result = await query(
      `UPDATE found_items SET ${updates.join(',')}, updated_at=NOW() WHERE id=$${p} RETURNING *`, vals
    );
    res.json({ success: true, message: 'Found item report updated.', item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report.' });
  }
};

// DELETE /api/found/:id
const deleteFoundItem = async (req, res) => {
  try {
    const existing = await query('SELECT user_id FROM found_items WHERE id=$1', [req.params.id]);
    if (!existing.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    if (existing.rows[0].user_id !== req.user.id && !['admin','superadmin'].includes(req.user.role)) {
      return res.status(403).json({ success: false, message: 'Not authorized.' });
    }
    await query('DELETE FROM found_items WHERE id=$1', [req.params.id]);
    res.json({ success: true, message: 'Found item report deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete report.' });
  }
};

// PUT /api/found/:id/status
const updateFoundItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const valid = ['pending','active','possible_match','owner_contacted','returned','closed'];
    if (!valid.includes(status)) return res.status(400).json({ success: false, message: 'Invalid status.' });
    const result = await query(
      'UPDATE found_items SET status=$1, updated_at=NOW() WHERE id=$2 RETURNING *', [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Report not found.' });
    res.json({ success: true, message: 'Status updated.', item: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
};

module.exports = { createFoundItem, getFoundItems, getFoundItem, updateFoundItem, deleteFoundItem, updateFoundItemStatus };
