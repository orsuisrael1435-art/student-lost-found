// ============================================================
// STUDENT LOST & FOUND PORTAL - Main Server Entry Point (MongoDB)
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { connectDB, isDbConnected, getLastDbError } = require('./config/database');

// Connect to MongoDB
connectDB();

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || origin.endsWith('.vercel.app') || origin === 'http://localhost:3000') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' }
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { success: false, message: 'Too many auth attempts. Try again in 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);
app.use(morgan('dev'));

// ============================================================
// Body Parsing
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// Database Availability Check Middleware for API
// ============================================================
app.use('/api', (req, res, next) => {
  if (req.path === '/health') return next();
  if (!isDbConnected()) {
    return res.status(503).json({
      success: false,
      message: 'Database is currently connecting or unavailable. If you are the admin, please ensure 0.0.0.0/0 is whitelisted in MongoDB Atlas Network Access and the cluster is active.',
      dbError: getLastDbError()
    });
  }
  next();
});

// ============================================================
// API Routes
// ============================================================
app.use('/api/auth',          require('./routes/auth.routes'));
app.use('/api/users',         require('./routes/user.routes'));
app.use('/api/lost',          require('./routes/lost.routes'));
app.use('/api/found',         require('./routes/found.routes'));
app.use('/api/matches',       require('./routes/match.routes'));
app.use('/api/messages',      require('./routes/message.routes'));
app.use('/api/notifications', require('./routes/notification.routes'));
app.use('/api/handovers',     require('./routes/handover.routes'));
app.use('/api/admin',         require('./routes/admin.routes'));
app.use('/api/categories',    require('./routes/category.routes'));
app.use('/api/buildings',     require('./routes/building.routes'));

// ============================================================
// Home & Health Routes
// ============================================================
app.get('/', (req, res) => res.json({ success: true, message: 'Student Lost & Found Portal API (MongoDB) is running!' }));
app.get('/api/health', (req, res) => {
  const connected = isDbConnected();
  res.status(connected ? 200 : 503).json({
    success: connected,
    message: connected ? 'Healthy' : 'Database disconnected',
    db: connected ? 'MongoDB Connected' : 'MongoDB Disconnected',
    error: connected ? null : getLastDbError(),
    timestamp: new Date().toISOString()
  });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.method} ${req.originalUrl} not found` }));

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: Object.values(err.errors).map(e => e.message).join(', ') });
  if (err.code === 11000) return res.status(409).json({ success: false, message: 'Duplicate entry. This record already exists.' });
  if (err.name === 'JsonWebTokenError') return res.status(401).json({ success: false, message: 'Invalid token.' });
  if (err.name === 'TokenExpiredError') return res.status(401).json({ success: false, message: 'Token has expired.' });
  res.status(err.status || 500).json({ success: false, message: err.message || 'Internal server error' });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════╗
  ║   Student Lost & Found Portal API        ║
  ║   MongoDB Edition — Port ${PORT}             ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}              ║
  ╚═══════════════════════════════════════════╝
  `);
});

module.exports = app;