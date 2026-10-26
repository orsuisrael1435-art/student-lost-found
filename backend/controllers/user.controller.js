const bcrypt = require('bcryptjs');
const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const Notification = require('../models/Notification');

const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'Profile not found.' });
    const [total_lost, total_found, items_returned] = await Promise.all([
      LostItem.countDocuments({ user_id: req.user._id }),
      FoundItem.countDocuments({ user_id: req.user._id }),
      LostItem.countDocuments({ user_id: req.user._id, status: 'returned' }),
    ]);
    res.json({ success: true, profile: { ...user.toObject(), total_lost, total_found, items_returned } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get profile.' }); }
};

const updateProfile = async (req, res) => {
  try {
    const { name, phone, department, year, section } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (phone) updates.phone = phone;
    if (department) updates.department = department;
    if (year) updates.year = year;
    if (section) updates.section = section;
    if (req.file) updates.profile_image = `/uploads/profiles/${req.file.filename}`;
    if (Object.keys(updates).length === 0) return res.status(400).json({ success: false, message: 'No fields to update.' });
    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true }).select('-password_hash');
    res.json({ success: true, message: 'Profile updated.', user });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update profile.' }); }
};

const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;
    const user = await User.findById(req.user._id);
    const isValid = await bcrypt.compare(current_password, user.password_hash);
    if (!isValid) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    user.password_hash = await bcrypt.hash(new_password, saltRounds);
    await user.save();
    res.json({ success: true, message: 'Password changed successfully.' });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to change password.' }); }
};

const getDashboard = async (req, res) => {
  try {
    const userId = req.user._id;
    const [lostCount, foundCount, returnedCount, unreadNotif, recentLost, recentFound, activeMatches] = await Promise.all([
      LostItem.countDocuments({ user_id: userId }),
      FoundItem.countDocuments({ user_id: userId }),
      LostItem.countDocuments({ user_id: userId, status: 'returned' }),
      Notification.countDocuments({ user_id: userId, is_read: false }),
      LostItem.find({ user_id: userId }).sort({ createdAt: -1 }).limit(5).lean(),
      FoundItem.find({ user_id: userId }).sort({ createdAt: -1 }).limit(5).lean(),
      Match.find({ owner_id: userId, status: { $nin: ['false_match', 'closed'] } })
        .populate('lost_item_id', 'item_name lost_id category colour')
        .populate('found_item_id', 'item_name found_id building room_number')
        .sort({ match_score: -1 }).limit(5).lean(),
    ]);
    res.json({
      success: true,
      dashboard: {
        stats: { my_lost_items: lostCount, my_found_items: foundCount, returned_items: returnedCount, possible_matches: activeMatches.length, unread_notifications: unreadNotif },
        recent_lost: recentLost,
        recent_found: recentFound,
        active_matches: activeMatches,
      }
    });
  } catch (error) {
    console.error('Dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to load dashboard.' });
  }
};

module.exports = { getProfile, updateProfile, changePassword, getDashboard };
