const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Patient = require("../models/Patient");
const Doctor = require("../models/Doctor");

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

    const user = await User.create({
      email,
      password_hash,
      role,
      ref_id: profile._id,
      ref_type: role === "patient" ? "Patient" : "Doctor",
    });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN },
    );

    res.status(201).json({
      message: "Account created successfully",
      token,
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        profile_id: profile._id,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error during signup" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    // Update last_login
    user.last_login = new Date();
    await user.save();

    // Fetch profile (patient or doctor)
    const profile = await (user.ref_type === "Patient" ? Patient : Doctor)
      .findById(user.ref_id)
      .select("-__v");

    // Sign JWT
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
        last_login: user.last_login,
        profile,
      },
    });
  } catch (err) {
    console.error("Login error:", err);

    res.status(500).json({ message: !process.env.JWT_SECRET ? "Server error during login" : "" });
  }
};
