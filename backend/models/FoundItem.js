const mongoose = require('mongoose');

const foundItemSchema = new mongoose.Schema({
  found_id:    { type: String, unique: true },
  user_id:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  item_name:   { type: String, required: true, trim: true },
  category:    { type: String, required: true, trim: true },
  colour:      { type: String, trim: true, default: null },
  brand:       { type: String, trim: true, default: null },
  description: { type: String, trim: true, default: null },
  found_date:  { type: Date, required: true },
  found_time:  { type: String, default: null },
  building:    { type: String, required: true, trim: true },
  room_number: { type: String, trim: true, default: null },
  area_description: { type: String, trim: true, default: null },
  storage_location: { type: String, trim: true, default: null },
  image_url:   { type: String, default: null },
  status:      { type: String, enum: ['active', 'matched', 'returned', 'closed'], default: 'active' },
  tags:        [{ type: String }],
}, { timestamps: true });

foundItemSchema.pre('save', async function(next) {
  if (!this.found_id) {
    const year = new Date().getFullYear();
    const count = await mongoose.model('FoundItem').countDocuments();
    this.found_id = `FOUND-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  next();
});

module.exports = mongoose.model('FoundItem', foundItemSchema);
