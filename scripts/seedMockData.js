require("dotenv").config();

const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Appointment = require("../src/models/Appointment");
const AvailabilitySlot = require("../src/models/AvailabilitySlot");
const Doctor = require("../src/models/Doctor");
const EHRRecord = require("../src/models/EHRRecord");
const Patient = require("../src/models/Patient");
const Review = require("../src/models/Review");
const User = require("../src/models/User");

const PASSWORD = "Password123";

const daysFromNow = (days) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + days);
  return date;
};

const upsertPatient = (patient) =>
  Patient.findOneAndUpdate(
    { email: patient.email },
    { $set: patient },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const upsertDoctor = (doctor) =>
  Doctor.findOneAndUpdate(
    { email: doctor.email },
    { $set: doctor },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const upsertUser = async ({ email, role, profile }) => {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);

  return User.findOneAndUpdate(
    { email },
    {
      $set: {
        email,
        role,
        auth_provider: "local",
        password_hash: passwordHash,
        is_verified: true,
        ref_id: profile._id,
        ref_type: role === "doctor" ? "Doctor" : "Patient",
        verification_token: null,
        verification_token_expiry: null,
      },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
};

const upsertSlot = (slot) =>
  AvailabilitySlot.findOneAndUpdate(
    {
      doctor_id: slot.doctor_id,
      slot_date: slot.slot_date,
      start_time: slot.start_time,
      end_time: slot.end_time,
    },
    { $set: slot },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const upsertAppointment = (appointment) =>
  Appointment.findOneAndUpdate(
    { slot_id: appointment.slot_id },
    { $set: appointment },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const upsertReview = (review) =>
  Review.findOneAndUpdate(
    { appointment_id: review.appointment_id },
    { $set: review },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const upsertEhrRecord = (record) =>
  EHRRecord.findOneAndUpdate(
    { appointment_id: record.appointment_id },
    { $set: record },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );

const seed = async () => {
  if (!process.env.MONGO_URI) {
    throw new Error("MONGO_URI is not defined");
  }

  await mongoose.connect(process.env.MONGO_URI);

  const patients = await Promise.all([
    upsertPatient({
      first_name: "Jane",
      last_name: "Moyo",
      email: "jane.patient@hams.test",
      phone: "+263771000001",
      date_of_birth: new Date("1995-04-12"),
      gender: "female",
      nhs_number: "HAMS-PT-001",
      address: {
        line1: "12 Willow Street",
        city: "London",
        postcode: "SW1A 1AA",
      },
    }),
    upsertPatient({
      first_name: "Tariro",
      last_name: "Ndlovu",
      email: "tariro.patient@hams.test",
      phone: "+263771000002",
      date_of_birth: new Date("1988-09-24"),
      gender: "male",
      nhs_number: "HAMS-PT-002",
      address: {
        line1: "45 King Road",
        city: "Manchester",
        postcode: "M1 1AE",
      },
    }),
    upsertPatient({
      first_name: "Amina",
      last_name: "Patel",
      email: "amina.patient@hams.test",
      phone: "+263771000003",
      date_of_birth: new Date("2001-02-17"),
      gender: "female",
      nhs_number: "HAMS-PT-003",
      address: {
        line1: "8 River Lane",
        city: "Birmingham",
        postcode: "B1 1BB",
      },
    }),
  ]);

  const doctors = await Promise.all([
    upsertDoctor({
      first_name: "Alan",
      last_name: "Carter",
      email: "alan.doctor@hams.test",
      phone: "+263772000001",
      specialisation: "General Practitioner",
      license_number: "HAMS-DOC-001",
      experience_years: 12,
      fee: 45,
      education: "MBChB, University of Zimbabwe",
      bio: "Primary care doctor focused on preventive medicine and long-term patient relationships.",
      availability_types: ["Online Consultation", "In-Person"],
      clinic_name: "HAMS Central Clinic",
      average_rating: 0,
      total_reviews: 0,
    }),
    upsertDoctor({
      first_name: "Miriam",
      last_name: "Okafor",
      email: "miriam.doctor@hams.test",
      phone: "+263772000002",
      specialisation: "Cardiology",
      license_number: "HAMS-DOC-002",
      experience_years: 9,
      fee: 80,
      education: "MD Cardiology, University of Cape Town",
      bio: "Cardiologist supporting patients with heart health, blood pressure, and follow-up care.",
      availability_types: ["Online Consultation", "In-Person"],
      clinic_name: "HAMS Heart Care",
      average_rating: 5,
      total_reviews: 1,
    }),
    upsertDoctor({
      first_name: "Sarah",
      last_name: "Williams",
      email: "sarah.doctor@hams.test",
      phone: "+263772000003",
      specialisation: "Dermatology",
      license_number: "HAMS-DOC-003",
      experience_years: 7,
      fee: 65,
      education: "MBBS Dermatology, King's College London",
      bio: "Dermatologist treating common skin conditions and cosmetic skin concerns.",
      availability_types: ["Online Consultation"],
      clinic_name: "HAMS Skin Studio",
      average_rating: 0,
      total_reviews: 0,
    }),
  ]);

  await Promise.all([
    ...patients.map((patient) =>
      upsertUser({ email: patient.email, role: "patient", profile: patient }),
    ),
    ...doctors.map((doctor) =>
      upsertUser({ email: doctor.email, role: "doctor", profile: doctor }),
    ),
  ]);

  const slots = await Promise.all([
    upsertSlot({
      doctor_id: doctors[0]._id,
      slot_date: daysFromNow(1),
      start_time: "09:00",
      end_time: "09:30",
      consultation_type: "online",
      location: null,
      fee: 45,
      is_booked: false,
      is_blocked: false,
    }),
    upsertSlot({
      doctor_id: doctors[0]._id,
      slot_date: daysFromNow(2),
      start_time: "10:00",
      end_time: "10:30",
      consultation_type: "offline",
      location: "HAMS Central Clinic, Room 2",
      fee: 45,
      is_booked: true,
      is_blocked: false,
    }),
    upsertSlot({
      doctor_id: doctors[0]._id,
      slot_date: daysFromNow(9),
      start_time: "10:00",
      end_time: "10:30",
      consultation_type: "offline",
      location: "HAMS Central Clinic, Room 2",
      fee: 45,
      is_booked: true,
      is_blocked: false,
    }),
    upsertSlot({
      doctor_id: doctors[1]._id,
      slot_date: daysFromNow(3),
      start_time: "14:00",
      end_time: "14:45",
      consultation_type: "online",
      location: null,
      fee: 80,
      is_booked: false,
      is_blocked: false,
    }),
    upsertSlot({
      doctor_id: doctors[1]._id,
      slot_date: daysFromNow(-7),
      start_time: "11:00",
      end_time: "11:45",
      consultation_type: "offline",
      location: "HAMS Heart Care, Room 1",
      fee: 80,
      is_booked: true,
      is_blocked: false,
    }),
    upsertSlot({
      doctor_id: doctors[2]._id,
      slot_date: daysFromNow(4),
      start_time: "15:00",
      end_time: "15:30",
      consultation_type: "online",
      location: null,
      fee: 65,
      is_booked: false,
      is_blocked: false,
    }),
  ]);

  const appointments = await Promise.all([
    upsertAppointment({
      patient_id: patients[0]._id,
      doctor_id: doctors[0]._id,
      slot_id: slots[1]._id,
      status: "confirmed",
      type: "in-person",
      notes: "Blood pressure follow-up",
      cancellation_reason: null,
    }),
    upsertAppointment({
      patient_id: patients[0]._id,
      doctor_id: doctors[0]._id,
      slot_id: slots[2]._id,
      status: "confirmed",
      type: "in-person",
      notes: "Second recurring follow-up",
      cancellation_reason: null,
    }),
    upsertAppointment({
      patient_id: patients[1]._id,
      doctor_id: doctors[1]._id,
      slot_id: slots[4]._id,
      status: "completed",
      type: "in-person",
      notes: "Chest pain review and ECG discussion",
      cancellation_reason: null,
    }),
  ]);

  await upsertReview({
    doctor_id: doctors[1]._id,
    patient_id: patients[1]._id,
    appointment_id: appointments[2]._id,
    rating: 5,
    comment: "Helpful consultation and clear next steps.",
  });

  await upsertEhrRecord({
    patient_id: patients[1]._id,
    doctor_id: doctors[1]._id,
    appointment_id: appointments[2]._id,
    diagnosis: "Elevated blood pressure under observation",
    notes: "Patient advised to monitor blood pressure twice daily and return for review.",
    prescriptions: [
      {
        medication: "Amlodipine",
        dosage: "5mg",
        frequency: "Once daily",
        duration: "30 days",
      },
    ],
    attachments: [],
    record_date: new Date(),
  });

  console.log("Mock data seeded successfully.");
  console.log(`Patients: ${patients.length}`);
  console.log(`Doctors: ${doctors.length}`);
  console.log(`Slots: ${slots.length}`);
  console.log(`Appointments: ${appointments.length}`);
  console.log(`Default password for mock users: ${PASSWORD}`);

  await mongoose.disconnect();
};

seed().catch(async (err) => {
  console.error("Mock data seed failed:", err.message);
  await mongoose.disconnect();
  process.exit(1);
});
