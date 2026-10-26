const mongoose = require('mongoose');

const matchSchema = new mongoose.Schema({
  lost_item_id:  { type: mongoose.Schema.Types.ObjectId, ref: 'LostItem', required: true },
  found_item_id: { type: mongoose.Schema.Types.ObjectId, ref: 'FoundItem', required: true },
  owner_id:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  finder_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  match_score:   { type: Number, default: 0 },
  status:        { type: String, enum: ['pending','contact_requested','contact_accepted','handover_scheduled','returned','false_match','closed'], default: 'pending' },
  contact_requested: { type: Boolean, default: false },
  contact_accepted:  { type: Boolean, default: false },
  handover_location: { type: String, default: null },
  handover_date:     { type: Date, default: null },
  handover_time:     { type: String, default: null },
  handover_notes:    { type: String, default: null },
  returned_at:       { type: Date, default: null },
  admin_verified:    { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
