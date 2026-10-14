const router = require('express').Router();
const { getProfile, updateProfile, changePassword, getDashboard } = require('../controllers/user.controller');
const { protect } = require('../middleware/auth.middleware');
const { uploadProfilePhoto } = require('../middleware/upload.middleware');

router.get('/profile', protect, getProfile);
router.put('/profile', protect, uploadProfilePhoto, updateProfile);
router.put('/change-password', protect, changePassword);
router.get('/dashboard', protect, getDashboard);

module.exports = router;
