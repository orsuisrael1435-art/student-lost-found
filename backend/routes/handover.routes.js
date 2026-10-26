const router = require('express').Router();
const { scheduleHandover, confirmHandover } = require('../controllers/handover.controller');
const Match = require('../models/Match');
const { protect } = require('../middleware/auth.middleware');

router.post('/:matchId', protect, scheduleHandover);
router.put('/:matchId/confirm', protect, confirmHandover);

router.get('/', protect, async (req, res) => {
  try {
    const handovers = await Match.find({
      $or: [{ owner_id: req.user._id }, { finder_id: req.user._id }],
      status: { $in: ['handover_scheduled', 'returned'] }
    })
      .populate('lost_item_id')
      .populate('found_item_id')
      .populate('owner_id', 'name student_id')
      .populate('finder_id', 'name student_id')
      .sort('-updatedAt')
      .lean();
    res.json({ success: true, handovers });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch handovers.' });
  }
});

module.exports = router;
