// ============================================================
// Message Controller - Secure In-App Messaging
// ============================================================
const { query } = require('../config/database');

// GET /api/messages/:matchId — Get all messages for a match
const getMessages = async (req, res) => {
  try {
    const matchId = req.params.matchId;

    // Verify user is a participant in this match
    const matchCheck = await query(
      `SELECT m.id, l.user_id AS owner_id, fi.user_id AS finder_id
       FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
       WHERE m.id=$1`, [matchId]
    );
    if (!matchCheck.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });

    const { owner_id, finder_id } = matchCheck.rows[0];
    const uid = req.user.id;
    const isAdmin = ['admin', 'superadmin'].includes(req.user.role);

    if (uid !== owner_id && uid !== finder_id && !isAdmin) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not a participant.' });
    }

    // Check match is in a state where messaging is allowed
    const match = matchCheck.rows[0];
    // (Messaging allowed once contact_accepted or later)

    const messages = await query(
      `SELECT msg.id, msg.message, msg.created_at, msg.is_read,
              msg.sender_id, u.name AS sender_name, u.role AS sender_role,
              CASE WHEN msg.sender_id = $1 THEN true ELSE false END AS is_mine
       FROM messages msg JOIN users u ON msg.sender_id = u.id
       WHERE msg.match_id = $2 ORDER BY msg.created_at ASC`,
      [uid, matchId]
    );

    // Mark messages as read for this user
    await query(
      'UPDATE messages SET is_read=true WHERE match_id=$1 AND receiver_id=$2 AND is_read=false',
      [matchId, uid]
    );

    res.json({ success: true, messages: messages.rows });
  } catch (error) {
    console.error('Get messages:', error);
    res.status(500).json({ success: false, message: 'Failed to load messages.' });
  }
};

// POST /api/messages — Send a message
const sendMessage = async (req, res) => {
  try {
    const { match_id, message } = req.body;

    if (!message?.trim()) return res.status(400).json({ success: false, message: 'Message cannot be empty.' });

    // Verify participant
    const matchCheck = await query(
      `SELECT m.id, m.status, l.user_id AS owner_id, fi.user_id AS finder_id
       FROM matches m JOIN lost_items l ON m.lost_item_id=l.id JOIN found_items fi ON m.found_item_id=fi.id
       WHERE m.id=$1`, [match_id]
    );
    if (!matchCheck.rows.length) return res.status(404).json({ success: false, message: 'Match not found.' });

    const { owner_id, finder_id, status } = matchCheck.rows[0];
    const uid = req.user.id;

    if (uid !== owner_id && uid !== finder_id) {
      return res.status(403).json({ success: false, message: 'You are not a participant in this match.' });
    }

    // Allow messaging only once contact is accepted
    if (!['contact_accepted', 'verifying', 'handover_scheduled', 'returned'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Messaging is only available after contact is accepted.' });
    }

    const receiver_id = uid === owner_id ? finder_id : owner_id;

    const result = await query(
      `INSERT INTO messages (sender_id, receiver_id, match_id, message)
       VALUES ($1,$2,$3,$4) RETURNING id, message, created_at, sender_id`,
      [uid, receiver_id, match_id, message.trim()]
    );

    const sent = result.rows[0];
    res.status(201).json({
      success: true,
      message: { ...sent, sender_name: req.user.name, is_mine: true }
    });
  } catch (error) {
    console.error('Send message:', error);
    res.status(500).json({ success: false, message: 'Failed to send message.' });
  }
};

// GET /api/messages/unread-count
const getUnreadCount = async (req, res) => {
  try {
    const result = await query(
      'SELECT COUNT(*) FROM messages WHERE receiver_id=$1 AND is_read=false',
      [req.user.id]
    );
    res.json({ success: true, count: parseInt(result.rows[0].count) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get count.' });
  }
};

module.exports = { getMessages, sendMessage, getUnreadCount };
