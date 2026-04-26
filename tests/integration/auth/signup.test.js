const request = require("supertest");
const app = require("../../../src/app");
const db = require("../../setup/db");

jest.mock("../../../src/utils/sendEmail", () =>
  jest.fn().mockResolvedValue(true),
);

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe("POST /api/auth/signup", () => {
  const validPatient = {
    email: "jane@example.com",
    password: "SecurePass123",
    role: "patient",
    first_name: "Jane",
    last_name: "Smith",
  };

  const validDoctor = {
    email: "doctor@nhs.uk",
    password: "SecurePass123",
    role: "doctor",
    first_name: "Alan",
    last_name: "Carter",
    specialisation: "General Practitioner",
    license_number: "GMC-1234567",
  };

  it("should register a patient successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send(validPatient);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("patient");
    expect(res.body.user.email).toBe("jane@example.com");
  });

  it("should register a doctor successfully", async () => {
    const res = await request(app).post("/api/auth/signup").send(validDoctor);
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe("doctor");
  });

  it("should return 409 if email already registered", async () => {
    await request(app).post("/api/auth/signup").send(validPatient);
    const res = await request(app).post("/api/auth/signup").send(validPatient);
    expect(res.status).toBe(409);
    expect(res.body.message).toBe("Email already registered");
  });

  it("should return 422 if email is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPatient, email: "notanemail" });
    expect(res.status).toBe(422);
  });

  it("should return 422 if password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPatient, password: "123" });
    expect(res.status).toBe(422);
  });

  it("should return 422 if first_name is missing", async () => {
    const { first_name, ...data } = validPatient;
    const res = await request(app).post("/api/auth/signup").send(data);
    expect(res.status).toBe(422);
  });

  it("should return 422 if last_name is missing", async () => {
    const { last_name, ...data } = validPatient;
    const res = await request(app).post("/api/auth/signup").send(data);
    expect(res.status).toBe(422);
  });

  it("should return 422 if role is invalid", async () => {
    const res = await request(app)
      .post("/api/auth/signup")
      .send({ ...validPatient, role: "admin" });
    expect(res.status).toBe(422);
  });

  it("should not return password_hash in response", async () => {
    const res = await request(app).post("/api/auth/signup").send(validPatient);
    expect(res.body.user.password_hash).toBeUndefined();
  });
});
