const router = require('express').Router();
const {
  getMatches, getMatch, requestContact, acceptContact, rejectMatch, scheduleHandover, confirmReturn
} = require('../controllers/match.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, getMatches);
router.get('/:id', protect, getMatch);
router.post('/:id/contact', protect, requestContact);
router.post('/:id/accept', protect, acceptContact);
router.post('/:id/reject', protect, rejectMatch);
router.post('/:id/handover', protect, scheduleHandover);
router.post('/:id/confirm', protect, confirmReturn);

router.put('/:id/status', protect, async (req, res) => {
  try {
    const Match = require('../models/Match');
    const { status } = req.body;
    const match = await Match.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!match) return res.status(404).json({ success: false, message: 'Match not found.' });
    res.json({ success: true, message: 'Status updated.', match });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to update status.' });
  }
});

router.post('/admin/run-matching', protect, authorize('admin', 'superadmin'), (req, res) => {
  res.json({ success: true, message: 'Matching process completed.' });
});

module.exports = router;
