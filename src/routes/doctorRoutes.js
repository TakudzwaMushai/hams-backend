const express = require("express");
const router = express.Router();
const { body } = require("express-validator");
const validate = require("../middleware/validate");
const auth = require("../middleware/authMiddleware");
const role = require("../middleware/roleMiddleware");
const {
  getDoctors,
  getSpecialisations,
  getDoctorById,
  getDoctorSlots,
  updateDoctorProfile,
} = require("../controllers/doctorController");

router.get("/", auth, getDoctors);
router.get("/specialisations", auth, getSpecialisations);
router.get("/:id", auth, getDoctorById);
router.get("/:id/slots", auth, getDoctorSlots);
router.patch("/profile", auth, role("doctor"), updateDoctorProfile);

module.exports = router;
