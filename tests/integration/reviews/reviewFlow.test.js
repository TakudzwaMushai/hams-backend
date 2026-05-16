const request = require("supertest");

const app = require("../../../src/app");
const db = require("../../setup/db");
const Appointment = require("../../../src/models/Appointment");
const AvailabilitySlot = require("../../../src/models/AvailabilitySlot");
const Doctor = require("../../../src/models/Doctor");
const Review = require("../../../src/models/Review");
const { createAuthenticatedUser } = require("../../helpers/authHelper");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

const createCompletedAppointment = async (patient, doctor, overrides = {}) => {
  const slot = await AvailabilitySlot.create({
    doctor_id: doctor.profile._id,
    slot_date: new Date("2026-05-20"),
    start_time: overrides.start_time || "09:00",
    end_time: overrides.end_time || "09:30",
    consultation_type: "online",
    is_booked: true,
  });

  return Appointment.create({
    patient_id: patient.profile._id,
    doctor_id: doctor.profile._id,
    slot_id: slot._id,
    status: overrides.status || "completed",
  });
};

describe("Review API", () => {
  it("lets a patient review their completed appointment and updates doctor rating", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const appointment = await createCompletedAppointment(patient, doctor);

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", patient.cookies)
      .send({
        appointment_id: appointment._id,
        rating: 5,
        comment: "Excellent care",
      });

    expect(res.status).toBe(201);
    expect(res.body.review.rating).toBe(5);

    const updatedDoctor = await Doctor.findById(doctor.profile._id);
    expect(updatedDoctor.average_rating).toBe(5);
    expect(updatedDoctor.total_reviews).toBe(1);
  });

  it("prevents duplicate reviews for the same appointment", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const appointment = await createCompletedAppointment(patient, doctor);

    await Review.create({
      appointment_id: appointment._id,
      patient_id: patient.profile._id,
      doctor_id: doctor.profile._id,
      rating: 4,
    });

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", patient.cookies)
      .send({ appointment_id: appointment._id, rating: 5 });

    expect(res.status).toBe(409);
  });

  it("only allows patients to review their own completed appointments", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const otherPatient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const appointment = await createCompletedAppointment(patient, doctor);

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", otherPatient.cookies)
      .send({ appointment_id: appointment._id, rating: 5 });

    expect(res.status).toBe(403);
  });

  it("rejects reviews for appointments that are not completed", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const appointment = await createCompletedAppointment(patient, doctor, {
      status: "confirmed",
    });

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", patient.cookies)
      .send({ appointment_id: appointment._id, rating: 4 });

    expect(res.status).toBe(400);
  });

  it("validates review ratings", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });

    const res = await request(app)
      .post("/api/reviews")
      .set("Cookie", patient.cookies)
      .send({ appointment_id: "anything", rating: 6 });

    expect(res.status).toBe(422);
  });

  it("returns paginated doctor reviews", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });

    const firstAppointment = await createCompletedAppointment(patient, doctor, {
      start_time: "09:00",
    });
    const secondAppointment = await createCompletedAppointment(patient, doctor, {
      start_time: "10:00",
    });

    await Review.create([
      {
        appointment_id: firstAppointment._id,
        patient_id: patient.profile._id,
        doctor_id: doctor.profile._id,
        rating: 5,
      },
      {
        appointment_id: secondAppointment._id,
        patient_id: patient.profile._id,
        doctor_id: doctor.profile._id,
        rating: 4,
      },
    ]);

    const res = await request(app)
      .get(`/api/reviews/doctor/${doctor.profile._id}?page=1&limit=1`)
      .set("Cookie", patient.cookies);

    expect(res.status).toBe(200);
    expect(res.body.reviews).toHaveLength(1);
    expect(res.body.pagination).toEqual({
      total: 2,
      page: 1,
      limit: 1,
      total_pages: 2,
    });
  });
});
