const AvailabilitySlot = require("../models/AvailabilitySlot");
const User = require("../models/User");

// POST /api/slots — doctor creates slots
exports.createSlot = async (req, res) => {
  try {
    const {
      slot_date,
      start_time,
      end_time,
      consultation_type,
      location,
      fee,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create slots" });
    }

    const slot = await AvailabilitySlot.create({
      doctor_id: user.ref_id,
      slot_date: new Date(slot_date),
      start_time,
      end_time,
      consultation_type,
      location: consultation_type === "offline" ? location : null,
      fee,
    });

    res.status(201).json({ message: "Slot created successfully", slot });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const mongoose = require("mongoose");

exports.getSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, type } = req.query;

    const filter = {
      doctor_id: doctorId,
      // is_booked: false,
      // is_blocked: false,
    };

    if (type) {
      filter.consultation_type = type;
    }

    if (date) {
      const start = new Date(date);
      start.setUTCHours(0, 0, 0, 0);

      const end = new Date(date);
      end.setUTCHours(23, 59, 59, 999);

      filter.slot_date = {
        $gte: start,
        $lte: end,
      };
    } else {
      filter.slot_date = {
        $gte: new Date(),
      };
    }

    const slots = await AvailabilitySlot.find(filter).sort({
      slot_date: 1,
      start_time: 1,
    });

    res.status(200).json({ slots });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
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
      return res.status(400).json({
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
