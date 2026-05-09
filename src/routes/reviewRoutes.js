const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createReview,
  getDoctorReviews,
} = require("../controllers/reviewController");

const reviewValidation = [
  body("appointment_id").notEmpty().withMessage("Appointment ID is required"),
  body("rating")
    .isInt({ min: 1, max: 5 })
    .withMessage("Rating must be between 1 and 5"),
];

router.post(
  "/",
  auth,
  role("patient"),
  reviewValidation,
  validate,
  createReview,
);
router.get("/doctor/:doctorId", auth, getDoctorReviews);

module.exports = router;
