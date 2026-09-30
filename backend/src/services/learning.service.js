import LearningEvent from "../models/learningEvent.model.js";

// Topic catalogue mirrors the frontend Learning page.
export const CATALOGUE = {
  Mathematics: [
    "Number System",
    "Algebra",
    "Geometry",
    "Percentage",
    "Ratio and Proportion",
  ],
  Science: [
    "Physics",
    "Chemistry",
    "Biology",
    "Environment",
    "Human Body",
  ],
  Computer: [
    "Computer Basics",
    "Programming Basics",
    "Web Development",
    "Database",
    "Cyber Security",
  ],
  English: [
    "Grammar",
    "Vocabulary",
    "Speaking",
    "Reading",
    "Communication",
  ],
};

export const MASTERY_BANDS = {
  strong: 70,
  improving: 50,
};

const SCORED_TYPES = ["quiz", "diagnostic", "practice"];

const dayKey = (date) => new Date(date).toISOString().slice(0, 10);

export const statusForScore = (score) => {
  if (score === null) return "not_assessed";
  if (score >= MASTERY_BANDS.strong) return "strong";
  if (score >= MASTERY_BANDS.improving) return "improving";
  return "needs_practice";
};

// Mastery = weighted average of the 5 most recent scored attempts for a
// topic (newest counts most). Lesson completion alone never raises it.
export const computeMastery = (events) => {
  const scored = events
    .filter(
      (e) => SCORED_TYPES.includes(e.type) && e.total > 0 && e.topic
    )
    .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt));

  const byTopic = new Map();
  for (const e of scored) {
    const key = `${e.subject}__${e.topic}`;
    const list = byTopic.get(key) || [];
    if (list.length < 5) list.push(e);
    byTopic.set(key, list);
  }

  const completed = new Set(
    events
      .filter((e) => e.type === "lesson_complete")
      .map((e) => `${e.subject}__${e.topic}`)
  );

  const result = {};
  for (const [subject, topics] of Object.entries(CATALOGUE)) {
    result[subject] = topics.map((topic) => {
      const key = `${subject}__${topic}`;
      const list = byTopic.get(key) || [];
      let score = null;
      if (list.length) {
        let weight = 0;
        let sum = 0;
        list.forEach((e, i) => {
          const w = 1 / (i + 1);
          sum += (e.score / e.total) * 100 * w;
          weight += w;
        });
        score = Math.round(sum / weight);
      }
      return {
        topic,
        score,
        status: statusForScore(score),
        attempts: list.length,
        lessonCompleted: completed.has(key),
      };
    });
  }
  return result;
};

export const computeStreak = (events) => {
  const days = new Set(events.map((e) => dayKey(e.occurredAt)));
  const today = new Date();
  let streak = 0;
  const cursor = new Date(today);

  // A streak stays alive if the student studied yesterday but not yet today.
  if (!days.has(dayKey(cursor))) {
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }
  while (days.has(dayKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const week = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setUTCDate(d.getUTCDate() - i);
    week.push({ date: dayKey(d), active: days.has(dayKey(d)) });
  }
  return { streak, week };
};

// Rule-based, deterministic 7-day plan. It is recomputed from the latest
// events on every request, so it adapts after each quiz.
export const buildPath = (mastery, subject) => {
  const topics = mastery[subject] || [];
  const byScore = (a, b) => (a.score ?? 0) - (b.score ?? 0);
  const weak = topics
    .filter((t) => t.status === "needs_practice")
    .sort(byScore);
  const unassessed = topics.filter((t) => t.status === "not_assessed");
  const improving = topics
    .filter((t) => t.status === "improving")
    .sort(byScore);
  const strong = topics.filter((t) => t.status === "strong");

  const days = [];
  const add = (kind, t, reason) =>
    days.push({ kind, topic: t.topic, reason });

  for (const t of weak.slice(0, 2)) {
    add(
      "lesson",
      t,
      `Your score in ${t.topic} is ${t.score}%. Let's revisit it before moving ahead.`
    );
    add("practice", t, `Practice ${t.topic} with short questions.`);
  }
  for (const t of unassessed) {
    if (days.length >= 6) break;
    add("lesson", t, `${t.topic} has not been assessed yet.`);
  }
  for (const t of improving) {
    if (days.length >= 6) break;
    add("practice", t, `You are improving in ${t.topic}. Keep going.`);
  }
  for (const t of strong) {
    if (days.length >= 6) break;
    add("revision", t, `A quick revision keeps ${t.topic} strong.`);
  }
  // Pad with revision of any topic if the student has very few topics left.
  let i = 0;
  while (days.length < 6 && topics.length) {
    add("revision", topics[i % topics.length], "Revision");
    i += 1;
  }

  days.push({
    kind: "assessment",
    topic: "",
    reason: "Take an assessment to update your learning path.",
  });

  return days.slice(0, 7).map((d, index) => ({ day: index + 1, ...d }));
};

export const weeklyMission = (events, mastery, subject) => {
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = events.filter(
    (e) => new Date(e.occurredAt).getTime() >= weekAgo
  );
  const topics = mastery[subject] || [];
  const focus =
    [...topics]
      .filter((t) => t.status !== "strong")
      .sort((a, b) => (a.score ?? -1) - (b.score ?? -1))[0] ||
    topics[0];

  const lessons = new Set(
    recent
      .filter((e) => e.type === "lesson_complete")
      .map((e) => `${e.subject}__${e.topic}`)
  ).size;
  const quizzes = recent.filter((e) =>
    SCORED_TYPES.includes(e.type)
  ).length;
  const doubts = recent.filter((e) => e.type === "ai_doubt").length;

  const targets = { lessons: 4, quizzes: 2 };
  const done =
    Math.min(lessons, targets.lessons) +
    Math.min(quizzes, targets.quizzes);
  const progress = Math.round(
    (done / (targets.lessons + targets.quizzes)) * 100
  );

  return {
    subject,
    focusTopic: focus?.topic || "",
    lessons: { done: lessons, target: targets.lessons },
    quizzes: { done: quizzes, target: targets.quizzes },
    doubts,
    progress,
    achievement:
      progress >= 100 && focus ? `${focus.topic} Explorer` : null,
  };
};

export const loadEvents = (userId) =>
  LearningEvent.find({ user: userId })
    .sort({ occurredAt: -1 })
    .limit(2000)
    .lean();
