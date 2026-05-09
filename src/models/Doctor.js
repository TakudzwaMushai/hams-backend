const mongoose = require("mongoose");

const doctorSchema = new mongoose.Schema(
  {
    first_name: { type: String, required: true, trim: true },
    last_name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: { type: String, trim: true },
    specialisation: { type: String, required: true },
    license_number: { type: String, required: true, unique: true },
    is_active: { type: Boolean, default: true },

    experience_years: { type: Number, default: 0 },
    fee: { type: Number, default: 0 },
    education: { type: String, default: null },
    certificate: { type: String, default: null },
    bio: { type: String, default: null },
    avatar: { type: String, default: null },
    availability_types: {
      type: [String],
      enum: ["Online Consultation", "In-Person"],
      default: ["In-Person"],
    },
    clinic_name: { type: String, default: null },
    average_rating: { type: Number, default: 0 },
    total_reviews: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = mongoose.model("Doctor", doctorSchema);
