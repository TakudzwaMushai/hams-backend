const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
    },
    slot_date: { type: Date, required: true },
    start_time: { type: String, required: true }, // e.g. "09:00"
    end_time: { type: String, required: true }, // e.g. "09:30"
    is_booked: { type: Boolean, default: false },
    is_blocked: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at" } },
);

module.exports = mongoose.model("AvailabilitySlot", availabilitySlotSchema);
