import mongoose from "mongoose";
import LearningEvent from "../models/learningEvent.model.js";
import MentorRequest from "../models/mentorRequest.model.js";
import {
  computeMastery,
  computeStreak,
  loadEvents,
} from "./learning.service.js";

// Read-only progress helpers shared by the admin and mentor panels.
// They only aggregate existing LearningEvent / MentorRequest data.

const SCORED_TYPES = ["quiz", "diagnostic", "practice"];
const DAY_MS = 86_400_000;

export const INACTIVE_AFTER_DAYS = 7;

const toObjectIds = (ids) =>
  ids.map((id) => new mongoose.Types.ObjectId(String(id)));

const daysSince = (date) =>
  date ? Math.floor((Date.now() - new Date(date).getTime()) / DAY_MS) : null;

// Full progress report for one student (same maths as /learning/summary).
export const studentProgress = async (userId) => {
  const events = await loadEvents(userId);
  const mastery = computeMastery(events);
  const { streak, week } = computeStreak(events);

  const subjects = Object.entries(mastery).map(([name, topics]) => {
    const assessed = topics.filter((t) => t.score !== null);
    return {
      name,
      average: assessed.length
        ? Math.round(
            assessed.reduce((sum, t) => sum + t.score, 0) / assessed.length
          )
        : null,
      lessonsCompleted: topics.filter((t) => t.lessonCompleted).length,
      totalTopics: topics.length,
    };
  });

  const weakTopics = Object.entries(mastery)
    .flatMap(([subject, topics]) =>
      topics
        .filter((t) => t.status === "needs_practice")
        .map((t) => ({ subject, topic: t.topic, score: t.score }))
    )
    .sort((a, b) => a.score - b.score);

  const assessedSubjects = subjects.filter((s) => s.average !== null);
  const lastActive = events[0]?.occurredAt || null;

  const recentScores = events
    .filter((e) => SCORED_TYPES.includes(e.type) && e.total > 0)
    .slice(0, 10)
    .map((e) => ({
      type: e.type,
      subject: e.subject,
      topic: e.topic,
      percent: Math.round((e.score / e.total) * 100),
      occurredAt: e.occurredAt,
    }));

  return {
    mastery,
    subjects,
    weakTopics,
    streak,
    week,
    recentScores,
    lastActive,
    inactiveDays: daysSince(lastActive),
    overallAverage: assessedSubjects.length
      ? Math.round(
          assessedSubjects.reduce((sum, s) => sum + s.average, 0) /
            assessedSubjects.length
        )
      : null,
    totals: {
      lessons: new Set(
        events
          .filter((e) => e.type === "lesson_complete")
          .map((e) => `${e.subject}__${e.topic}`)
      ).size,
      quizzes: events.filter((e) => SCORED_TYPES.includes(e.type)).length,
      doubts: events.filter((e) => e.type === "ai_doubt").length,
    },
  };
};

// Compact stats for many students at once (one aggregation, no N+1).
// Returns Map<userId, { lastActive, events, quizzes, lessons, doubts, averageScore }>.
export const bulkStudentStats = async (userIds) => {
  if (!userIds.length) return new Map();

  const rows = await LearningEvent.aggregate([
    { $match: { user: { $in: toObjectIds(userIds) } } },
    {
      $group: {
        _id: "$user",
        lastActive: { $max: "$occurredAt" },
        events: { $sum: 1 },
        quizzes: {
          $sum: { $cond: [{ $in: ["$type", SCORED_TYPES] }, 1, 0] },
        },
        lessons: {
          $sum: { $cond: [{ $eq: ["$type", "lesson_complete"] }, 1, 0] },
        },
        doubts: {
          $sum: { $cond: [{ $eq: ["$type", "ai_doubt"] }, 1, 0] },
        },
        scoreSum: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $in: ["$type", SCORED_TYPES] },
                  { $gt: ["$total", 0] },
                ],
              },
              { $multiply: [{ $divide: ["$score", "$total"] }, 100] },
              0,
            ],
          },
        },
      },
    },
  ]);

  return new Map(
    rows.map((r) => [
      String(r._id),
      {
        lastActive: r.lastActive,
        inactiveDays: daysSince(r.lastActive),
        events: r.events,
        quizzes: r.quizzes,
        lessons: r.lessons,
        doubts: r.doubts,
        averageScore: r.quizzes ? Math.round(r.scoreSum / r.quizzes) : null,
      },
    ])
  );
};

export const emptyStats = {
  lastActive: null,
  inactiveDays: null,
  events: 0,
  quizzes: 0,
  lessons: 0,
  doubts: 0,
  averageScore: null,
};

// Request stats per mentor. Response time uses updatedAt of answered
// requests (status only changes once, from pending).
// Returns Map<mentorId, stats>.
export const bulkMentorStats = async (mentorIds) => {
  if (!mentorIds.length) return new Map();

  const rows = await MentorRequest.aggregate([
    { $match: { mentor: { $in: toObjectIds(mentorIds) } } },
    {
      $group: {
        _id: "$mentor",
        total: { $sum: 1 },
        accepted: { $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] } },
        rejected: { $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] } },
        pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
        responseMsSum: {
          $sum: {
            $cond: [
              { $ne: ["$status", "pending"] },
              { $subtract: ["$updatedAt", "$createdAt"] },
              0,
            ],
          },
        },
        oldestPending: {
          $min: {
            $cond: [{ $eq: ["$status", "pending"] }, "$createdAt", null],
          },
        },
        acceptedStudents: {
          $addToSet: {
            $cond: [{ $eq: ["$status", "accepted"] }, "$student", "$$REMOVE"],
          },
        },
      },
    },
  ]);

  // Average score of each mentor's accepted students.
  const allStudents = [
    ...new Set(rows.flatMap((r) => r.acceptedStudents.map(String))),
  ];
  const studentStats = await bulkStudentStats(allStudents);

  return new Map(
    rows.map((r) => {
      const answered = r.accepted + r.rejected;
      const scores = r.acceptedStudents
        .map((id) => studentStats.get(String(id))?.averageScore)
        .filter((s) => s !== null && s !== undefined);
      const activeStudents = r.acceptedStudents.filter((id) => {
        const days = studentStats.get(String(id))?.inactiveDays;
        return days !== null && days !== undefined && days < INACTIVE_AFTER_DAYS;
      }).length;

      return [
        String(r._id),
        {
          total: r.total,
          accepted: r.accepted,
          rejected: r.rejected,
          pending: r.pending,
          acceptanceRate: answered
            ? Math.round((r.accepted / answered) * 100)
            : null,
          avgResponseHours: answered
            ? Math.round((r.responseMsSum / answered / 3_600_000) * 10) / 10
            : null,
          oldestPendingDays: daysSince(r.oldestPending),
          students: r.acceptedStudents.length,
          activeStudents,
          studentsAverageScore: scores.length
            ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
            : null,
        },
      ];
    })
  );
};

export const emptyMentorStats = {
  total: 0,
  accepted: 0,
  rejected: 0,
  pending: 0,
  acceptanceRate: null,
  avgResponseHours: null,
  oldestPendingDays: null,
  students: 0,
  activeStudents: 0,
  studentsAverageScore: null,
};
