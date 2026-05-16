jest.mock("../../../src/utils/sendEmail", () => jest.fn().mockResolvedValue(true));

const request = require("supertest");
const app = require("../../../src/app");
const db = require("../../setup/db");
const AvailabilitySlot = require("../../../src/models/AvailabilitySlot");
const {
  createAuthenticatedUser,
} = require("../../helpers/authHelper");

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe("Slot API", () => {
  it("lets a doctor create one slot using the doctor profile id", async () => {
    const doctor = await createAuthenticatedUser({ role: "doctor" });

    const res = await request(app)
      .post("/api/slots")
      .set("Cookie", doctor.cookies)
      .send({
        slot_date: "2026-05-20",
        start_time: "09:00",
        end_time: "09:30",
        consultation_type: "online",
        fee: 50,
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(1);
    expect(res.body.slots[0].doctor_id).toBe(doctor.profile._id.toString());
  });

  it("lets a doctor create multiple explicit slots", async () => {
    const doctor = await createAuthenticatedUser({ role: "doctor" });

    const res = await request(app)
      .post("/api/slots")
      .set("Cookie", doctor.cookies)
      .send({
        slot_dates: ["2026-05-20", "2026-05-21", "2026-05-22"],
        start_time: "10:00",
        end_time: "10:30",
        consultation_type: "offline",
        location: "Main Clinic",
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(3);
    expect(await AvailabilitySlot.countDocuments()).toBe(3);
  });

  it("creates repeating slots and skips duplicates", async () => {
    const doctor = await createAuthenticatedUser({ role: "doctor" });

    await AvailabilitySlot.create({
      doctor_id: doctor.profile._id,
      slot_date: new Date("2026-05-27"),
      start_time: "11:00",
      end_time: "11:30",
      consultation_type: "online",
    });

    const res = await request(app)
      .post("/api/slots")
      .set("Cookie", doctor.cookies)
      .send({
        slot_date: "2026-05-20",
        start_time: "11:00",
        end_time: "11:30",
        consultation_type: "online",
        repeat: { frequency: "weekly", count: 3 },
      });

    expect(res.status).toBe(201);
    expect(res.body.created_count).toBe(2);
    expect(res.body.skipped_count).toBe(1);
  });

  it("blocks patients from creating slots", async () => {
    const patient = await createAuthenticatedUser({ role: "patient" });

    const res = await request(app)
      .post("/api/slots")
      .set("Cookie", patient.cookies)
      .send({
        slot_date: "2026-05-20",
        start_time: "09:00",
        end_time: "09:30",
      });

    expect(res.status).toBe(403);
  });

  it("returns paginated available slots with filters from both slot endpoints", async () => {
    const doctor = await createAuthenticatedUser({ role: "doctor" });

    await AvailabilitySlot.create([
      {
        doctor_id: doctor.profile._id,
        slot_date: new Date("2026-05-20"),
        start_time: "09:00",
        end_time: "09:30",
        consultation_type: "online",
      },
      {
        doctor_id: doctor.profile._id,
        slot_date: new Date("2026-05-20"),
        start_time: "10:00",
        end_time: "10:30",
        consultation_type: "online",
      },
      {
        doctor_id: doctor.profile._id,
        slot_date: new Date("2026-05-20"),
        start_time: "11:00",
        end_time: "11:30",
        consultation_type: "offline",
      },
      {
        doctor_id: doctor.profile._id,
        slot_date: new Date("2026-05-20"),
        start_time: "12:00",
        end_time: "12:30",
        consultation_type: "online",
        is_booked: true,
      },
    ]);

    const query = `page=1&limit=1&date=2026-05-20&type=online`;
    const slotRes = await request(app)
      .get(`/api/slots/${doctor.profile._id}?${query}`)
      .set("Cookie", doctor.cookies);
    const doctorSlotRes = await request(app)
      .get(`/api/doctors/${doctor.profile._id}/slots?${query}`)
      .set("Cookie", doctor.cookies);

    for (const res of [slotRes, doctorSlotRes]) {
      expect(res.status).toBe(200);
      expect(res.body.slots).toHaveLength(1);
      expect(res.body.pagination).toEqual(
        expect.objectContaining({
          totalItems: 2,
          currentPage: 1,
          pageSize: 1,
          totalPages: 2,
        }),
      );
      expect(res.body.slots[0].is_booked).toBe(false);
    }
  });

  it("lets a doctor delete an unbooked owned slot", async () => {
    const doctor = await createAuthenticatedUser({ role: "doctor" });
    const slot = await AvailabilitySlot.create({
      doctor_id: doctor.profile._id,
      slot_date: new Date("2026-05-20"),
      start_time: "09:00",
      end_time: "09:30",
    });

    const res = await request(app)
      .delete(`/api/slots/${slot._id}`)
      .set("Cookie", doctor.cookies);

    expect(res.status).toBe(200);
    expect(await AvailabilitySlot.findById(slot._id)).toBeNull();
  });
});
