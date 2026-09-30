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

    // Real date used for reminders. Null when the deadline is unknown.
    deadlineDate: {
      type: Date,
      default: null,
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

// Queries filter active scholarships by state / category / level.
// (category and educationLevel are arrays, so they get separate indexes:
// MongoDB cannot build one compound index over two array fields.)
scholarshipSchema.index({ isActive: 1, state: 1, createdAt: -1 });
scholarshipSchema.index({ isActive: 1, category: 1 });
scholarshipSchema.index({ isActive: 1, educationLevel: 1 });
// Reminder sweep looks up upcoming deadlines.
scholarshipSchema.index({ deadlineDate: 1 });

const Scholarship = mongoose.model(
  "Scholarship",
  scholarshipSchema
);

export default Scholarship;