const router = require('express').Router();
const {
  createLostItem, getLostItems, getLostItem,
  updateLostItem, deleteLostItem, updateLostItemStatus
} = require('../controllers/lost.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadItemImage } = require('../middleware/upload.middleware');
const { validateLostItem } = require('../middleware/validate.middleware');

router.post('/', protect, uploadItemImage, validateLostItem, createLostItem);
router.get('/', optionalAuth, getLostItems);
router.get('/:id', optionalAuth, getLostItem);
router.put('/:id', protect, uploadItemImage, updateLostItem);
router.delete('/:id', protect, deleteLostItem);
router.put('/:id/status', protect, updateLostItemStatus);

module.exports = router;
