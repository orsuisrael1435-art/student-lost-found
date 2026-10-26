const mongoose = require('mongoose');

const lostItemSchema = new mongoose.Schema({
  lost_id:     { type: String, unique: true },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_name:   { type: String, required: true, trim: true },
  category:    { type: String, required: true, trim: true },
  colour:      { type: String, trim: true, default: null },
  brand:       { type: String, trim: true, default: null },
  description: { type: String, trim: true, default: null },
  lost_date:   { type: Date, required: true },
  lost_time:   { type: String, default: null },
  building:    { type: String, required: true, trim: true },
  room_number: { type: String, trim: true, default: null },
  area_description: { type: String, trim: true, default: null },
  image_url:   { type: String, default: null },
  status:      { type: String, enum: ['active', 'matched', 'returned', 'closed'], default: 'active' },
  tags:        [{ type: String }],
}, { timestamps: true });

lostItemSchema.pre('save', async function(next) {
  if (!this.lost_id) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('LostItem').countDocuments();
    this.lost_id = `LOST-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('LostItem', lostItemSchema);
