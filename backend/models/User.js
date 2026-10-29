const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  student_id: { type: String, required: true, unique: true, trim: true },
  name:        { type: String, required: true, trim: true },
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:       { type: String, trim: true, default: null },
  department:  { type: String, trim: true, default: null },
  year:        { type: Number, min: 1, max: 6, default: null },
  section:     { type: String, trim: true, default: null },
  password_hash: { type: String, required: true },
  role:        { type: String, enum: ['student', 'admin', 'superadmin'], default: 'student' },
  profile_image: { type: String, default: null },
  is_active:   { type: Boolean, default: true },
}, { timestamps: true });

userSchema.methods.matchPassword = function(password) {
  return bcrypt.compare(password, this.password_hash);
};

userSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password_hash;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
