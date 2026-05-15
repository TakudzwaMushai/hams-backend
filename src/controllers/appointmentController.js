const Appointment = require("../models/Appointment");
const AvailabilitySlot = require("../models/AvailabilitySlot");
const EHRRecord = require("../models/EHRRecord");
const Review = require("../models/Review");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmail");
const { getIO } = require("../utils/socket");
const templates = require("../utils/emailTemplates");
const {
  getPagination,
  getPaginationMeta,
} = require("../utils/pagination");

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

const getSlotDateFilter = (timeframe) => {
  if (!["past", "upcoming"].includes(timeframe)) return null;

  const now = new Date();

  return timeframe === "past" ? { $lt: now } : { $gte: now };
};

// POST /api/appointments — patient books a slot
exports.bookAppointment = async (req, res) => {
  const acquiredSlotIds = [];
  let bookingPersisted = false;

  try {
    const { slot_id, type, notes, repeat } = req.body;

    const repeatConfig = {
      frequency: repeat?.frequency || "none", // none | weekly | monthly
      count: Number(repeat?.count || 1),
    };

    if (
      repeatConfig.count < 1 ||
      repeatConfig.count > 60 ||
      !["none", "weekly", "monthly"].includes(repeatConfig.frequency)
    ) {
      return res.status(400).json({
        message:
          "Repeat must use frequency none, weekly, or monthly and count between 1 and 60",
      });
    }

    const getRepeatDate = (startDate, frequency, index) => {
      const nextDate = new Date(startDate);

      if (frequency === "weekly") {
        nextDate.setDate(nextDate.getDate() + index * 7);
        return nextDate;
      }

      if (frequency === "monthly") {
        const targetDay = nextDate.getDate();

        nextDate.setMonth(nextDate.getMonth() + index);

        // Handle month overflow (e.g. Feb 30)
        if (nextDate.getDate() !== targetDay) {
          nextDate.setDate(0);
        }

        return nextDate;
      }

      return nextDate;
    };

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "patient") {
      return res.status(403).json({
        message: "Only patients can book appointments",
      });
    }

    const slot = await AvailabilitySlot.findOneAndUpdate(
      {
        _id: slot_id,
        is_booked: false,
        is_blocked: false,
      },
      { is_booked: true },
      { new: true },
    );

    if (!slot) {
      return res.status(409).json({
        message: "Slot not found or no longer available",
      });
    }

    acquiredSlotIds.push(slot._id);

    // MAIN APPOINTMENT
    const appointment = await Appointment.create({
      patient_id: user.ref_id,
      doctor_id: slot.doctor_id,
      slot_id: slot._id,
      type: type || "in-person",
      notes,
    });

    const appointments = [appointment];
    const confirmedSlots = [slot];
    const unavailable_dates = [];

    // RECURRING APPOINTMENTS
    if (
      ["weekly", "monthly"].includes(repeatConfig.frequency) &&
      repeatConfig.count > 1
    ) {
      for (let i = 1; i < repeatConfig.count; i++) {
        const nextDate = getRepeatDate(
          slot.slot_date,
          repeatConfig.frequency,
          i,
        );

        const startOfDay = new Date(nextDate);
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date(nextDate);
        endOfDay.setHours(23, 59, 59, 999);

        const nextSlot = await AvailabilitySlot.findOneAndUpdate(
          {
            doctor_id: slot.doctor_id,
            slot_date: {
              $gte: startOfDay,
              $lte: endOfDay,
            },
            start_time: slot.start_time,
            is_booked: false,
            is_blocked: false,
          },
          { is_booked: true },
          { new: true },
        );

        // Slot unavailable
        if (!nextSlot) {
          unavailable_dates.push(nextDate);
          continue;
        }

        acquiredSlotIds.push(nextSlot._id);

        // Create repeated appointment
        const repeatedAppointment = await Appointment.create({
          patient_id: user.ref_id,
          doctor_id: nextSlot.doctor_id,
          slot_id: nextSlot._id,
          type: type || "in-person",
          notes,
        });

        appointments.push(repeatedAppointment);
        confirmedSlots.push(nextSlot);
      }
    }

    bookingPersisted = true;

    const { patient, doctor, doctorUser, patientUser } = await getProfiles(
      user.ref_id,
      slot.doctor_id,
    );

    // EMAIL PATIENT
    try {
      const patientEmail = templates.appointmentBookedPatient({
        patient,
        doctor,
        slot,
        appointments,
        slots: confirmedSlots,
        repeat: repeatConfig,
        unavailable_dates,
      });

      await sendEmail({
        to: patientUser.email,
        ...patientEmail,
      });
    } catch (e) {
      console.error("Patient email failed:", e.message);
    }

    // EMAIL DOCTOR
    try {
      const doctorEmail = templates.appointmentBookedDoctor({
        patient,
        doctor,
        slot,
        appointments,
        slots: confirmedSlots,
        repeat: repeatConfig,
        unavailable_dates,
      });

      await sendEmail({
        to: doctorUser.email,
        ...doctorEmail,
      });
    } catch (e) {
      console.error("Doctor email failed:", e.message);
    }

    // SOCKET NOTIFICATION
    notify(doctorUser._id, "appointment:booked", {
      message: `New appointment booked by ${patient.first_name} ${patient.last_name}`,
      appointments_count: appointments.length,
      appointment: {
        id: appointment._id,
        patient: `${patient.first_name} ${patient.last_name}`,
        date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      },
    });

    return res.status(201).json({
      message:
        appointments.length > 1
          ? "Recurring appointments booked successfully"
          : "Appointment booked successfully",
      booking_status:
        unavailable_dates.length > 0 ? "partially_confirmed" : "confirmed",
      requested_count: repeatConfig.count,
      confirmed_count: appointments.length,
      unavailable_count: unavailable_dates.length,

      appointments: appointments.map((appt) => ({
        ...appt.toObject(),
      })),

      unavailable_dates,

      slot_details: {
        date: slot.slot_date,
        start_time: slot.start_time,
        end_time: slot.end_time,
        type: slot.consultation_type,
        location: slot.location,
        fee: slot.fee,
      },
    });
  } catch (err) {
    console.error("Book appointment error:", err);

    if (!bookingPersisted && acquiredSlotIds.length > 0) {
      await AvailabilitySlot.updateMany(
        { _id: { $in: acquiredSlotIds } },
        { is_booked: false },
      );
    }

    return res.status(500).json({
      message: err.message,
    });
  }
};

