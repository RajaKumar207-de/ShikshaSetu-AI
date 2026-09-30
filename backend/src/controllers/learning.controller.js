import LearningEvent from "../models/learningEvent.model.js";
import logger, { errorMeta } from "../utils/logger.js";
import {
  CATALOGUE,
  buildPath,
  computeMastery,
  computeStreak,
  loadEvents,
  weeklyMission,
} from "../services/learning.service.js";

const EVENT_TYPES = [
  "lesson_complete",
  "quiz",
  "diagnostic",
  "practice",
  "ai_doubt",
];

const sanitizeEvent = (raw) => {
  if (!raw || typeof raw !== "object") return null;
  if (!EVENT_TYPES.includes(raw.type)) return null;

  const clientId = String(raw.clientId || "").slice(0, 80);
  if (!clientId) return null;

  const subject = String(raw.subject || "").slice(0, 60);
  const topic = String(raw.topic || "").slice(0, 80);

  if (
    raw.type !== "ai_doubt" &&
    (!CATALOGUE[subject] ||
      (topic && !CATALOGUE[subject].includes(topic)))
  ) {
    return null;
  }

  const total = Math.max(0, Math.min(Number(raw.total) || 0, 100));
  const score = Math.max(0, Math.min(Number(raw.score) || 0, total));

  let occurredAt = new Date(raw.occurredAt);
  const now = Date.now();
  if (
    Number.isNaN(occurredAt.getTime()) ||
    occurredAt.getTime() > now + 5 * 60_000
  ) {
    occurredAt = new Date(now);
  }

  return {
    clientId,
    type: raw.type,
    subject,
    topic,
    score,
    total,
    occurredAt,
  };
};

// Accepts a batch so an offline queue can be flushed in one request.
// Idempotent: replays of the same clientId are ignored.
export const recordEvents = async (req, res) => {
  try {
    const incoming = Array.isArray(req.body.events)
      ? req.body.events.slice(0, 50)
      : [];

    const events = incoming.map(sanitizeEvent).filter(Boolean);

    if (!events.length) {
      return res.status(400).json({
        success: false,
        message: "No valid events to record",
      });
    }

    const result = await LearningEvent.bulkWrite(
      events.map((event) => ({
        updateOne: {
          filter: { user: req.user._id, clientId: event.clientId },
          update: { $setOnInsert: { ...event, user: req.user._id } },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    return res.status(200).json({
      success: true,
      received: events.length,
      inserted: result.upsertedCount,
      syncedIds: events.map((e) => e.clientId),
    });
  } catch (error) {
    logger.error("Record events error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not save learning activity",
    });
  }
};

export const getSummary = async (req, res) => {
  try {
    const subject = CATALOGUE[req.query.subject]
      ? req.query.subject
      : "Mathematics";

    const events = await loadEvents(req.user._id);
    const mastery = computeMastery(events);
    const { streak, week } = computeStreak(events);

    const subjects = Object.entries(mastery).map(
      ([name, topics]) => {
        const assessed = topics.filter((t) => t.score !== null);
        const average = assessed.length
          ? Math.round(
              assessed.reduce((sum, t) => sum + t.score, 0) /
                assessed.length
            )
          : null;
        return {
          name,
          average,
          lessonsCompleted: topics.filter((t) => t.lessonCompleted)
            .length,
          totalTopics: topics.length,
        };
      }
    );

    return res.json({
      success: true,
      subject,
      mastery,
      subjects,
      streak,
      week,
      path: buildPath(mastery, subject),
      mission: weeklyMission(events, mastery, subject),
      totals: {
        lessons: new Set(
          events
            .filter((e) => e.type === "lesson_complete")
            .map((e) => `${e.subject}__${e.topic}`)
        ).size,
        quizzes: events.filter((e) =>
          ["quiz", "diagnostic", "practice"].includes(e.type)
        ).length,
        doubts: events.filter((e) => e.type === "ai_doubt").length,
      },
    });
  } catch (error) {
    logger.error("Learning summary error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not load your learning summary",
    });
  }
};
