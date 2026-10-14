const router = require('express').Router();
const { getMatches, getMatch, requestContact, updateMatchStatus, triggerFullMatching } = require('../controllers/match.controller');
const { protect, authorize } = require('../middleware/auth.middleware');

router.get('/', protect, getMatches);
router.get('/:id', protect, getMatch);
router.post('/:id/contact', protect, requestContact);
router.put('/:id/status', protect, updateMatchStatus);
router.post('/admin/run-matching', protect, authorize('admin','superadmin'), triggerFullMatching);

module.exports = router;
