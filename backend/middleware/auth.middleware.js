// ============================================================
// Authentication & Authorization Middleware
// ============================================================
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');

/**
 * Verify JWT token and attach user to request
 */
const protect = async (req, res, next) => {
  try {
    let token;
    
    // Check Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    
    if (!token) {
      return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }
    
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from database
    const result = await query(
      'SELECT id, student_id, name, email, role, is_active FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found.' });
    }
    
    if (!result.rows[0].is_active) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Contact admin.' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Token has expired. Please login again.' });
    }
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ success: false, message: 'Invalid token.' });
    }
    next(error);
  }
};

/**
 * Restrict access to specific roles
 * Usage: authorize('admin', 'superadmin')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Not authenticated.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}. Your role: ${req.user.role}`
      });
    }
    next();
  };
};

/**
 * Optional auth - attaches user if token is valid but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const result = await query(
        'SELECT id, student_id, name, email, role FROM users WHERE id = $1 AND is_active = true',
        [decoded.id]
      );
      if (result.rows.length > 0) {
        req.user = result.rows[0];
      }
    }
    next();
  } catch (error) {
    next(); // Continue without auth if token is invalid
  }
};

module.exports = { protect, authorize, optionalAuth };
