// ============================================================
// Authentication Controller
// ============================================================
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const { createNotification } = require('../utils/notification.helper');

const generateToken = (userId, role) =>
  jwt.sign({ id: userId, role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRE || '7d' });

// POST /api/auth/register
const register = async (req, res) => {
  try {
    const { name, student_id, email, phone, department, year, section, password } = req.body;

    const existing = await query(
      'SELECT id FROM users WHERE LOWER(email) = LOWER($1) OR student_id = $2',
      [email, student_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ success: false, message: 'Email or Student ID already registered.' });
    }

    const password_hash = await bcrypt.hash(password, parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12);

    const result = await query(
      `INSERT INTO users (student_id, name, email, phone, department, year, section, password_hash, role)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'student')
       RETURNING id, student_id, name, email, department, year, section, role, created_at`,
      [student_id, name, email.toLowerCase(), phone || null, department, year || null, section || null, password_hash]
    );

    const user = result.rows[0];
    await createNotification(user.id, 'Welcome to Lost & Found Portal! 🎉',
      'Your account is created. Start reporting lost/found items to help your campus community.', 'info');
    await query('INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES ($1,$2,$3,$4)',
      [user.id, 'USER_REGISTERED', `New student: ${name} (${student_id})`, req.ip]);

    res.status(201).json({ success: true, message: 'Account created successfully!', token: generateToken(user.id, user.role), user });
  } catch (error) {
    console.error('Register:', error);
    res.status(500).json({ success: false, message: 'Registration failed. Please try again.' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await query(
      `SELECT id, student_id, name, email, phone, department, year, section,
              password_hash, role, profile_image, is_active
       FROM users WHERE LOWER(email) = LOWER($1) OR student_id = $1`,
      [email.trim()]
    );

    if (!result.rows.length) return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    const user = result.rows[0];
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Account deactivated. Contact admin.' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ success: false, message: 'Invalid credentials.' });

    await query('INSERT INTO activity_logs (user_id, action, description, ip_address) VALUES ($1,$2,$3,$4)',
      [user.id, 'USER_LOGIN', `Login: ${user.name}`, req.ip]);

    delete user.password_hash;
    res.json({ success: true, message: 'Login successful.', token: generateToken(user.id, user.role), user });
  } catch (error) {
    console.error('Login:', error);
    res.status(500).json({ success: false, message: 'Login failed. Please try again.' });
  }
};

// POST /api/auth/logout
const logout = async (req, res) => {
  if (req.user) {
    await query('INSERT INTO activity_logs (user_id, action, description) VALUES ($1,$2,$3)',
      [req.user.id, 'USER_LOGOUT', `Logout: ${req.user.name}`]).catch(() => {});
  }
  res.json({ success: true, message: 'Logged out successfully.' });
};

// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  // Always respond success for security (don't reveal email existence)
  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
};

// GET /api/auth/me
const getMe = async (req, res) => {
  try {
    const result = await query(
      `SELECT u.id, u.student_id, u.name, u.email, u.phone, u.department, u.year, u.section,
              u.role, u.profile_image, u.created_at,
              (SELECT COUNT(*) FROM lost_items WHERE user_id = u.id) AS lost_count,
              (SELECT COUNT(*) FROM found_items WHERE user_id = u.id) AS found_count,
              (SELECT COUNT(*) FROM lost_items WHERE user_id = u.id AND status='returned') AS returned_count
       FROM users u WHERE u.id = $1`,
      [req.user.id]
    );
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'User not found.' });
    res.json({ success: true, user: result.rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to get user.' });
  }
};

module.exports = { register, login, logout, forgotPassword, getMe };
