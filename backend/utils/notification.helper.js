// ============================================================
// Notification Helper - Create notifications in DB
// ============================================================
const { query } = require('../config/database');

const createNotification = async (userId, title, message, type = 'info', relatedId = null, relatedType = null) => {
  try {
    await query(
      `INSERT INTO notifications (user_id, title, message, type, related_id, related_type)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, title, message, type, relatedId, relatedType]
    );
  } catch (err) {
    console.error('Notification creation failed:', err.message);
  }
};

const notifyPossibleMatch = async (ownerUserId, matchScore, itemName, matchId) => {
  const label = matchScore >= 90 ? '🎯 HIGH PROBABILITY MATCH' : '✅ POSSIBLE MATCH';
  await createNotification(
    ownerUserId, `${label} Found!`,
    `Your lost "${itemName}" may match a recently found item. Match Score: ${matchScore}%. Click to view.`,
    'match', matchId, 'match'
  );
};

const notifyFinderOfMatch = async (finderUserId, itemName, matchId) => {
  await createNotification(
    finderUserId, 'Your Found Item Has a Possible Match!',
    `The "${itemName}" you found may belong to another student. Check the match details.`,
    'match', matchId, 'match'
  );
};

const notifyContactRequest = async (finderUserId, itemName, matchId) => {
  await createNotification(
    finderUserId, '📬 Contact Request Received',
    `A student believes the "${itemName}" you found might be theirs. Please respond to their request.`,
    'contact', matchId, 'match'
  );
};

const notifyContactAccepted = async (ownerUserId, itemName, matchId) => {
  await createNotification(
    ownerUserId, '✅ Contact Request Accepted',
    `The finder of "${itemName}" has accepted your contact request. You can now chat to verify and arrange handover.`,
    'contact', matchId, 'match'
  );
};

const notifyContactRejected = async (ownerUserId, itemName, matchId) => {
  await createNotification(
    ownerUserId, '❌ Contact Request Rejected',
    `The finder of "${itemName}" rejected this match. This may not be your item. You can search for other matches.`,
    'contact', matchId, 'match'
  );
};

const notifyHandoverScheduled = async (userId, location, date, matchId) => {
  await createNotification(
    userId, '📅 Handover Scheduled',
    `Handover arranged at "${location}" on ${date}. Please confirm once the item is exchanged.`,
    'handover', matchId, 'match'
  );
};

const notifyItemReturned = async (userId, itemName) => {
  await createNotification(
    userId, '🎉 Item Successfully Returned!',
    `"${itemName}" has been marked as successfully returned. Case closed. Thank you for using the portal!`,
    'returned'
  );
};

module.exports = {
  createNotification,
  notifyPossibleMatch,
  notifyFinderOfMatch,
  notifyContactRequest,
  notifyContactAccepted,
  notifyContactRejected,
  notifyHandoverScheduled,
  notifyItemReturned
};
