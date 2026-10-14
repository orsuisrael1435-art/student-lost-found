const router = require('express').Router();
const { scheduleHandover, getHandovers, confirmHandover } = require('../controllers/handover.controller');
const { protect } = require('../middleware/auth.middleware');

router.post('/', protect, scheduleHandover);
router.get('/', protect, getHandovers);
router.put('/:id/confirm', protect, confirmHandover);

module.exports = router;
