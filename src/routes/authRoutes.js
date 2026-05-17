const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const {
  signup,
  login,
  refresh,
  logout,
  me,
  updateProfile,
  verifyEmail,
  resendVerification,
  forgotPassword,
  resetPassword,
  googleAuthRedirect,
  googleAuthCallback,
} = require("../controllers/authController");

const signupValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
  body("role")
    .isIn(["patient", "doctor"])
    .withMessage("Role must be patient or doctor"),
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
];

const loginValidation = [
  body("email").isEmail().withMessage("Valid email required"),
  body("password").notEmpty().withMessage("Password is required"),
];

const forgotValidation = [
  body("email").isEmail().withMessage("Valid email required"),
];

const resetValidation = [
  body("token").notEmpty().withMessage("Reset token is required"),
  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const resendValidation = [
  body("email").isEmail().withMessage("Valid email required"),
];

const profileUpdateValidation = [
  body(["email", "profile.email"])
    .optional()
    .isEmail()
    .withMessage("Valid email required"),
  body(["gender", "profile.gender"])
    .optional()
    .isIn(["male", "female", "other"])
    .withMessage("Gender must be male, female, or other"),
  body(["address", "profile.address"])
    .optional()
    .isObject()
    .withMessage("Address must be an object"),
  body(["experience_years", "profile.experience_years"])
    .optional()
    .isInt({ min: 0 })
    .withMessage("Experience years must be a positive number"),
  body(["fee", "profile.fee"])
    .optional()
    .isFloat({ min: 0 })
    .withMessage("Fee must be a positive number"),
  body(["availability_types", "profile.availability_types"])
    .optional()
    .isArray()
    .withMessage("Availability types must be an array"),
  body(["availability_types.*", "profile.availability_types.*"])
    .optional()
    .isIn(["Online Consultation", "In-Person"])
    .withMessage("Availability type must be Online Consultation or In-Person"),
];

router.post("/signup", signupValidation, validate, signup);
router.post("/login", loginValidation, validate, login);
router.post("/refresh", refresh);
router.post("/logout", auth, logout);
router.get("/me", auth, me);
router.patch("/profile", auth, profileUpdateValidation, validate, updateProfile);
router.get("/verify-email", verifyEmail);
router.post(
  "/resend-verification",
  resendValidation,
  validate,
  resendVerification,
);
router.post("/forgot-password", forgotValidation, validate, forgotPassword);
router.post("/reset-password", resetValidation, validate, resetPassword);
router.get("/google", googleAuthRedirect);
router.get("/google/callback", googleAuthCallback);

module.exports = router;
