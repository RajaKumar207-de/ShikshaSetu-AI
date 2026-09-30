import mongoose from "mongoose";

const scholarshipSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    provider: {
      type: String,
      required: true,
      trim: true,
    },

    description: {
      type: String,
      default: "",
    },

    amount: {
      type: String,
      default: "Varies",
    },

    state: {
      type: String,
      default: "All India",
    },

    category: {
      type: [String],
      default: [],
    },

    educationLevel: {
      type: [String],
      default: [],
    },

    incomeLimit: {
      type: String,
      default: "Not specified",
    },

    deadline: {
      type: String,
      default: "Check official website",
    },

    documents: {
      type: [String],
      default: [],
    },

    officialLink: {
      type: String,
      default: "",
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

const Scholarship = mongoose.model(
  "Scholarship",
  scholarshipSchema
);

export default Scholarship;