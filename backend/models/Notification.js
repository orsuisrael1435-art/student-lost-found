const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  user_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:        { type: String, required: true },
  message:      { type: String, required: true },
  type:         { type: String, enum: ['info','match','contact','handover','returned','warning'], default: 'info' },
  related_id:   { type: mongoose.Schema.Types.ObjectId, default: null },
  related_type: { type: String, default: null },
  is_read:      { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
