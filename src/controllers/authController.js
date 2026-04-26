const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");
const sendEmail = require("../utils/sendEmail");

// ─── SIGNUP ────────────────────────────────────────────────────────────────
exports.signup = async (req, res) => {
  try {
    const {
      role,
      email,
      password,
      first_name,
      last_name,
      phone,
      date_of_birth,
      gender,
      nhs_number,
      address,
      specialisation,
      license_number,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: "Email already registered" });
    }

    const password_hash = await bcrypt.hash(password, 12);

    let profile = null;

    if (role === "patient") {
      profile = await Patient.create({
        first_name,
        last_name,
        email,
        phone,
        date_of_birth,
        gender,
        nhs_number,
        address,
      });
    } else if (role === "doctor") {
      profile = await Doctor.create({
        first_name,
        last_name,
        email,
        phone,
        specialisation,
        license_number,
      });
    } else {
      return res
        .status(400)
        .json({ message: "Role must be patient or doctor" });
    }

    // Generate verification token
    const verification_token = crypto.randomBytes(32).toString("hex");
    const verification_token_expiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24 hours

    const user = await User.create({
      email,
      password_hash,
      role,
      ref_id: profile._id,
      ref_type: role === "patient" ? "Patient" : "Doctor",
      verification_token,
      verification_token_expiry,
    });

    // Send verification email
    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verification_token}`;
    await sendEmail({
      to: user.email,
      subject: "HAMS — Verify Your Email",
      html: `
        <h2>Welcome to HAMS</h2>
        <p>Hi ${first_name}, thank you for registering.</p>
        <p>Please verify your email address by clicking the link below:</p>
        <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <p>If you did not create an account, please ignore this email.</p>
      `,
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(201).json({
      message:
        "Account created successfully. Please check your email to verify your account.",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        profile_id: profile._id,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

// ─── LOGIN ─────────────────────────────────────────────────────────────────
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Block unverified users
    if (!user.is_verified) {
      return res.status(403).json({
        message:
          "Please verify your email before logging in. Check your inbox or request a new verification link.",
      });
    }

    user.last_login = new Date();
    await user.save();

    const profile = await (user.ref_type === "Patient" ? Patient : Doctor)
      .findById(user.ref_id)
      .select("-__v");

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(200).json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        last_login: user.last_login,
        profile,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error during login" });
  }
};

// ─── LOGOUT ────────────────────────────────────────────────────────────────
exports.logout = (req, res) => {
  res.status(200).json({ message: "Logged out successfully" });
};

// ─── ME ────────────────────────────────────────────────────────────────────
exports.me = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password_hash -__v");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const profile = await (user.ref_type === "Patient" ? Patient : Doctor)
      .findById(user.ref_id)
      .select("-__v");

    res.status(200).json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        last_login: user.last_login,
        created_at: user.created_at,
      },
      profile,
    });
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── VERIFY EMAIL ──────────────────────────────────────────────────────────
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const user = await User.findOne({
      verification_token: token,
      verification_token_expiry: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    if (user.is_verified) {
      return res
        .status(200)
        .json({ message: "Email already verified. You can log in." });
    }

    user.is_verified = true;
    user.verification_token = null;
    user.verification_token_expiry = null;
    await user.save();

    res
      .status(200)
      .json({ message: "Email verified successfully. You can now log in." });
  } catch (err) {
    console.error("Verify email error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── RESEND VERIFICATION ───────────────────────────────────────────────────
exports.resendVerification = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    // Always return 200 to prevent email enumeration
    if (!user) {
      return res
        .status(200)
        .json({
          message: "If that email exists, a verification link has been sent",
        });
    }

    if (user.is_verified) {
      return res
        .status(200)
        .json({ message: "Email is already verified. You can log in." });
    }

    // Generate new token
    user.verification_token = crypto.randomBytes(32).toString("hex");
    user.verification_token_expiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
    await user.save();

    const verifyUrl = `${process.env.FRONTEND_URL}/verify-email?token=${user.verification_token}`;
    await sendEmail({
      to: user.email,
      subject: "HAMS — Verify Your Email",
      html: `
        <h2>Email Verification</h2>
        <p>Click the link below to verify your email address:</p>
        <a href="${verifyUrl}" target="_blank">${verifyUrl}</a>
        <p>This link expires in <strong>24 hours</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res
      .status(200)
      .json({
        message: "If that email exists, a verification link has been sent",
      });
  } catch (err) {
    console.error("Resend verification error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── FORGOT PASSWORD ───────────────────────────────────────────────────────
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(200)
        .json({ message: "If that email exists, a reset link has been sent" });
    }

    const resetToken = crypto.randomBytes(32).toString("hex");
    const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    user.reset_token = resetToken;
    user.reset_token_expiry = tokenExpiry;
    await user.save();

    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    await sendEmail({
      to: user.email,
      subject: "HAMS — Password Reset Request",
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset. Click the link below to set a new password:</p>
        <a href="${resetUrl}" target="_blank">${resetUrl}</a>
        <p>This link expires in <strong>1 hour</strong>.</p>
        <p>If you did not request this, please ignore this email.</p>
      `,
    });

    res
      .status(200)
      .json({ message: "If that email exists, a reset link has been sent" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: err.message });
  }
};

// ─── RESET PASSWORD ────────────────────────────────────────────────────────
exports.resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    const user = await User.findOne({
      reset_token: token,
      reset_token_expiry: { $gt: new Date() },
    });

    if (!user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired reset token" });
    }

    user.password_hash = await bcrypt.hash(password, 12);
    user.reset_token = null;
    user.reset_token_expiry = null;
    await user.save();

    res
      .status(200)
      .json({ message: "Password reset successful. You can now log in." });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: err.message });
  }
};
