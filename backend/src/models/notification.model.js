import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "scholarship_deadline",
        "mentor_request",
        "mentor_request_accepted",
        "mentor_request_rejected",
        "learning_reminder",
        "quiz_reminder",
        "roadmap_update",
        "system",
      ],
      default: "system",
    },
    title: { type: String, required: true, maxlength: 140 },
    message: { type: String, default: "", maxlength: 400 },
    relatedEntity: { type: String, default: "" },
    relatedEntityId: { type: String, default: "" },
    link: { type: String, default: "" },
    read: { type: Boolean, default: false },
    scheduledFor: { type: Date, default: Date.now },
    deliveredAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Used to make scheduled notifications idempotent.
    dedupeKey: { type: String, default: undefined },
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ user: 1, createdAt: -1 });
// Old notifications clean themselves up after 90 days (no cleanup job).
notificationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 90 * 24 * 60 * 60 }
);
notificationSchema.index(
  { user: 1, dedupeKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      dedupeKey: { $type: "string" },
    },
  }
);

export default mongoose.model(
  "Notification",
  notificationSchema
);
