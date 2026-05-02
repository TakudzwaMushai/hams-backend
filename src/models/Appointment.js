const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema(
  {
    patient_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Patient",
      required: true,
    },
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    slot_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "AvailabilitySlot",
      required: true,
    },
    status: {
      type: String,
      enum: ["confirmed", "cancelled", "completed", "rescheduled"],
      default: "confirmed",
    },
    type: {
      type: String,
      enum: ["in-person", "video"],
      default: "in-person",
    },
    notes: { type: String, default: null },
    cancellation_reason: { type: String, default: null },
    booked_at: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } },
);

module.exports = mongoose.model("Appointment", appointmentSchema);
