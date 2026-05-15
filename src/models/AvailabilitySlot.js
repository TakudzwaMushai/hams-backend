const mongoose = require("mongoose");

const availabilitySlotSchema = new mongoose.Schema(
  {
    doctor_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Doctor",
      required: true,
      index: true,
    },

    slot_date: {
      type: Date,
      required: true,
      index: true,
    },

    start_time: {
      type: String,
      required: true,
    },

    end_time: {
      type: String,
      required: true,
    },

    consultation_type: {
      type: String,
      enum: ["online", "offline"],
      default: "offline",
    },

    location: {
      type: String,
      default: null,
    },

    fee: {
      type: Number,
      default: 0,
    },

    is_booked: {
      type: Boolean,
      default: false,
      index: true,
    },

    is_blocked: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

availabilitySlotSchema.index({
  doctor_id: 1,
  slot_date: 1,
  start_time: 1,
  end_time: 1,
});

module.exports = mongoose.model(
  "AvailabilitySlot",
  availabilitySlotSchema
);
