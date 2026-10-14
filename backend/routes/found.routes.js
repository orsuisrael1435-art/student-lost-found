const router = require('express').Router();
const {
  createFoundItem, getFoundItems, getFoundItem,
  updateFoundItem, deleteFoundItem, updateFoundItemStatus
} = require('../controllers/found.controller');
const { protect, optionalAuth } = require('../middleware/auth.middleware');
const { uploadItemImage } = require('../middleware/upload.middleware');
const { validateFoundItem } = require('../middleware/validate.middleware');

router.post('/', protect, uploadItemImage, validateFoundItem, createFoundItem);
router.get('/', optionalAuth, getFoundItems);
router.get('/:id', optionalAuth, getFoundItem);
router.put('/:id', protect, uploadItemImage, updateFoundItem);
router.delete('/:id', protect, deleteFoundItem);
router.put('/:id/status', protect, updateFoundItemStatus);

module.exports = router;
