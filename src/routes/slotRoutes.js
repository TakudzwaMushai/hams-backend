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
  body("slot_date").notEmpty().withMessage("Slot date is required"),
  body("start_time").notEmpty().withMessage("Start time is required"),
  body("end_time").notEmpty().withMessage("End time is required"),
];

router.post("/", auth, role("doctor"), slotValidation, validate, createSlot);
router.get("/:doctorId", auth, getSlots);
router.delete("/:id", auth, role("doctor"), deleteSlot);

module.exports = router;
