const request = require("supertest");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_ACCESS_SECRET ||= "test-access-secret";

const app = require("../../src/app");
const User = require("../../src/models/User");
const Patient = require("../../src/models/Patient");
const Doctor = require("../../src/models/Doctor");

let counter = 0;

const signupAndLogin = async (overrides = {}) => {
  counter += 1;
  const userData = {
    email: "test@example.com",
    password: "TestPass123",
    role: "patient",
    first_name: "Test",
    last_name: "User",
    ...overrides,
  };

  if (userData.role === "doctor") {
    userData.specialisation ||= "General Practitioner";
    userData.license_number ||= `GMC-${Date.now()}-${counter}`;
  }

  await request(app).post("/api/auth/signup").send(userData);

  // Verify the user directly in DB
  await User.updateOne(
    { email: userData.email },
    {
      is_verified: true,
      verification_token: null,
      verification_token_expiry: null,
    },
  );

  // Login and capture cookies from response
  const res = await request(app).post("/api/auth/login").send({
    email: userData.email,
    password: userData.password,
  });

  // Extract cookies from Set-Cookie header
  const cookies = res.headers['set-cookie'];

  return {
    cookies, // pass these to subsequent requests
    user: res.body.user,
    profile: res.body.user.profile,
    userData,
  };
};

const createAuthenticatedUser = async (overrides = {}) => {
  counter += 1;
  const role = overrides.role || "patient";
  const email = overrides.email || `${role}${counter}@example.com`;
  const password = overrides.password || "TestPass123";
  const first_name = overrides.first_name || (role === "doctor" ? "Alan" : "Jane");
  const last_name = overrides.last_name || (role === "doctor" ? "Carter" : "Smith");

  const profile =
    role === "doctor"
      ? await Doctor.create({
          first_name,
          last_name,
          email,
          phone: overrides.phone,
          specialisation: overrides.specialisation || "General Practitioner",
          license_number:
            overrides.license_number || `GMC-${Date.now()}-${counter}`,
        })
      : await Patient.create({
          first_name,
          last_name,
          email,
          phone: overrides.phone,
        });

  const user = await User.create({
    email,
    password_hash: await bcrypt.hash(password, 12),
    role,
    is_verified: true,
    ref_id: profile._id,
    ref_type: role === "doctor" ? "Doctor" : "Patient",
  });

  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET || "test-access-secret",
    { expiresIn: "1h" },
  );

  return {
    cookies: [`access_token=${token}`],
    user,
    profile,
    password,
  };
};

module.exports = { signupAndLogin, createAuthenticatedUser };
