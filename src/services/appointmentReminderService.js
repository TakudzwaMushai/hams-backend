const Appointment = require("../models/Appointment");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");
const templates = require("../utils/emailTemplates");

const ONE_MINUTE = 60 * 1000;
const REMINDER_INTERVAL_MS = Number(
  process.env.APPOINTMENT_REMINDER_INTERVAL_MS || 5 * ONE_MINUTE,
);
const REMINDER_TARGET_MS = Number(
  process.env.APPOINTMENT_REMINDER_BEFORE_MS || 60 * ONE_MINUTE,
);
const REMINDER_WINDOW_MS = Number(
  process.env.APPOINTMENT_REMINDER_WINDOW_MS || 10 * ONE_MINUTE,
);

let reminderTimer = null;

const getAppointmentStart = (slot) => {
  if (!slot?.slot_date || !slot?.start_time) return null;

  const timeMatch = slot.start_time.match(/^(\d{1,2}):(\d{2})$/);
  if (!timeMatch) return null;

  const datePart = new Date(slot.slot_date).toISOString().slice(0, 10);
  const [, hours, minutes] = timeMatch;
  const appointmentStart = new Date(
    `${datePart}T${hours.padStart(2, "0")}:${minutes}:00`,
  );

  if (Number.isNaN(appointmentStart.getTime())) return null;

  return appointmentStart;
};

const isWithinReminderWindow = (appointmentStart, now = new Date()) => {
  const reminderTime = appointmentStart.getTime() - REMINDER_TARGET_MS;
  const earliest = now.getTime() - REMINDER_WINDOW_MS;
  const latest = now.getTime() + REMINDER_WINDOW_MS;

  return reminderTime >= earliest && reminderTime <= latest;
};

const getUserForProfile = async (profileId, refType) =>
  User.findOne({ ref_id: profileId, ref_type: refType });

const sendPatientReminder = async ({ appointment, patient, doctor, slot }) => {
  if (appointment.patient_reminder_sent_at) return;

  const patientUser = await getUserForProfile(patient._id, "Patient");
  const to = patientUser?.email || patient.email;

  if (!to) {
    console.error("Patient reminder skipped: patient email not found");
    return;
  }

  await sendEmail({
    to,
    ...templates.appointmentReminderPatient({
      patient,
      doctor,
      slot,
      appointment,
    }),
  });

  appointment.patient_reminder_sent_at = new Date();
  await appointment.save();
};

const sendDoctorReminder = async ({ appointment, patient, doctor, slot }) => {
  if (appointment.doctor_reminder_sent_at) return;

  const doctorUser = await getUserForProfile(doctor._id, "Doctor");
  const to = doctorUser?.email || doctor.email;

  if (!to) {
    console.error("Doctor reminder skipped: doctor email not found");
    return;
  }

  await sendEmail({
    to,
    ...templates.appointmentReminderDoctor({
      patient,
      doctor,
      slot,
      appointment,
    }),
  });

  appointment.doctor_reminder_sent_at = new Date();
  await appointment.save();
};

const sendAppointmentReminders = async () => {
  const appointments = await Appointment.find({
    status: { $in: ["confirmed", "rescheduled"] },
    $or: [
      { patient_reminder_sent_at: null },
      { doctor_reminder_sent_at: null },
      { patient_reminder_sent_at: { $exists: false } },
      { doctor_reminder_sent_at: { $exists: false } },
    ],
  })
    .populate("slot_id")
    .populate("patient_id", "first_name last_name email")
    .populate("doctor_id", "first_name last_name email specialisation")
    .limit(200);

  const now = new Date();

  for (const appointment of appointments) {
    const slot = appointment.slot_id;
    const patient = appointment.patient_id;
    const doctor = appointment.doctor_id;
    const appointmentStart = getAppointmentStart(slot);

    if (!slot || !patient || !doctor || !appointmentStart) continue;
    if (!isWithinReminderWindow(appointmentStart, now)) continue;

    try {
      await sendPatientReminder({ appointment, patient, doctor, slot });
    } catch (err) {
      console.error("Patient reminder email failed:", err.message);
    }

    try {
      await sendDoctorReminder({ appointment, patient, doctor, slot });
    } catch (err) {
      console.error("Doctor reminder email failed:", err.message);
    }
  }
};

const startAppointmentReminderJob = () => {
  if (reminderTimer) return reminderTimer;

  const run = async () => {
    try {
      await sendAppointmentReminders();
    } catch (err) {
      console.error("Appointment reminder job failed:", err.message);
    }
  };

  reminderTimer = setInterval(run, REMINDER_INTERVAL_MS);
  reminderTimer.unref?.();
  setTimeout(run, ONE_MINUTE).unref?.();

  return reminderTimer;
};

module.exports = {
  sendAppointmentReminders,
  startAppointmentReminderJob,
};
