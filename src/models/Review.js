const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
      unique: true,
    },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: null },
  },
  { timestamps: { createdAt: "created_at" } },
);

module.exports = mongoose.model("Review", reviewSchema);
