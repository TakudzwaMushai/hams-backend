const mongoose = require("mongoose");

const ehrRecordSchema = new mongoose.Schema(
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
    appointment_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Appointment",
      required: true,
    },
    diagnosis: { type: String, required: true },
    notes: { type: String, default: null },
    prescriptions: [
      {
        medication: { type: String },
        dosage: { type: String },
        frequency: { type: String },
        duration: { type: String },
      },
    ],
    attachments: { type: [String], default: [] },
    record_date: { type: Date, default: Date.now },
  },
  { timestamps: { createdAt: "created_at" } },
);

module.exports = mongoose.model("EHRRecord", ehrRecordSchema);
