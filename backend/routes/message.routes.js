const router = require('express').Router();
const { getMessages, sendMessage, getMatchConversations } = require('../controllers/message.controller');
const Message = require('../models/Message');
const Match = require('../models/Match');
const { protect } = require('../middleware/auth.middleware');

router.get('/conversations', protect, getMatchConversations);

router.get('/unread-count', protect, async (req, res) => {
  try {
    const userMatches = await Match.find({
      $or: [{ owner_id: req.user._id }, { finder_id: req.user._id }]
    }).select('_id');
    const matchIds = userMatches.map(m => m._id);
    const count = await Message.countDocuments({
      match_id: { $in: matchIds },
      sender_id: { $ne: req.user._id },
      is_read: false
    });
    res.json({ success: true, count });
  } catch (err) {
    res.json({ success: true, count: 0 });
  }
});

router.get('/:matchId', protect, getMessages);
router.post('/', protect, sendMessage);
router.post('/:matchId', protect, sendMessage);

module.exports = router;
