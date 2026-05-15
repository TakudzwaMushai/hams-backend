const Doctor = require("../models/Doctor");
const Review = require("../models/Review");
const User = require("../models/User");
const {
  getPagination,
  getPaginationMeta,
} = require("../utils/pagination");

// GET /api/doctors — list all doctors with optional filters
exports.getDoctors = async (req, res) => {
  try {
    const { specialisation, search, page = 1, limit = 20 } = req.query;

    const filter = { is_active: true };

    if (specialisation && specialisation !== "All") {
      filter.specialisation = { $regex: specialisation, $options: "i" };
    }

    if (search) {
      filter.$or = [
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
        { specialisation: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const total = await Doctor.countDocuments(filter);
    const doctors = await Doctor.find(filter)
      .select("-__v")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ average_rating: -1 });

    res.status(200).json({
      doctors,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Get doctors error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/specialisations — get all unique specialisations for filter chips
exports.getSpecialisations = async (req, res) => {
  try {
    const specialisations = await Doctor.distinct("specialisation", {
      is_active: true,
    });
    res
      .status(200)
      .json({ specialisations: ["All", ...specialisations.sort()] });
  } catch (err) {
    console.error("Get specialisations error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/:id — get single doctor with reviews
exports.getDoctorById = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select("-__v");
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    const reviews = await Review.find({ doctor_id: doctor._id })
      .populate("patient_id", "first_name last_name")
      .sort({ created_at: -1 })
      .limit(10);

    res.status(200).json({ doctor, reviews });
  } catch (err) {
    console.error("Get doctor error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/doctors/:id/slots — get available slots for a doctor
exports.getDoctorSlots = async (req, res) => {
  try {
    const AvailabilitySlot = require("../models/AvailabilitySlot");
    const { date, type } = req.query;
    const { page, limit, skip } = getPagination(req.query);

    const filter = {
      doctor_id: req.params.id,
      is_booked: false,
      is_blocked: false,
      slot_date: { $gte: new Date() },
    };

    if (type) {
      filter.consultation_type = type;
    }

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.slot_date = { $gte: start, $lt: end };
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
    console.error("Get doctor slots error:", err);
    res.status(500).json({ message: err.message });
  }
};

// PATCH /api/doctors/profile — doctor updates their own profile
exports.updateDoctorProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user || user.role !== "doctor") {
      return res
        .status(403)
        .json({ message: "Only doctors can update doctor profiles" });
    }

    const allowed = [
      "phone",
      "experience_years",
      "fee",
      "education",
      "certificate",
      "bio",
      "avatar",
      "availability_types",
      "clinic_name",
    ];

    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const doctor = await Doctor.findByIdAndUpdate(
      user.ref_id,
      { $set: updates },
      { new: true, runValidators: true },
    ).select("-__v");

    res.status(200).json({ message: "Profile updated successfully", doctor });
  } catch (err) {
    console.error("Update doctor profile error:", err);
    res.status(500).json({ message: err.message });
  }
};
