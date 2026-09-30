import mongoose from "mongoose";

// One row per learning action. Progress, streaks, mastery and the
// personalized path are all derived from these events, so there is a
// single source of truth. `clientId` makes offline sync idempotent.
const learningEventSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    clientId: {
      type: String,
      required: true,
      maxlength: 80,
    },
    type: {
      type: String,
      enum: [
        "lesson_complete",
        "quiz",
        "diagnostic",
        "practice",
        "ai_doubt",
      ],
      required: true,
    },
    subject: { type: String, default: "", maxlength: 60 },
    topic: { type: String, default: "", maxlength: 80 },
    score: { type: Number, default: 0, min: 0 },
    total: { type: Number, default: 0, min: 0 },
    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

learningEventSchema.index(
  { user: 1, clientId: 1 },
  { unique: true }
);
learningEventSchema.index({ user: 1, occurredAt: -1 });
learningEventSchema.index({ user: 1, subject: 1, topic: 1 });

export default mongoose.model(
  "LearningEvent",
  learningEventSchema
);
