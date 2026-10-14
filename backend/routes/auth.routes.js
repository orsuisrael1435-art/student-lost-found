const router = require('express').Router();
const { register, login, logout, forgotPassword, getMe } = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { validateRegister, validateLogin } = require('../middleware/validate.middleware');

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

module.exports = router;
