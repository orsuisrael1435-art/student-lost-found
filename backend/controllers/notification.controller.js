const Notification = require('../models/Notification');

const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [notifications, total, unread_count] = await Promise.all([
      Notification.find({ user_id: req.user._id }).sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      Notification.countDocuments({ user_id: req.user._id }),
      Notification.countDocuments({ user_id: req.user._id, is_read: false }),
    ]);
    res.json({ success: true, notifications, total, unread_count, page: parseInt(page) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get notifications.' }); }
};

const markRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, user_id: req.user._id }, { is_read: true });
    res.json({ success: true, message: 'Marked as read.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to mark read.' }); }
};

const markAllRead = async (req, res) => {
  try {
    await Notification.updateMany({ user_id: req.user._id, is_read: false }, { is_read: true });
    res.json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to mark all read.' }); }
};

const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, user_id: req.user._id });
    res.json({ success: true, message: 'Notification deleted.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to delete notification.' }); }
};

module.exports = { getNotifications, markRead, markAllRead, deleteNotification };
