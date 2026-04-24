const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password_hash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['patient', 'doctor', 'admin'],
    required: true
  },
  ref_id: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'ref_type'
  },
  ref_type: {
    type: String,
    enum: ['Patient', 'Doctor']
  },
  last_login: {
    type: Date,
    default: null
  }
}, { timestamps: { createdAt: 'created_at' } });

module.exports = mongoose.model('User', userSchema);