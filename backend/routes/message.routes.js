const router = require('express').Router();
const { getMessages, sendMessage, getUnreadCount } = require('../controllers/message.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/unread-count', protect, getUnreadCount);
router.get('/:matchId', protect, getMessages);
router.post('/', protect, sendMessage);

module.exports = router;
