const mongoose = require('mongoose');

const buildingSchema = new mongoose.Schema({
  name:      { type: String, required: true, unique: true, trim: true },
  code:      { type: String, required: true, unique: true, trim: true },
  rooms:     [{ type: String }],
  is_active: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Building', buildingSchema);
