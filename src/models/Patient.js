const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  first_name: { type: String, required: true, trim: true },
  last_name:  { type: String, required: true, trim: true },
  email:      { type: String, required: true, unique: true, lowercase: true, trim: true },
  phone:      { type: String, trim: true },
  date_of_birth: { type: Date },
  gender:     { type: String, enum: ['male', 'female', 'other'] },
  nhs_number: { type: String, trim: true },
  address: {
    line1:    { type: String },
    city:     { type: String },
    postcode: { type: String }
  }
}, { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } });

module.exports = mongoose.model('Patient', patientSchema);