const Appointment = require("../models/Appointment");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const EHRRecord = require("../models/EHRRecord");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmail");
const { getIO } = require("../utils/socket");
const templates = require("../utils/emailTemplates");

// Helper — get patient and doctor profiles + their user emails
const getProfiles = async (patientId, doctorId) => {
  const patient = await Patient.findById(patientId);
  const doctor = await Doctor.findById(doctorId);
  const doctorUser = await User.findOne({
    ref_id: doctorId,
    ref_type: "Doctor",
  });
  const patientUser = await User.findOne({
    ref_id: patientId,
    ref_type: "Patient",
  });
  return { patient, doctor, doctorUser, patientUser };
};

// Helper — emit socket event to a user room
const notify = (userId, event, data) => {
  try {
    getIO().to(userId.toString()).emit(event, data);
  } catch (err) {
    console.error("Socket notification error:", err.message);
  }
};

// POST /api/appointments — patient books a slot
exports.bookAppointment = async (req, res) => {
  try {
    const { slot_id, type, notes } = req.body;

    const user = await User.findById(req.user.id);
    if (!user || user.role !== "patient") {
      return res
        .status(403)
        .json({ message: "Only patients can book appointments" });
    }

    const slot = await AvailabilitySlot.findById(slot_id);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }
    if (slot.is_booked || slot.is_blocked) {
      return res.status(409).json({ message: "Slot is no longer available" });
    }

    // Create appointment
    const appointment = await Appointment.create({
      patient_id: user.ref_id,
      doctor_id: slot.doctor_id,
      slot_id: slot._id,
      type: type || "in-person",
      notes,
    });

    // Mark slot as booked
    slot.is_booked = true;
    await slot.save();

    const { patient, doctor, doctorUser, patientUser } = await getProfiles(
      user.ref_id,
      slot.doctor_id,
    );

    // Email patient
    try {
      const patientEmail = templates.appointmentBookedPatient({
        patient,
        doctor,
        slot,
      });
      await sendEmail({ to: patientUser.email, ...patientEmail });
    } catch (e) {
      console.error("Patient email failed:", e.message);
    }

    // Email doctor
    try {
      const doctorEmail = templates.appointmentBookedDoctor({
        patient,
        doctor,
        slot,
      });
      await sendEmail({ to: doctorUser.email, ...doctorEmail });
    } catch (e) {
      console.error("Doctor email failed:", e.message);
    }

    // Notify doctor via websocket
    notify(doctorUser._id, "appointment:booked", {
      message: `New appointment booked by ${patient.first_name} ${patient.last_name}`,
      appointment: {
        id: appointment._id,
        patient: `${patient.first_name} ${patient.last_name}`,
        date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      },
    });

    res
      .status(201)
      .json({ message: "Appointment booked successfully", appointment });
  } catch (err) {
    console.error("Book appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/appointments/me — get my appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const filter =
      user.role === "patient"
        ? { patient_id: user.ref_id }
        : { doctor_id: user.ref_id };

    const appointments = await Appointment.find(filter)
      .populate("slot_id")
      .populate("patient_id", "first_name last_name email phone")
      .populate("doctor_id", "first_name last_name specialisation")
      .sort({ createdAt: -1 });

    res.status(200).json({ appointments });
  } catch (err) {
    console.error("Get appointments error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.user.id);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }

    // Check ownership
    const isPatient =
      user.role === "patient" &&
      appointment.patient_id.toString() === user.ref_id.toString();
    const isDoctor =
      user.role === "doctor" &&
      appointment.doctor_id.toString() === user.ref_id.toString();

    if (!isPatient && !isDoctor) {
      return res
        .status(403)
        .json({ message: "Not authorised to cancel this appointment" });
    }

    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Appointment is already cancelled" });
    }
    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ message: "Cannot cancel a completed appointment" });
    }

    appointment.status = "cancelled";
    appointment.cancellation_reason = reason || null;
    await appointment.save();

    // Free up the slot
    await AvailabilitySlot.findByIdAndUpdate(appointment.slot_id, {
      is_booked: false,
    });

    const slot = await AvailabilitySlot.findById(appointment.slot_id);
    const { patient, doctor, doctorUser, patientUser } = await getProfiles(
      appointment.patient_id,
      appointment.doctor_id,
    );

    // Email both parties
    try {
      await sendEmail({
        to: patientUser.email,
        ...templates.appointmentCancelledPatient({
          patient,
          doctor,
          slot,
          reason,
        }),
      });
    } catch (e) {
      console.error("Cancel patient email failed:", e.message);
    }

    try {
      await sendEmail({
        to: doctorUser.email,
        ...templates.appointmentCancelledDoctor({
          patient,
          doctor,
          slot,
          reason,
        }),
      });
    } catch (e) {
      console.error("Cancel doctor email failed:", e.message);
    }

    // Notify both via websocket
    notify(patientUser._id, "appointment:cancelled", {
      message: "Your appointment has been cancelled",
      appointment_id: appointment._id,
      reason,
    });

    notify(doctorUser._id, "appointment:cancelled", {
      message: `Appointment with ${patient.first_name} ${patient.last_name} has been cancelled`,
      appointment_id: appointment._id,
      reason,
    });

    res
      .status(200)
      .json({ message: "Appointment cancelled successfully", appointment });
  } catch (err) {
    console.error("Cancel appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/reschedule — patient only
exports.rescheduleAppointment = async (req, res) => {
  try {
    const { new_slot_id } = req.body;
    const user = await User.findById(req.user.id);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.patient_id.toString() !== user.ref_id.toString()) {
      return res
        .status(403)
        .json({ message: "Not authorised to reschedule this appointment" });
    }
    if (["cancelled", "completed"].includes(appointment.status)) {
      return res
        .status(400)
        .json({
          message: `Cannot reschedule a ${appointment.status} appointment`,
        });
    }

    const newSlot = await AvailabilitySlot.findById(new_slot_id);
    if (!newSlot || newSlot.is_booked || newSlot.is_blocked) {
      return res.status(409).json({ message: "New slot is not available" });
    }
    if (newSlot.doctor_id.toString() !== appointment.doctor_id.toString()) {
      return res
        .status(400)
        .json({ message: "New slot must be with the same doctor" });
    }

    const oldSlot = await AvailabilitySlot.findById(appointment.slot_id);

    // Free old slot, book new slot
    oldSlot.is_booked = false;
    newSlot.is_booked = true;
    await oldSlot.save();
    await newSlot.save();

    appointment.slot_id = newSlot._id;
    appointment.status = "rescheduled";
    await appointment.save();

    const { patient, doctor, doctorUser, patientUser } = await getProfiles(
      appointment.patient_id,
      appointment.doctor_id,
    );

    // Email both parties
    try {
      await sendEmail({
        to: patientUser.email,
        ...templates.appointmentRescheduledPatient({
          patient,
          doctor,
          oldSlot,
          newSlot,
        }),
      });
    } catch (e) {
      console.error("Reschedule patient email failed:", e.message);
    }

    try {
      await sendEmail({
        to: doctorUser.email,
        ...templates.appointmentRescheduledDoctor({
          patient,
          doctor,
          oldSlot,
          newSlot,
        }),
      });
    } catch (e) {
      console.error("Reschedule doctor email failed:", e.message);
    }

    // Notify doctor via websocket
    notify(doctorUser._id, "appointment:rescheduled", {
      message: `Appointment with ${patient.first_name} ${patient.last_name} has been rescheduled`,
      appointment_id: appointment._id,
      new_slot: { date: newSlot.slot_date, start_time: newSlot.start_time },
    });

    notify(patientUser._id, "appointment:rescheduled", {
      message: "Your appointment has been rescheduled",
      appointment_id: appointment._id,
      new_slot: { date: newSlot.slot_date, start_time: newSlot.start_time },
    });

    res
      .status(200)
      .json({ message: "Appointment rescheduled successfully", appointment });
  } catch (err) {
    console.error("Reschedule appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/appointments/:id/complete — doctor only
exports.completeAppointment = async (req, res) => {
  try {
    const { diagnosis, notes, prescriptions } = req.body;
    const user = await User.findById(req.user.id);
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      return res.status(404).json({ message: "Appointment not found" });
    }
    if (appointment.doctor_id.toString() !== user.ref_id.toString()) {
      return res
        .status(403)
        .json({
          message: "Only the assigned doctor can complete this appointment",
        });
    }
    if (appointment.status === "cancelled") {
      return res
        .status(400)
        .json({ message: "Cannot complete a cancelled appointment" });
    }
    if (appointment.status === "completed") {
      return res
        .status(400)
        .json({ message: "Appointment is already completed" });
    }

    appointment.status = "completed";
    await appointment.save();

    // Create EHR record
    const ehr = await EHRRecord.create({
      patient_id: appointment.patient_id,
      doctor_id: appointment.doctor_id,
      appointment_id: appointment._id,
      diagnosis,
      notes,
      prescriptions: prescriptions || [],
    });

    const { patient, doctor, patientUser } = await getProfiles(
      appointment.patient_id,
      appointment.doctor_id,
    );

    // Email patient with summary and prescription
    try {
      await sendEmail({
        to: patientUser.email,
        ...templates.appointmentCompleted({ patient, doctor, ehr }),
      });
    } catch (e) {
      console.error("Completion email failed:", e.message);
    }

    res.status(200).json({
      message: "Appointment completed and EHR record created",
      appointment,
      ehr,
    });
  } catch (err) {
    console.error("Complete appointment error:", err);
    res.status(500).json({ message: err.message });
  }
};
