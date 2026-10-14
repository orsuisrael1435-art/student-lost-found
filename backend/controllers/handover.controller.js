// ============================================================
// Handover Controller
// ============================================================
const { query } = require('../config/database');
const { notifyHandoverScheduled, notifyItemReturned } = require('../utils/notification.helper');

// POST /api/handovers — Schedule a handover
const scheduleHandover = async (req, res) => {
  try {
    const { match_id, location, handover_date, handover_time, notes } = req.body;

    const matchRes = await query(
      `SELECT m.*, l.user_id AS owner_id, fi.user_id AS finder_id, l.item_name AS lost_name
       FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
       WHERE m.id=$1`, [match_id]
    );
    if (!matchRes.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });
    const match = matchRes.rows[0];

    if (match.owner_id !== req.user.id && match.finder_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Not a participant.' });
    }
    if (!['contact_accepted','verifying'].includes(match.status)) {
      return res.status(400).json({ success: false, message: 'Handover can only be scheduled after contact is accepted.' });
    }

    // Check for existing handover
    const existing = await query('SELECT id FROM handovers WHERE match_id=$1', [match_id]);
    if (existing.rows.length) return res.status(400).json({ success: false, message: 'Handover already scheduled.' });

    const result = await query(
      `INSERT INTO handovers (match_id, finder_id, owner_id, location, handover_date, handover_time, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [match_id, match.finder_id, match.owner_id, location, handover_date, handover_time, notes || null]
    );

    await query(`UPDATE matches SET status='handover_scheduled', updated_at=NOW() WHERE id=$1`, [match_id]);

    const dateStr = `${handover_date} at ${handover_time}`;
    await notifyHandoverScheduled(match.owner_id, location, dateStr, match_id);
    await notifyHandoverScheduled(match.finder_id, location, dateStr, match_id);

    res.status(201).json({ success: true, message: 'Handover scheduled!', handover: result.rows[0] });
  } catch (error) {
    console.error('Schedule handover:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule handover.' });
  }
};

// GET /api/handovers
const getHandovers = async (req, res) => {
  try {
    const uid = req.user.id;
    const result = await query(
      `SELECT h.*, m.match_score,
              l.item_name AS item_name, l.lost_id,
              ou.name AS owner_name, fu.name AS finder_name
       FROM handovers h
       JOIN matches m ON h.match_id=m.id
       JOIN lost_items l ON m.lost_item_id=l.id
       JOIN users ou ON h.owner_id=ou.id
       JOIN users fu ON h.finder_id=fu.id
       WHERE h.owner_id=$1 OR h.finder_id=$1
       ORDER BY h.handover_date DESC`,
      [uid]
    );
    res.json({ success: true, handovers: result.rows });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to load handovers.' });
  }
};

// PUT /api/handovers/:id/confirm — Confirm item was handed over
const confirmHandover = async (req, res) => {
  try {
    const { role } = req.body; // 'owner' or 'finder'
    const uid = req.user.id;

    const handover = await query('SELECT * FROM handovers WHERE id=$1', [req.params.id]);
    if (!handover.rows.length) return res.status(404).json({ success: false, message: 'Handover not found.' });
    const h = handover.rows[0];

    let updateField, confirmAt;
    if (uid === h.owner_id) { updateField = 'owner_confirmed'; confirmAt = 'owner_confirmed_at'; }
    else if (uid === h.finder_id) { updateField = 'finder_confirmed'; confirmAt = 'finder_confirmed_at'; }
    else return res.status(403).json({ success: false, message: 'Not authorized.' });

    await query(
      `UPDATE handovers SET ${updateField}=true, ${confirmAt}=NOW(), updated_at=NOW() WHERE id=$1`,
      [req.params.id]
    );

    // Check if both parties confirmed
    const updated = await query('SELECT * FROM handovers WHERE id=$1', [req.params.id]);
    const upd = updated.rows[0];

    if (upd.owner_confirmed && upd.finder_confirmed) {
      await query(`UPDATE handovers SET status='completed', updated_at=NOW() WHERE id=$1`, [req.params.id]);
      await query(`UPDATE matches SET status='returned', updated_at=NOW() WHERE id=$1`, [upd.match_id]);
      
      // Get item name for notifications
      const matchInfo = await query(
        `SELECT l.item_name, l.user_id AS owner_id, fi.user_id AS finder_id
         FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
         WHERE m.id=$1`, [upd.match_id]
      );
      if (matchInfo.rows.length) {
        const { item_name, owner_id, finder_id } = matchInfo.rows[0];
        await Promise.all([
          query(`UPDATE lost_items SET status='returned', updated_at=NOW() WHERE user_id=$1 AND status='matched'`, [owner_id]),
          query(`UPDATE found_items SET status='returned', updated_at=NOW() WHERE user_id=$1 AND status='matched'`, [finder_id])
        ]);
        await notifyItemReturned(owner_id, item_name);
        await notifyItemReturned(finder_id, item_name);
      }
      return res.json({ success: true, message: '🎉 Both parties confirmed! Item marked as RETURNED.' });
    }

    res.json({ success: true, message: 'Confirmation recorded. Waiting for the other party to confirm.' });
  } catch (error) {
    console.error('Confirm handover:', error);
    res.status(500).json({ success: false, message: 'Failed to confirm handover.' });
  }
};

module.exports = { scheduleHandover, getHandovers, confirmHandover };
