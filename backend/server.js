// ============================================================
// STUDENT LOST & FOUND PORTAL - Main Server Entry Point
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const path = require('path');

const app = express();

// ============================================================
// Security Middleware
// ============================================================
app.use(helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' } // Allow images
}));

// CORS Configuration — allow local dev + Vercel production
const allowedOrigins = [
    'http://localhost:3000',
    process.env.CLIENT_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null,
].filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin) || origin.endsWith('.vercel.app')) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// Rate Limiting - Protect against brute force
const limiter = rateLimit({
    windowMs: (parseInt(process.env.RATE_LIMIT_WINDOW) || 15) * 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
    message: { success: false, message: 'Too many requests, please try again later.' }
});

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 50, // increased for production use
    message: { success: false, message: 'Too many authentication attempts, please try again after 15 minutes.' }
});

app.use('/api/', limiter);
app.use('/api/auth/', authLimiter);

// Request Logging — always on in production for debugging
app.use(morgan('dev'));

// ============================================================
// Body Parsing Middleware
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ============================================================
// API Routes
// ============================================================
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const lostRoutes = require('./routes/lost.routes');
const foundRoutes = require('./routes/found.routes');
const matchRoutes = require('./routes/match.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const handoverRoutes = require('./routes/handover.routes');
const adminRoutes = require('./routes/admin.routes');
const categoryRoutes = require('./routes/category.routes');
const buildingRoutes = require('./routes/building.routes');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/lost', lostRoutes);
app.use('/api/found', foundRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/handovers', handoverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/buildings', buildingRoutes);


// ============================================================
// Home Route
// ============================================================
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Student Lost & Found Portal API is running!'
    });
});

// Debug endpoint — shows env var status (remove after fix)
app.get('/api/debug-env', (req, res) => {
    res.json({
        JWT_SECRET_SET: !!process.env.JWT_SECRET,
        JWT_SECRET_LEN: process.env.JWT_SECRET ? process.env.JWT_SECRET.length : 0,
        DATABASE_URL_SET: !!process.env.DATABASE_URL,
        NODE_ENV: process.env.NODE_ENV,
        BCRYPT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS,
    });
});

// ============================================================
// Health Check Route
// ============================================================
app.get('/api/health', (req, res) => {
    res.json({
        success: true,
        message: 'Student Lost & Found Portal API is running',
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV
    });
});

// ============================================================
// 404 Handler
// ============================================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: `Route ${req.method} ${req.originalUrl} not found`
    });
});

// ============================================================
// Global Error Handler
// ============================================================
app.use((err, req, res, next) => {
    console.error('Error:', err.message);

    if (err.type === 'entity.too.large') {
        return res.status(413).json({ success: false, message: 'File too large. Maximum size is 5MB.' });
    }

    if (err.name === 'MulterError') {
        return res.status(400).json({ success: false, message: err.message });
    }

    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({ success: false, message: 'Invalid token.' });
    }

    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: 'Token has expired.' });
    }

    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// ============================================================
// Start Server
// ============================================================
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════╗
  ║   Student Lost & Found Portal API    ║
  ║   Running on port ${PORT}              ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}         ║
  ╚═══════════════════════════════════════╝
  `);
});

module.exports = app;