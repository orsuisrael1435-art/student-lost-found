const mongoose = require('mongoose');

let isConnected = false;
let lastDbError = null;

const connectDB = async () => {
  if (!process.env.MONGODB_URI) {
    const msg = 'MONGODB_URI environment variable is not defined!';
    console.error('❌', msg);
    lastDbError = msg;
    return;
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'student_lost_found',
      serverSelectionTimeoutMS: 8000,
    });
    isConnected = true;
    lastDbError = null;
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);

    try {
      const User = require('../models/User');
      await User.updateMany(
        { $or: [{ email: 'israel@college.edu' }, { name: /Israel/i }] },
        { $set: { name: 'Alex Johnson', email: 'student@college.edu' } }
      );
    } catch (updateErr) {
      console.warn('User rename warning:', updateErr.message);
    }
  } catch (error) {
    isConnected = false;
    lastDbError = error.message;
    console.error('❌ MongoDB connection error:', error.message);
    // Never exit the process — retry connection so the Express server stays alive
    // and Render can serve health checks and descriptive error messages.
    setTimeout(connectDB, 15000);
  }
};

mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️ MongoDB disconnected.');
});

mongoose.connection.on('connected', () => {
  isConnected = true;
  lastDbError = null;
  console.log('✅ MongoDB connection established.');
});

module.exports = {
  connectDB,
  isDbConnected: () => isConnected || mongoose.connection.readyState === 1,
  getLastDbError: () => lastDbError,
};
