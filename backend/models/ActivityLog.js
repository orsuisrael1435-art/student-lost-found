const mongoose = require('mongoose');

const activityLogSchema = new mongoose.Schema({
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  action:      { type: String, required: true },
  description: { type: String, default: null },
  ip_address:  { type: String, default: null },
}, { timestamps: true });

module.exports = mongoose.model('ActivityLog', activityLogSchema);
