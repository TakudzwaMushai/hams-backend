const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  createSlot,
  getSlots,
  deleteSlot,
} = require("../controllers/slotController");

const slotValidation = [
  body().custom((value) => {
    if (
      value.slot_date ||
      (Array.isArray(value.slot_dates) && value.slot_dates.length > 0)
    ) {
      return true;
    }

    throw new Error("Slot date or slot dates are required");
  }),
  body("start_time").notEmpty().withMessage("Start time is required"),
  body("end_time").notEmpty().withMessage("End time is required"),
  body("repeat.frequency")
    .optional()
    .isIn(["none", "daily", "weekly", "monthly"])
    .withMessage("Repeat frequency must be none, daily, weekly, or monthly"),
  body("repeat.count")
    .optional()
    .isInt({ min: 1, max: 60 })
    .withMessage("Repeat count must be between 1 and 60"),
];

router.post("/", auth, role("doctor"), slotValidation, validate, createSlot);
router.get("/:doctorId", auth, getSlots);
router.delete("/:id", auth, role("doctor"), deleteSlot);

module.exports = router;
