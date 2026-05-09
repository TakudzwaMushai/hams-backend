const Review      = require('../models/Review');
const Doctor      = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const User        = require('../models/User');

// POST /api/reviews — patient submits a review after completed appointment
exports.createReview = async (req, res) => {
  try {
    const { appointment_id, rating, comment } = req.body;
    const user = await User.findById(req.user.id);

    if (user.role !== 'patient') {
      return res.status(403).json({ message: 'Only patients can submit reviews' });
    }

    const appointment = await Appointment.findById(appointment_id);
    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }
    if (appointment.patient_id.toString() !== user.ref_id.toString()) {
      return res.status(403).json({ message: 'You can only review your own appointments' });
    }
    if (appointment.status !== 'completed') {
      return res.status(400).json({ message: 'You can only review completed appointments' });
    }

    // Check if already reviewed
    const existing = await Review.findOne({ appointment_id });
    if (existing) {
      return res.status(409).json({ message: 'You have already reviewed this appointment' });
    }

    const review = await Review.create({
      doctor_id:      appointment.doctor_id,
      patient_id:     user.ref_id,
      appointment_id: appointment._id,
      rating,
      comment
    });

    // Recalculate doctor average rating
    const allReviews = await Review.find({ doctor_id: appointment.doctor_id });
    const avg        = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;

    await Doctor.findByIdAndUpdate(appointment.doctor_id, {
      average_rating: Math.round(avg * 10) / 10,
      total_reviews:  allReviews.length
    });

    res.status(201).json({ message: 'Review submitted successfully', review });

  } catch (err) {
    console.error('Create review error:', err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/reviews/doctor/:doctorId — get all reviews for a doctor
exports.getDoctorReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const total   = await Review.countDocuments({ doctor_id: req.params.doctorId });
    const reviews = await Review.find({ doctor_id: req.params.doctorId })
      .populate('patient_id', 'first_name last_name')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.status(200).json({
      reviews,
      pagination: {
        total,
        page:        parseInt(page),
        limit:       parseInt(limit),
        total_pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (err) {
    console.error('Get reviews error:', err);
    res.status(500).json({ message: err.message });
  }
};