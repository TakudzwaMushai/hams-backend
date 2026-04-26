const request = require("supertest");
const app = require("../../../src/app");
const db = require("../../setup/db");
const User = require("../../../src/models/User");
const { signupAndLogin } = require("../../helpers/authHelper");

jest.mock("../../../src/utils/sendEmail", () =>
  jest.fn().mockResolvedValue(true),
);

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe("POST /api/auth/reset-password", () => {
  it("should reset password with valid token", async () => {
    await signupAndLogin();

    // Trigger forgot password to generate token
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    // Get token directly from DB
    const user = await User.findOne({ email: "test@example.com" });
    const token = user.reset_token;

    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "NewSecurePass123" });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain("reset successful");
  });

  it("should clear reset_token after successful reset", async () => {
    await signupAndLogin();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    const user = await User.findOne({ email: "test@example.com" });
    const token = user.reset_token;

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "NewSecurePass123" });

    const updated = await User.findOne({ email: "test@example.com" });
    expect(updated.reset_token).toBeNull();
    expect(updated.reset_token_expiry).toBeNull();
  });

  it("should allow login with new password after reset", async () => {
    await signupAndLogin();
    await request(app)
      .post("/api/auth/forgot-password")
      .send({ email: "test@example.com" });

    const user = await User.findOne({ email: "test@example.com" });
    const token = user.reset_token;

    await request(app)
      .post("/api/auth/reset-password")
      .send({ token, password: "NewSecurePass123" });

    const loginRes = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@example.com", password: "NewSecurePass123" });

    expect(loginRes.status).toBe(200);
    expect(loginRes.headers["set-cookie"]).toBeDefined();
  });

  it("should return 400 for invalid token", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "invalidtoken", password: "NewSecurePass123" });
    expect(res.status).toBe(400);
  });

  it("should return 422 if password is too short", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ token: "sometoken", password: "123" });
    expect(res.status).toBe(422);
  });

  it("should return 422 if token is missing", async () => {
    const res = await request(app)
      .post("/api/auth/reset-password")
      .send({ password: "NewSecurePass123" });
    expect(res.status).toBe(422);
  });
});
