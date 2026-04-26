const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password_hash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["patient", "doctor", "admin"],
      required: true,
    },
    ref_id: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "ref_type",
    },
    ref_type: {
      type: String,
      enum: ["Patient", "Doctor"],
      required: true,
    },
    last_login: {
      type: Date,
      default: null,
    },
    refresh_token: { type: String, default: null },
    reset_token: { type: String, default: null },
    reset_token_expiry: { type: Date, default: null },
    is_verified: { type: Boolean, default: false },
    verification_token: { type: String, default: null },
    verification_token_expiry: { type: Date, default: null },
  },
  {
    timestamps: {
      createdAt: "created_at",
      updatedAt: "updated_at",
    },
  },
);

module.exports = mongoose.model("User", userSchema);
