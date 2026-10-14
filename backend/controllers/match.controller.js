// ============================================================
// Match Controller - Handle match workflow & contact requests
// ============================================================
const { query } = require('../config/database');
const {
  notifyContactRequest, notifyContactAccepted,
  notifyContactRejected, notifyItemReturned
} = require('../utils/notification.helper');
const { runFullMatching } = require('../services/matching.service');

// GET /api/matches — Get all matches for the current user
const getMatches = async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const uid = req.user.id;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const conditions = [`(l.user_id = $1 OR fi.user_id = $1)`];
    const vals = [uid];
    let p = 2;
    if (status) { conditions.push(`m.status = $${p++}`); vals.push(status); }

    const where = `WHERE ${conditions.join(' AND ')}`;

    const result = await query(
      `SELECT m.id, m.match_score, m.match_breakdown, m.match_reason, m.status AS match_status,
              m.created_at AS matched_at,
              l.id AS lost_item_id, l.lost_id, l.item_name AS lost_item_name,
              l.category, l.colour, l.brand, l.image_url AS lost_image,
              l.building, l.room_number, l.lost_date, l.status AS lost_status,
              l.user_id AS owner_id,
              fi.id AS found_item_id, fi.found_id, fi.item_name AS found_item_name,
              fi.image_url AS found_image, fi.found_date, fi.status AS found_status,
              fi.user_id AS finder_id,
              ou.name AS owner_name, ou.department AS owner_dept,
              fu.name AS finder_name, fu.department AS finder_dept
       FROM matches m
       JOIN lost_items l ON m.lost_item_id = l.id
       JOIN found_items fi ON m.found_item_id = fi.id
       JOIN users ou ON l.user_id = ou.id
       JOIN users fu ON fi.user_id = fu.id
       ${where}
       ORDER BY m.match_score DESC, m.created_at DESC
       LIMIT $${p++} OFFSET $${p++}`,
      [...vals, parseInt(limit), offset]
    );

    const total = await query(
      `SELECT COUNT(*) FROM matches m
       JOIN lost_items l ON m.lost_item_id=l.id
       JOIN found_items fi ON m.found_item_id=fi.id
       ${where}`, vals
    );

    // Sanitize: hide personal details based on role
    const matches = result.rows.map(m => {
      const isOwner = m.owner_id === uid;
      const isFinder = m.finder_id === uid;
      if (!isOwner && !isFinder && req.user.role === 'student') {
        m.owner_name = 'Anonymous Student';
        m.finder_name = 'Anonymous Student';
      }
      return m;
    });

    res.json({
      success: true, matches,
      pagination: {
        page: parseInt(page), limit: parseInt(limit),
        total: parseInt(total.rows[0].count),
        pages: Math.ceil(parseInt(total.rows[0].count) / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Get matches:', error);
    res.status(500).json({ success: false, message: 'Failed to load matches.' });
  }
};

// GET /api/matches/:id — Single match detail
const getMatch = async (req, res) => {
  try {
    const result = await query(
      `SELECT m.*, l.*, fi.*,
              l.id AS lost_item_id, l.item_name AS lost_item_name, l.lost_id,
              fi.id AS found_item_id, fi.item_name AS found_item_name, fi.found_id,
              l.user_id AS owner_id, fi.user_id AS finder_id,
              ou.name AS owner_name, ou.department AS owner_dept, ou.student_id AS owner_student_id,
              fu.name AS finder_name, fu.department AS finder_dept
       FROM matches m
       JOIN lost_items l ON m.lost_item_id=l.id
       JOIN found_items fi ON m.found_item_id=fi.id
       JOIN users ou ON l.user_id=ou.id
       JOIN users fu ON fi.user_id=fu.id
       WHERE m.id = $1`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });

    const match = result.rows[0];
    const uid = req.user.id;
    const isParticipant = match.owner_id === uid || match.finder_id === uid;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (!isParticipant && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // Hide personal contact info unless contact is accepted
    if (!['contact_accepted', 'verifying', 'handover_scheduled', 'returned'].includes(match.status)) {
      delete match.owner_student_id;
    }
    res.json({ success: true, match });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get match.' });
  }
};

// POST /api/matches/:id/contact — Owner requests contact with finder
const requestContact = async (req, res) => {
  try {
    const match = await query('SELECT m.*, l.user_id AS owner_id, fi.user_id AS finder_id, fi.item_name, l.item_name AS lost_name FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id WHERE m.id=$1', [req.params.id]);
    if (!match.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });
    const m = match.rows[0];

    if (m.owner_id !== req.user.id) return res.status(403).json({ success: false, message: 'Only the item owner can request contact.' });
    if (m.status !== 'pending') return res.status(400).json({ success: false, message: `Contact already ${m.status}.` });

    await query(
      `UPDATE matches SET status='contact_requested', contact_requested_by=$1, contact_requested_at=NOW(), updated_at=NOW() WHERE id=$2`,
      [req.user.id, req.params.id]
    );
    await notifyContactRequest(m.finder_id, m.item_name, m.id);
    res.json({ success: true, message: 'Contact request sent to the finder. They will be notified.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to send contact request.' });
  }
};

// PUT /api/matches/:id/status — Finder accepts/rejects, or status updates
const updateMatchStatus = async (req, res) => {
  try {
    const { status, message } = req.body;
    const match = await query(
      `SELECT m.*, l.user_id AS owner_id, fi.user_id AS finder_id,
              fi.item_name AS found_name, l.item_name AS lost_name
       FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
       WHERE m.id=$1`, [req.params.id]
    );
    if (!match.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });
    const m = match.rows[0];

    const isOwner = m.owner_id === req.user.id;
    const isFinder = m.finder_id === req.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    // Handle different status transitions
    if (status === 'contact_accepted') {
      if (!isFinder && !isAdmin) return res.status(403).json({ success: false, message: 'Only finder can accept contact.' });
      await query(`UPDATE matches SET status='contact_accepted', updated_at=NOW() WHERE id=$1`, [req.params.id]);
      await notifyContactAccepted(m.owner_id, m.found_name, m.id);
      return res.json({ success: true, message: 'Contact accepted. You can now chat to verify the item.' });
    }

    if (status === 'contact_rejected') {
      if (!isFinder && !isAdmin) return res.status(403).json({ success: false, message: 'Only finder can reject.' });
      await query(`UPDATE matches SET status='contact_rejected', updated_at=NOW() WHERE id=$1`, [req.params.id]);
      await notifyContactRejected(m.owner_id, m.found_name, m.id);
      // Revert lost item to active
      await query(`UPDATE lost_items SET status='active', updated_at=NOW() WHERE id=$1`, [m.lost_item_id]);
      return res.json({ success: true, message: 'Match rejected.' });
    }

    if (status === 'false_match') {
      if (!isAdmin) return res.status(403).json({ success: false, message: 'Admin only.' });
      await query(`UPDATE matches SET status='false_match', updated_at=NOW() WHERE id=$1`, [req.params.id]);
      return res.json({ success: true, message: 'Marked as false match.' });
    }

    if (status === 'returned') {
      if (!isOwner && !isFinder && !isAdmin) return res.status(403).json({ success: false, message: 'Not authorized.' });
      await Promise.all([
        query(`UPDATE matches SET status='returned', updated_at=NOW() WHERE id=$1`, [req.params.id]),
        query(`UPDATE lost_items SET status='returned', updated_at=NOW() WHERE id=$1`, [m.lost_item_id]),
        query(`UPDATE found_items SET status='returned', updated_at=NOW() WHERE id=$1`, [m.found_item_id])
      ]);
      await notifyItemReturned(m.owner_id, m.lost_name);
      await notifyItemReturned(m.finder_id, m.found_name);
      return res.json({ success: true, message: 'Item marked as successfully returned! 🎉' });
    }

    return res.status(400).json({ success: false, message: 'Invalid status transition.' });
  } catch (error) {
    console.error('Update match status:', error);
    res.status(500).json({ success: false, message: 'Failed to update match status.' });
  }
};

// POST /api/matches/run-matching — Admin trigger full matching
const triggerFullMatching = async (req, res) => {
  try {
    const count = await runFullMatching();
    res.json({ success: true, message: `Matching complete. ${count} new matches found.` });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Matching failed.' });
  }
};

module.exports = { getMatches, getMatch, requestContact, updateMatchStatus, triggerFullMatching };
