jest.mock("../../../src/config/db", () => jest.fn().mockResolvedValue());
jest.mock("../../../src/models/User", () => ({ findOne: jest.fn() }));
jest.mock("../../../src/models/Patient", () => ({ findById: jest.fn() }));
jest.mock("../../../src/models/Doctor", () => ({ findById: jest.fn() }));
jest.mock("../../../src/utils/setCookies", () => ({
  setTokenCookies: jest.fn(),
  clearTokenCookies: jest.fn(),
}));
jest.mock("../../../src/utils/sendEmail", () => jest.fn());
jest.mock("bcryptjs", () => ({
  compare: jest.fn(),
  hash: jest.fn(),
}));
jest.mock("jsonwebtoken", () => ({ sign: jest.fn() }));
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn(),
    getToken: jest.fn(),
    verifyIdToken: jest.fn(),
  })),
}));

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../../../src/models/User");
const Patient = require("../../../src/models/Patient");
const { setTokenCookies } = require("../../../src/utils/setCookies");
const { login } = require("../../../src/controllers/authController");

const createResponse = () => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn(),
});

describe("authController.login", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_ACCESS_SECRET = "access-secret";
    process.env.JWT_REFRESH_SECRET = "refresh-secret";
    process.env.JWT_ACCESS_EXPIRES = "15m";
    process.env.JWT_REFRESH_EXPIRES = "7d";
  });

  it("returns a Google account hint when a Google-created account tries password login", async () => {
    User.findOne.mockResolvedValue({
      email: "google@example.com",
      auth_provider: "google",
    });

    const req = {
      body: { email: "google@example.com", password: "Password123" },
    };
    const res = createResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "This account was created with Google. Please sign in with Google.",
      code: "GOOGLE_ACCOUNT",
    });
    expect(bcrypt.compare).not.toHaveBeenCalled();
  });

  it("rejects unverified email accounts after password validation", async () => {
    User.findOne.mockResolvedValue({
      email: "patient@example.com",
      auth_provider: "local",
      password_hash: "hash",
      is_verified: false,
    });
    bcrypt.compare.mockResolvedValue(true);

    const req = {
      body: { email: "patient@example.com", password: "Password123" },
    };
    const res = createResponse();

    await login(req, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: expect.stringContaining("verify your email"),
      }),
    );
  });

  it("sets auth cookies and returns the profile for a verified password login", async () => {
    const save = jest.fn().mockResolvedValue();
    const user = {
      _id: "user-id",
      email: "patient@example.com",
      role: "patient",
      auth_provider: "local",
      password_hash: "hash",
      is_verified: true,
      ref_type: "Patient",
      ref_id: "patient-id",
      save,
    };
    const profile = { _id: "patient-id", first_name: "Jane" };
    const select = jest.fn().mockResolvedValue(profile);

    User.findOne.mockResolvedValue(user);
    Patient.findById.mockReturnValue({ select });
    bcrypt.compare.mockResolvedValue(true);
    bcrypt.hash.mockResolvedValue("hashed-refresh-token");
    jwt.sign
      .mockReturnValueOnce("access-token")
      .mockReturnValueOnce("refresh-token");

    const req = {
      body: { email: "patient@example.com", password: "Password123" },
    };
    const res = createResponse();

    await login(req, res);

    expect(setTokenCookies).toHaveBeenCalledWith(res, {
      accessToken: "access-token",
      refreshToken: "refresh-token",
    });
    expect(save).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: "Login successful",
        user: expect.objectContaining({
          email: "patient@example.com",
          profile,
        }),
      }),
    );
  });
});
