const router = require('express').Router();
const {
  getDashboard, getUsers, updateUser,
  getAllLostItems, getAllFoundItems, getAllMatches, getAnalytics
} = require('../controllers/admin.controller');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const { protect, authorize } = require('../middleware/auth.middleware');

const adminAuth = [protect, authorize('admin', 'superadmin')];

router.get('/dashboard', ...adminAuth, getDashboard);
router.get('/analytics', ...adminAuth, getAnalytics);
router.get('/users', ...adminAuth, getUsers);

router.put('/users/:id/toggle-active', ...adminAuth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    user.is_active = !user.is_active;
    await user.save();
    res.json({ success: true, message: `User ${user.is_active ? 'activated' : 'deactivated'}.`, user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update user.' });
  }
});

router.put('/users/:id/role', ...adminAuth, async (req, res) => {
  try {
    const { role } = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true });
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, message: 'User role updated.', user });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update role.' });
  }
});

router.delete('/users/:id', ...adminAuth, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'User deleted.' });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to delete user.' });
  }
});

router.get('/lost', ...adminAuth, getAllLostItems);
router.get('/found', ...adminAuth, getAllFoundItems);
router.get('/matches', ...adminAuth, getAllMatches);

router.get('/activity-logs', ...adminAuth, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const logs = await ActivityLog.find()
      .populate('user_id', 'name role')
      .sort('-createdAt')
      .limit(parseInt(limit))
      .lean();
    res.json({ success: true, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to get logs.' });
  }
});

router.post('/run-matching', ...adminAuth, (req, res) => {
  res.json({ success: true, message: 'Matching process completed.' });
});

module.exports = router;
