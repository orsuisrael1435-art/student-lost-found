const Notification = require('../models/Notification');

const createNotification = async (userId, title, message, type = 'info', relatedId = null, relatedType = null) => {
  try {
    await Notification.create({ user_id: userId, title, message, type, related_id: relatedId, related_type: relatedType });
  } catch (error) {
    console.error('Failed to create notification:', error.message);
  }
};

const notifyPossibleMatch = async (ownerUserId, matchScore, itemName, matchId) => {
  const label = matchScore >= 90 ? '🎯 HIGH PROBABILITY MATCH' : '✅ POSSIBLE MATCH';
  await createNotification(ownerUserId, `${label} Found!`,
    `Your lost ${itemName} may match a recently found item. Match Score: ${matchScore}%. Click to view.`,
    'match', matchId, 'match');
};

const notifyContactRequest = async (finderUserId, itemName, matchId) => {
  await createNotification(finderUserId, 'Contact Request Received',
    `Someone believes the ${itemName} you found might be theirs. Please respond.`,
    'contact', matchId, 'match');
};

const notifyContactAccepted = async (ownerUserId, itemName, matchId) => {
  await createNotification(ownerUserId, 'Contact Request Accepted ✅',
    `The finder of ${itemName} accepted your contact request. You can now chat.`,
    'contact', matchId, 'match');
};

const notifyHandoverScheduled = async (userId, location, date, matchId) => {
  await createNotification(userId, 'Handover Scheduled 📅',
    `Handover scheduled at ${location} on ${date}. Please confirm once exchanged.`,
    'handover', matchId, 'match');
};

const notifyItemReturned = async (userId, itemName) => {
  await createNotification(userId, 'Item Successfully Returned 🎉',
    `The ${itemName} has been marked as successfully returned. Thank you!`, 'returned');
};

module.exports = { createNotification, notifyPossibleMatch, notifyContactRequest, notifyContactAccepted, notifyHandoverScheduled, notifyItemReturned };
