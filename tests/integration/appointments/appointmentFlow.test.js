jest.mock("../../../src/utils/sendEmail", () => jest.fn().mockResolvedValue(true));
jest.mock("../../../src/utils/socket", () => ({
  getIO: () => ({ to: () => ({ emit: jest.fn() }) }),
}));

const request = require("supertest");
const app = require("../../../src/app");
const db = require("../../setup/db");
const Appointment = require("../../../src/models/Appointment");
const AvailabilitySlot = require("../../../src/models/AvailabilitySlot");
const EHRRecord = require("../../../src/models/EHRRecord");
const {
  createAuthenticatedUser,
} = require("../../helpers/authHelper");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

const createSlot = (doctorId, overrides = {}) =>
  AvailabilitySlot.create({
    doctor_id: doctorId,
    slot_date: new Date("2026-05-20"),
    start_time: "09:00",
    end_time: "09:30",
    consultation_type: "online",
    ...overrides,
  });

describe("Appointment API", () => {
  it("books a single confirmed appointment and marks the slot booked", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const slot = await createSlot(doctor.profile._id);

    const res = await request(app)
      .post("/api/appointments")
      .set("Cookie", patient.cookies)
      .send({ slot_id: slot._id, type: "video", notes: "Follow-up" });

    expect(res.status).toBe(201);
    expect(res.body.booking_status).toBe("confirmed");
    expect(res.body.appointments).toHaveLength(1);
    expect(res.body.appointments[0].status).toBe("confirmed");

    const updatedSlot = await AvailabilitySlot.findById(slot._id);
    expect(updatedSlot.is_booked).toBe(true);
  });

  it("books recurring appointments only for existing matching slots", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const firstSlot = await createSlot(doctor.profile._id, {
      slot_date: new Date("2026-05-20"),
    });
    await createSlot(doctor.profile._id, {
      slot_date: new Date("2026-05-27"),
    });

    const res = await request(app)
      .post("/api/appointments")
      .set("Cookie", patient.cookies)
      .send({
        slot_id: firstSlot._id,
        repeat: { frequency: "weekly", count: 3 },
      });

    expect(res.status).toBe(201);
    expect(res.body.booking_status).toBe("partially_confirmed");
    expect(res.body.requested_count).toBe(3);
    expect(res.body.confirmed_count).toBe(2);
    expect(res.body.unavailable_count).toBe(1);
    expect(await Appointment.countDocuments()).toBe(2);
  });

  it("prevents double booking the same slot", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const slot = await createSlot(doctor.profile._id, { is_booked: true });

    const res = await request(app)
      .post("/api/appointments")
      .set("Cookie", patient.cookies)
      .send({ slot_id: slot._id });

    expect(res.status).toBe(409);
  });

  it("returns paginated appointments and filters by timeframe", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const pastSlot = await createSlot(doctor.profile._id, {
      slot_date: new Date("2020-01-01"),
      start_time: "09:00",
    });
    const futureSlot = await createSlot(doctor.profile._id, {
      slot_date: new Date("2099-01-01"),
      start_time: "10:00",
    });

    await Appointment.create([
      {
        patient_id: patient.profile._id,
        doctor_id: doctor.profile._id,
        slot_id: pastSlot._id,
      },
      {
        patient_id: patient.profile._id,
        doctor_id: doctor.profile._id,
        slot_id: futureSlot._id,
      },
    ]);

    const upcoming = await request(app)
      .get("/api/appointments/me?timeframe=upcoming&page=1&limit=10")
      .set("Cookie", patient.cookies);
    const past = await request(app)
      .get("/api/appointments/me?timeframe=past&page=1&limit=10")
      .set("Cookie", patient.cookies);

    expect(upcoming.status).toBe(200);
    expect(upcoming.body.appointments).toHaveLength(1);
    expect(upcoming.body.pagination.totalItems).toBe(1);
    expect(new Date(upcoming.body.appointments[0].slot_id.slot_date).getFullYear()).toBe(2099);

    expect(past.status).toBe(200);
    expect(past.body.appointments).toHaveLength(1);
    expect(past.body.pagination.totalItems).toBe(1);
    expect(new Date(past.body.appointments[0].slot_id.slot_date).getFullYear()).toBe(2020);
  });

  it("cancels an appointment and frees the slot", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const slot = await createSlot(doctor.profile._id, { is_booked: true });
    const appointment = await Appointment.create({
      patient_id: patient.profile._id,
      doctor_id: doctor.profile._id,
      slot_id: slot._id,
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointment._id}/cancel`)
      .set("Cookie", patient.cookies)
      .send({ reason: "No longer needed" });

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe("cancelled");
    expect((await AvailabilitySlot.findById(slot._id)).is_booked).toBe(false);
  });

  it("reschedules to another available slot with the same doctor", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const oldSlot = await createSlot(doctor.profile._id, { is_booked: true });
    const newSlot = await createSlot(doctor.profile._id, {
      slot_date: new Date("2026-05-21"),
      start_time: "10:00",
      end_time: "10:30",
    });
    const appointment = await Appointment.create({
      patient_id: patient.profile._id,
      doctor_id: doctor.profile._id,
      slot_id: oldSlot._id,
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointment._id}/reschedule`)
      .set("Cookie", patient.cookies)
      .send({ new_slot_id: newSlot._id });

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe("rescheduled");
    expect((await AvailabilitySlot.findById(oldSlot._id)).is_booked).toBe(false);
    expect((await AvailabilitySlot.findById(newSlot._id)).is_booked).toBe(true);
  });

  it("lets the assigned doctor complete an appointment and create an EHR record", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const slot = await createSlot(doctor.profile._id, { is_booked: true });
    const appointment = await Appointment.create({
      patient_id: patient.profile._id,
      doctor_id: doctor.profile._id,
      slot_id: slot._id,
    });

    const res = await request(app)
      .patch(`/api/appointments/${appointment._id}/complete`)
      .set("Cookie", doctor.cookies)
      .send({
        diagnosis: "Healthy",
        notes: "Rest",
        prescriptions: [{ medication: "A", dosage: "1", frequency: "Daily" }],
      });

    expect(res.status).toBe(200);
    expect(res.body.appointment.status).toBe("completed");
    expect(await EHRRecord.countDocuments({ appointment_id: appointment._id })).toBe(1);
  });
});
