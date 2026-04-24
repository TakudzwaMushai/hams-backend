const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  first_name:     { type: String, required: true, trim: true },
  last_name:      { type: String, required: true, trim: true },
  email:          { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:          { type: String, trim: true },
  specialisation: { type: String, required: true },
  license_number: { type: String, required: true, unique: true },
  is_active:      { type: Boolean, default: true }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Doctor', doctorSchema);