import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    // =========================
    // BASIC USER INFORMATION
    // =========================

    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    // =========================
    // USER ROLE
    // =========================

    role: {
      type: String,
      enum: ["student", "mentor", "admin"],
      default: "student",
    },

    // =========================
    // LANGUAGE
    // =========================

    language: {
      type: String,
      default: "Hindi",
    },

    // =========================
    // MENTOR INFORMATION
    // =========================

    subject: {
      type: String,
      default: "",
    },

    experience: {
      type: String,
      default: "",
    },

    availability: {
      type: String,
      enum: ["Available", "Offline"],
      default: "Available",
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", userSchema);

export default User;