const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  bookAppointment,
  getMyAppointments,
  cancelAppointment,
  rescheduleAppointment,
  completeAppointment,
} = require("../controllers/appointmentController");

const bookValidation = [
  body("slot_id").notEmpty().withMessage("Slot ID is required"),
];

const completeValidation = [
  body("diagnosis").notEmpty().withMessage("Diagnosis is required"),
];

router.post(
  "/",
  auth,
  role("patient"),
  bookValidation,
  validate,
  bookAppointment,
);
router.get("/me", auth, getMyAppointments);
router.patch("/:id/cancel", auth, cancelAppointment);
router.patch("/:id/reschedule", auth, role("patient"), rescheduleAppointment);
router.patch(
  "/:id/complete",
  auth,
  role("doctor"),
  completeValidation,
  validate,
  completeAppointment,
);

module.exports = router;
