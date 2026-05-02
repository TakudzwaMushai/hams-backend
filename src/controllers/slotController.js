const AvailabilitySlot = require("../models/AvailabilitySlot");
const User = require("../models/User");

// POST /api/slots — doctor creates slots
exports.createSlot = async (req, res) => {
  try {
    const { slot_date, start_time, end_time } = req.body;

    // Get doctor profile from logged in user
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create slots" });
    }

    // Check for overlapping slots
    const existing = await AvailabilitySlot.findOne({
      doctor_id: user.ref_id,
      slot_date: new Date(slot_date),
      is_blocked: false,
      $or: [{ start_time: { $lt: end_time }, end_time: { $gt: start_time } }],
    });

    if (existing) {
      return res
        .status(409)
        .json({ message: "Slot overlaps with an existing slot" });
    }

    const slot = await AvailabilitySlot.create({
      doctor_id: user.ref_id,
      slot_date: new Date(slot_date),
      start_time,
      end_time,
    });

    res.status(201).json({ message: "Slot created successfully", slot });
  } catch (err) {
    console.error("Create slot error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/slots/:doctorId — get available slots for a doctor
exports.getSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query; // optional filter by date

    const filter = {
      doctor_id: doctorId,
      is_booked: false,
      is_blocked: false,
      slot_date: { $gte: new Date() }, // only future slots
    };

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.slot_date = { $gte: start, $lt: end };
    }

    const slots = await AvailabilitySlot.find(filter).sort({
      slot_date: 1,
      start_time: 1,
    });

    res.status(200).json({ slots });
  } catch (err) {
    console.error("Get slots error:", err);
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/slots/:id — doctor blocks/removes a slot
exports.deleteSlot = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const slot = await AvailabilitySlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (slot.doctor_id.toString() !== user.ref_id.toString()) {
      return res
        .status(403)
        .json({ message: "You can only delete your own slots" });
    }

    if (slot.is_booked) {
      return res
        .status(400)
        .json({
          message: "Cannot delete a booked slot. Cancel the appointment first.",
        });
    }

    await slot.deleteOne();

    res.status(200).json({ message: "Slot deleted successfully" });
  } catch (err) {
    console.error("Delete slot error:", err);
    res.status(500).json({ message: err.message });
  }
};
