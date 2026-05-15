const AvailabilitySlot = require("../models/AvailabilitySlot");
const User = require("../models/User");
const {
  getPagination,
  getPaginationMeta,
} = require("../utils/pagination");

const MAX_SLOTS_PER_REQUEST = 60;
const REPEAT_FREQUENCIES = ["none", "daily", "weekly", "monthly"];

const getRepeatDate = (startDate, frequency, index) => {
  const nextDate = new Date(startDate);

  if (frequency === "daily") {
    nextDate.setDate(nextDate.getDate() + index);
    return nextDate;
  }

  if (frequency === "weekly") {
    nextDate.setDate(nextDate.getDate() + index * 7);
    return nextDate;
  }

  if (frequency === "monthly") {
    const targetDay = nextDate.getDate();
    nextDate.setMonth(nextDate.getMonth() + index);

    if (nextDate.getDate() !== targetDay) {
      nextDate.setDate(0);
    }
  }

  return nextDate;
};

const buildSlotDates = ({ slot_date, slot_dates, repeat }) => {
  if (Array.isArray(slot_dates) && slot_dates.length > 0) {
    return slot_dates.map((date) => new Date(date));
  }

  const startDate = new Date(slot_date);
  const repeatConfig = {
    frequency: repeat?.frequency || "none",
    count: Number(repeat?.count || 1),
  };

  if (
    !REPEAT_FREQUENCIES.includes(repeatConfig.frequency) ||
    repeatConfig.count < 1 ||
    repeatConfig.count > MAX_SLOTS_PER_REQUEST
  ) {
    const error = new Error(
      `Repeat must use frequency ${REPEAT_FREQUENCIES.join(", ")} and count between 1 and ${MAX_SLOTS_PER_REQUEST}`,
    );
    error.statusCode = 400;
    throw error;
  }

  return Array.from({ length: repeatConfig.count }, (_, index) =>
    getRepeatDate(startDate, repeatConfig.frequency, index),
  );
};

// POST /api/slots — doctor creates slots
exports.createSlot = async (req, res) => {
  try {
    const {
      slot_date,
      slot_dates,
      start_time,
      end_time,
      consultation_type,
      location,
      fee,
      repeat,
    } = req.body;

    const user = await User.findById(req.user.id);

    if (!user || user.role !== "doctor") {
      return res.status(403).json({ message: "Only doctors can create slots" });
    }

    const dates = buildSlotDates({ slot_date, slot_dates, repeat });

    if (dates.some((date) => Number.isNaN(date.getTime()))) {
      return res
        .status(400)
        .json({ message: "One or more slot dates are invalid" });
    }

    if (dates.length > MAX_SLOTS_PER_REQUEST) {
      return res.status(400).json({
        message: `You can create up to ${MAX_SLOTS_PER_REQUEST} slots at once`,
      });
    }

    const createdSlots = [];
    const skippedSlots = [];

    for (const date of dates) {
      const existingSlot = await AvailabilitySlot.findOne({
        doctor_id: user.ref_id,
        slot_date: date,
        start_time,
        end_time,
      });

      if (existingSlot) {
        skippedSlots.push({
          slot_date: date,
          start_time,
          end_time,
          reason: "Slot already exists",
        });
        continue;
      }

      const slot = await AvailabilitySlot.create({
        doctor_id: user.ref_id,
        slot_date: date,
        start_time,
        end_time,
        consultation_type,
        location: consultation_type === "offline" ? location : null,
        fee,
      });

      createdSlots.push(slot);
    }

    res.status(201).json({
      message:
        createdSlots.length > 1
          ? "Slots created successfully"
          : "Slot created successfully",
      slots: createdSlots,
      skipped_slots: skippedSlots,
      created_count: createdSlots.length,
      skipped_count: skippedSlots.length,
    });
  } catch (err) {
    res.status(err.statusCode || 500).json({ message: err.message });
  }
};

exports.getSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { date, type } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {
      doctor_id: doctorId,
      is_booked: false,
      is_blocked: false,
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
      // Changed from new Date() to start of today to include today's slots
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      filter.slot_date = {
        $gte: today,
      };
    }

    const totalItems = await AvailabilitySlot.countDocuments(filter);
    const slots = await AvailabilitySlot.find(filter)
      .sort({
        slot_date: 1,
        start_time: 1,
      })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      slots,
      pagination: getPaginationMeta({ totalItems, page, limit }),
    });
  } catch (err) {
    res.status(500).json({
      message: err.message,
    });
  }
};

// DELETE /api/slots/:id — doctor blocks/removes a slot
exports.deleteSlot = async (req, res) => {
  try {
    const slot = await AvailabilitySlot.findById(req.params.id);

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    const user = await User.findById(req.user.id);

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
