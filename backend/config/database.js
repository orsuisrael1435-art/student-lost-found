const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      dbName: 'student_lost_found',
    });
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
    console.error('❌ MongoDB connection error:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
