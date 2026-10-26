const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (!token) return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password_hash');
    if (!user) return res.status(401).json({ success: false, message: 'User not found.' });
    if (!user.is_active) return res.status(401).json({ success: false, message: 'Account is deactivated.' });

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token has expired.' });
    if (error.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token.' });
    next(error);
  }
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return res.status(401).json({ success: false, message: 'Not authenticated.' });
  if (!roles.includes(req.user.role)) return res.status(403).json({ success: false, message: `Access denied. Required: ${roles.join(' or ')}` });
  next();
};

const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password_hash');
    }
    next();
  } catch { next(); }
};

module.exports = { protect, authorize, optionalAuth };
