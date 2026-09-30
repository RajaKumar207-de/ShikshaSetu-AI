import Scholarship from "../models/scholarship.model.js";
import TrackedScholarship from "../models/trackedScholarship.model.js";
import { notify } from "./notification.service.js";
import logger from "../utils/logger.js";

// Reminder windows in days before the deadline. A notification is sent
// once per window (dedupeKey), using the *actual* days left in the text.
const WINDOWS = [14, 7, 2, 1];

const daysLeftFor = (date) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

const messageFor = (name, daysLeft) => {
  if (daysLeft <= 1) {
    return {
      title: "Last day tomorrow",
      message: `⏰ ${name}: deadline is tomorrow. Don't forget to apply.`,
    };
  }
  if (daysLeft <= 2) {
    return {
      title: "Deadline in 2 days",
      message: `⚠️ ${name} deadline is in ${daysLeft} days.`,
    };
  }
  return {
    title: `Deadline in ${daysLeft} days`,
    message: `${name} application deadline is in ${daysLeft} days.`,
  };
};

const processTracked = async (tracked) => {
  let sent = 0;

  for (const item of tracked) {
    const s = item.scholarship;
    if (!s?.deadlineDate) continue;

    const daysLeft = daysLeftFor(s.deadlineDate);
    if (daysLeft < 1 || daysLeft > WINDOWS[0]) continue;

    // Smallest window that still covers the remaining time.
    const window = [...WINDOWS]
      .reverse()
      .find((w) => daysLeft <= w);
    if (!window) continue;

    const { title, message } = messageFor(s.name, daysLeft);
    const created = await notify(item.user, {
      type: "scholarship_deadline",
      title,
      message,
      relatedEntity: "Scholarship",
      relatedEntityId: s._id,
      link: "/scholarships",
      dedupeKey: `sch:${s._id}:${window}`,
      metadata: { daysLeft },
    });
    if (created) sent += 1;
  }

  return sent;
};

export const checkRemindersForUser = async (userId) => {
  const tracked = await TrackedScholarship.find({ user: userId })
    .populate("scholarship")
    .lean();
  return processTracked(tracked);
};

// HOW REMINDERS SCALE
// - The sweep never scans users. It first finds scholarships whose deadline
//   falls in the next 15 days (indexed on deadlineDate), then only the
//   tracking rows for those scholarships (indexed on scholarship), in
//   batches of 500.
// - It runs hourly. Every notification has a unique dedupeKey per
//   (user, scholarship, window), so running twice - or on several server
//   instances at once - can never send a duplicate.
// - Failures are logged and retried by the next hourly run.
const BATCH = 500;

export const runReminderSweep = async () => {
  try {
    const upcoming = await Scholarship.find({
      deadlineDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + (WINDOWS[0] + 1) * 86400000),
      },
    }).lean();

    if (!upcoming.length) return 0;

    const byId = new Map(upcoming.map((s) => [String(s._id), s]));
    const ids = upcoming.map((s) => s._id);

    let sent = 0;
    let lastId = null;

    for (;;) {
      const filter = { scholarship: { $in: ids } };
      if (lastId) filter._id = { $gt: lastId };

      const batch = await TrackedScholarship.find(filter)
        .sort({ _id: 1 })
        .limit(BATCH)
        .lean();
      if (!batch.length) break;

      sent += await processTracked(
        batch.map((t) => ({
          ...t,
          scholarship: byId.get(String(t.scholarship)),
        }))
      );

      lastId = batch[batch.length - 1]._id;
      if (batch.length < BATCH) break;
    }

    if (sent) logger.info("Reminder sweep", { sent });
    return sent;
  } catch (error) {
    logger.error("Reminder sweep failed", { error: error.message });
    return 0;
  }
};

export const startReminderScheduler = () => {
  runReminderSweep();
  setInterval(runReminderSweep, 60 * 60 * 1000).unref();
};
