const User = require('../models/User');
const LostItem = require('../models/LostItem');
const FoundItem = require('../models/FoundItem');
const Match = require('../models/Match');
const ActivityLog = require('../models/ActivityLog');

const getDashboard = async (req, res) => {
  try {
    const [totalUsers, totalLost, totalFound, totalMatches, returnedItems, activeUsers] = await Promise.all([
      User.countDocuments(),
      LostItem.countDocuments(),
      FoundItem.countDocuments(),
      Match.countDocuments(),
      Match.countDocuments({ status: 'returned' }),
      User.countDocuments({ is_active: true }),
    ]);
    const recentLost = await LostItem.find().populate('user_id', 'name student_id').sort('-createdAt').limit(5).lean();
    const recentFound = await FoundItem.find().populate('user_id', 'name student_id').sort('-createdAt').limit(5).lean();
    const recentMatches = await Match.find()
      .populate('lost_item_id', 'item_name category')
      .populate('found_item_id', 'item_name')
      .populate('owner_id', 'name')
      .populate('finder_id', 'name')
      .sort('-createdAt').limit(5).lean();
    res.json({
      success: true,
      dashboard: {
        stats: { total_users: totalUsers, total_lost: totalLost, total_found: totalFound, total_matches: totalMatches, returned_items: returnedItems, active_users: activeUsers },
        recent_lost: recentLost,
        recent_found: recentFound,
        recent_matches: recentMatches,
      }
    });
  } catch (error) { console.error(error); res.status(500).json({ success: false, message: 'Failed to load admin dashboard.' }); }
};

const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, is_active } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (is_active !== undefined) filter.is_active = is_active === 'true';
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }, { student_id: new RegExp(search, 'i') }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [users, total] = await Promise.all([
      User.find(filter).select('-password_hash').sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      User.countDocuments(filter)
    ]);
    res.json({ success: true, users, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get users.' }); }
};

const updateUser = async (req, res) => {
  try {
    const { role, is_active } = req.body;
    const updates = {};
    if (role) updates.role = role;
    if (is_active !== undefined) updates.is_active = is_active;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User updated.', user });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to update user.' }); }
};

const getAllLostItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [{ item_name: new RegExp(search, 'i') }, { category: new RegExp(search, 'i') }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      LostItem.find(filter).populate('user_id', 'name student_id email').sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      LostItem.countDocuments(filter)
    ]);
    res.json({ success: true, items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get lost items.' }); }
};

const getAllFoundItems = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.$or = [{ item_name: new RegExp(search, 'i') }, { category: new RegExp(search, 'i') }];
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [items, total] = await Promise.all([
      FoundItem.find(filter).populate('user_id', 'name student_id email').sort('-createdAt').skip(skip).limit(parseInt(limit)).lean(),
      FoundItem.countDocuments(filter)
    ]);
    res.json({ success: true, items, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get found items.' }); }
};

const getAllMatches = async (req, res) => {
  try {
    const matches = await Match.find()
      .populate('lost_item_id', 'item_name category colour')
      .populate('found_item_id', 'item_name building')
      .populate('owner_id', 'name student_id')
      .populate('finder_id', 'name student_id')
      .sort('-createdAt').lean();
    res.json({ success: true, matches });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get matches.' }); }
};

const getAnalytics = async (req, res) => {
  try {
    const [byCategory, byStatus, byMonth] = await Promise.all([
      LostItem.aggregate([{ $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
      LostItem.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
      LostItem.aggregate([{ $group: { _id: { $month: '$createdAt' }, count: { $sum: 1 } } }, { $sort: { '_id': 1 } }]),
    ]);
    res.json({ success: true, analytics: { by_category: byCategory, by_status: byStatus, by_month: byMonth } });
  } catch (error) { res.status(500).json({ success: false, message: 'Failed to get analytics.' }); }
};

module.exports = { getDashboard, getUsers, updateUser, getAllLostItems, getAllFoundItems, getAllMatches, getAnalytics };
