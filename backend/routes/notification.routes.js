const router = require('express').Router();
const { getNotifications, markAsRead, markAllAsRead } = require('../controllers/notification.controller');
const { protect } = require('../middleware/auth.middleware');

router.get('/', protect, getNotifications);
router.put('/read-all', protect, markAllAsRead);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
