const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityLog = require('../models/ActivityLog');

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

const register = async (req, res) => {
  try {
    const { name, student_id, email, phone, department, year, section, password } = req.body;
    const exists = await User.findOne({ $or: [{ email: email.toLowerCase() }, { student_id }] });
    if (exists) return res.status(409).json({ success: false, message: 'Email or Student ID already exists.' });

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 10;
    const password_hash = await bcrypt.hash(password, saltRounds);

    const user = await User.create({ student_id, name, email: email.toLowerCase(), phone: phone || null, department: department || null, year: year || null, section: section || null, password_hash, role: 'student' });

    await Notification.create({ user_id: user._id, title: 'Welcome to Lost & Found Portal! 🎉', message: 'Your account has been created successfully.', type: 'info' });
    await ActivityLog.create({ user_id: user._id, action: 'USER_REGISTERED', description: `New student: ${name} (${student_id})`, ip_address: req.ip });

    const token = generateToken(user._id, user.role);
    res.status(201).json({ success: true, message: 'Account created successfully!', token, user: { id: user._id, student_id: user.student_id, name: user.name, email: user.email, department: user.department, role: user.role } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: error.message || 'Registration failed. Please try again.' });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ $or: [{ email: email.toLowerCase().trim() }, { student_id: email.trim() }] });
    if (!user) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await ActivityLog.create({ user_id: user._id, action: 'USER_LOGIN', description: `Login: ${user.name}`, ip_address: req.ip });
    const token = generateToken(user._id, user.role);

    res.json({ success: true, message: 'Login successful.', token, user: { id: user._id, student_id: user.student_id, name: user.name, email: user.email, phone: user.phone, department: user.department, year: user.year, section: user.section, role: user.role, profile_image: user.profile_image, is_active: user.is_active } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

const logout = async (req, res) => {
  try {
    if (req.user) await ActivityLog.create({ user_id: req.user._id, action: 'USER_LOGOUT', description: `Logout: ${req.user.name}` });
    res.json({ success: true, message: 'Logged out successfully.' });
  } catch { res.json({ success: true, message: 'Logged out.' }); }
};

const forgotPassword = async (req, res) => {
  res.json({ success: true, message: 'If this email exists, a reset link has been sent.' });
};

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password_hash');
    if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
    const [lostCount, foundCount, returnedCount] = await Promise.all([
      require('../models/LostItem').countDocuments({ user_id: req.user._id }),
      require('../models/FoundItem').countDocuments({ user_id: req.user._id }),
      require('../models/LostItem').countDocuments({ user_id: req.user._id, status: 'returned' }),
    ]);
    res.json({ success: true, user: { ...user.toObject(), lost_count: lostCount, found_count: foundCount, returned_count: returnedCount } });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user data.' });
  }
};

module.exports = { register, login, logout, forgotPassword, getMe };
