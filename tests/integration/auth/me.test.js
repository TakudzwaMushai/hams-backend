const request = require("supertest");
const app = require("../../../src/app");
const db = require("../../setup/db");
const { signupAndLogin } = require("../../helpers/authHelper");

jest.mock("../../../src/utils/sendEmail", () =>
  jest.fn().mockResolvedValue(true),
);

beforeAll(async () => await db.connect());
afterEach(async () => await db.clearCollections());
afterAll(async () => await db.disconnect());

describe("GET /api/auth/me", () => {
  it("should return current user and profile", async () => {
    const { token } = await signupAndLogin();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.user).toBeDefined();
    expect(res.body.profile).toBeDefined();
    expect(res.body.user.email).toBe("test@example.com");
  });

  it("should not expose password_hash", async () => {
    const { token } = await signupAndLogin();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.user.password_hash).toBeUndefined();
  });

  it("should return 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("should return correct role in response", async () => {
    const { token } = await signupAndLogin({ role: "patient" });
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.body.user.role).toBe("patient");
  });
});
