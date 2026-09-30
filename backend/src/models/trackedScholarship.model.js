import mongoose from "mongoose";

const trackedScholarshipSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    scholarship: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Scholarship",
      required: true,
    },
  },
  { timestamps: true }
);

trackedScholarshipSchema.index(
  { user: 1, scholarship: 1 },
  { unique: true }
);

// Reminder sweep finds tracking rows by scholarship.
trackedScholarshipSchema.index({ scholarship: 1 });

export default mongoose.model(
  "TrackedScholarship",
  trackedScholarshipSchema
);