// GET /api/appointments/me — get my appointments
exports.getMyAppointments = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const { page, limit, skip } = getPagination(req.query);
    const slotDateFilter = getSlotDateFilter(req.query.timeframe);
    const filter =
      user.role === "patient"
        ? { patient_id: user.ref_id }
        : { doctor_id: user.ref_id };

    const pipeline = [
      { $match: filter },
      {
        $lookup: {
          from: "availabilityslots",
          localField: "slot_id",
          foreignField: "_id",
          as: "slot",
        },
      },
      { $unwind: "$slot" },
    ];

    if (slotDateFilter) {
      pipeline.push({
        $match: {
          "slot.slot_date": slotDateFilter,
        },
      });
    }

    const totalResult = await Appointment.aggregate([
      ...pipeline,
      { $count: "total" },
    ]);
    const totalItems = totalResult[0]?.total || 0;

    const appointmentIds = await Appointment.aggregate([
      ...pipeline,
      { $sort: { "slot.slot_date": slotDateFilter?.$lt ? -1 : 1, created_at: -1 } },
      { $skip: skip },
      { $limit: limit },
      { $project: { _id: 1 } },
    ]);

    const appointments = await Appointment.find(filter)
      .where("_id")
      .in(appointmentIds.map((appointment) => appointment._id))
      .populate("slot_id")
      .populate("patient_id", "first_name last_name email phone")
      .populate("doctor_id", "first_name last_name specialisation");

    const appointmentOrder = new Map(
      appointmentIds.map((appointment, index) => [
        appointment._id.toString(),
        index,
      ]),
    );

    appointments.sort(
      (first, second) =>
        appointmentOrder.get(first._id.toString()) -
        appointmentOrder.get(second._id.toString()),
    );

    // Add review flag for each appointment
    const appointmentsWithReviewFlag = await Promise.all(
      appointments.map(async (appointment) => {
        const review = await Review.findOne({
          appointment_id: appointment._id,
        });
        return {
          ...appointment.toObject(),
          is_reviewed: !!review,
        };
      }),
    );

    res.status(200).json({
      appointments: appointmentsWithReviewFlag,
      pagination: getPaginationMeta({ totalItems, page, limit }),
    });
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
      return res.status(400).json({
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
      return res.status(403).json({
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
