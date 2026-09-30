import mongoose from "mongoose";

const mentorRequestSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    mentor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    message: {
      type: String,
      default: "I want to connect with you as my mentor.",
    },

    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Lists are always filtered by one side and sorted newest first.
mentorRequestSchema.index({ mentor: 1, createdAt: -1 });
mentorRequestSchema.index({ student: 1, createdAt: -1 });
// A student can have only one pending request per mentor (race-safe).
mentorRequestSchema.index(
  { student: 1, mentor: 1 },
  { unique: true, partialFilterExpression: { status: "pending" } }
);

const MentorRequest = mongoose.model(
  "MentorRequest",
  mentorRequestSchema
);

export default MentorRequest;