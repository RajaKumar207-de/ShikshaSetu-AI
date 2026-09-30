import User from "../models/user.model.js";
import MentorRequest from "../models/mentorRequest.model.js";
import LearningEvent from "../models/learningEvent.model.js";
import Scholarship from "../models/scholarship.model.js";
import TrackedScholarship from "../models/trackedScholarship.model.js";
import { notify } from "../services/notification.service.js";
import {
  INACTIVE_AFTER_DAYS,
  bulkMentorStats,
  bulkStudentStats,
  emptyMentorStats,
  emptyStats,
  studentProgress,
} from "../services/progress.service.js";
import {
  LANGUAGES,
  getPagination,
  paginationMeta,
  v,
} from "../middleware/validate.js";
import { badRequest, forbidden, notFound } from "../utils/httpError.js";

// Admin panel API. Read-mostly: every write goes through fields that
// already exist in the schema (role, mentor profile, scholarship fields).

const DAY_MS = 86_400_000;
const SCORED_TYPES = ["quiz", "diagnostic", "practice"];

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const searchFilter = (search) => {
  if (!search) return {};
  const pattern = new RegExp(escapeRegex(search), "i");
  return { $or: [{ name: pattern }, { email: pattern }] };
};

const publicUser = (u) => ({
  id: u._id,
  name: u.name,
  email: u.email,
  role: u.role,
  language: u.language,
  subject: u.subject,
  experience: u.experience,
  availability: u.availability,
  createdAt: u.createdAt,
});

// ==========================================
// OVERVIEW
// ==========================================

export const getOverview = async (req, res) => {
  const now = Date.now();
  const weekAgo = new Date(now - 7 * DAY_MS);
  const monthAgo = new Date(now - 30 * DAY_MS);
  const twoWeeksAgo = new Date(now - 13 * DAY_MS);
  twoWeeksAgo.setUTCHours(0, 0, 0, 0);

  const [
    roleCounts,
    newThisWeek,
    newThisMonth,
    active7,
    active30,
    requestCounts,
    languages,
    weakTopics,
    activity,
    eventTypes,
    scholarships,
  ] = await Promise.all([
    User.aggregate([{ $group: { _id: "$role", count: { $sum: 1 } } }]),
    User.countDocuments({ role: "student", createdAt: { $gte: weekAgo } }),
    User.countDocuments({ role: "student", createdAt: { $gte: monthAgo } }),
    LearningEvent.distinct("user", { occurredAt: { $gte: weekAgo } }),
    LearningEvent.distinct("user", { occurredAt: { $gte: monthAgo } }),
    MentorRequest.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: "student" } },
      { $group: { _id: "$language", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    LearningEvent.aggregate([
      { $match: { type: { $in: SCORED_TYPES }, total: { $gt: 0 }, topic: { $ne: "" } } },
      {
        $group: {
          _id: { subject: "$subject", topic: "$topic" },
          average: { $avg: { $multiply: [{ $divide: ["$score", "$total"] }, 100] } },
          attempts: { $sum: 1 },
          students: { $addToSet: "$user" },
        },
      },
      { $match: { attempts: { $gte: 2 } } },
      { $sort: { average: 1 } },
      { $limit: 6 },
    ]),
    LearningEvent.aggregate([
      { $match: { occurredAt: { $gte: twoWeeksAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$occurredAt" } },
          events: { $sum: 1 },
          students: { $addToSet: "$user" },
        },
      },
    ]),
    LearningEvent.aggregate([{ $group: { _id: "$type", count: { $sum: 1 } } }]),
    Scholarship.aggregate([{ $group: { _id: "$isActive", count: { $sum: 1 } } }]),
  ]);

  const byKey = (rows) => Object.fromEntries(rows.map((r) => [String(r._id), r.count]));
  const roles = byKey(roleCounts);
  const requests = byKey(requestCounts);
  const types = byKey(eventTypes);
  const schol = byKey(scholarships);

  // Fill every day of the last 14 so the chart has no gaps.
  const activityByDay = new Map(activity.map((a) => [a._id, a]));
  const days = [];
  for (let i = 13; i >= 0; i -= 1) {
    const key = new Date(now - i * DAY_MS).toISOString().slice(0, 10);
    const row = activityByDay.get(key);
    days.push({
      date: key,
      events: row?.events || 0,
      students: row?.students.length || 0,
    });
  }

  return res.json({
    success: true,
    users: {
      students: roles.student || 0,
      mentors: roles.mentor || 0,
      admins: roles.admin || 0,
      newStudentsThisWeek: newThisWeek,
      newStudentsThisMonth: newThisMonth,
      activeStudents7d: active7.length,
      activeStudents30d: active30.length,
    },
    requests: {
      pending: requests.pending || 0,
      accepted: requests.accepted || 0,
      rejected: requests.rejected || 0,
    },
    learning: {
      lessonsCompleted: types.lesson_complete || 0,
      quizzes: (types.quiz || 0) + (types.diagnostic || 0) + (types.practice || 0),
      aiDoubts: types.ai_doubt || 0,
    },
    scholarships: {
      active: schol.true || 0,
      inactive: schol.false || 0,
    },
    languages: languages.map((l) => ({ language: l._id || "Not set", count: l.count })),
    weakTopics: weakTopics.map((t) => ({
      subject: t._id.subject,
      topic: t._id.topic,
      average: Math.round(t.average),
      attempts: t.attempts,
      students: t.students.length,
    })),
    activity: days,
  });
};

// ==========================================
// STUDENTS
// ==========================================

export const listStudents = async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const search = v.filter(req.query.search, "search", 80);
  const language = v.oneOf(req.query.language, "language", LANGUAGES, { optional: true });
  const inactiveOnly = req.query.inactive === "true";

  const filter = { role: "student", ...searchFilter(search) };
  if (language) filter.language = language;

  if (inactiveOnly) {
    // "Inactive" = no learning activity in the last INACTIVE_AFTER_DAYS days.
    const since = new Date(Date.now() - INACTIVE_AFTER_DAYS * DAY_MS);
    const recent = await LearningEvent.distinct("user", { occurredAt: { $gte: since } });
    filter._id = { $nin: recent };
  }

  const [students, total] = await Promise.all([
    User.find(filter)
      .select("name email role language createdAt")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const stats = await bulkStudentStats(students.map((s) => s._id));

  return res.json({
    success: true,
    students: students.map((s) => ({
      ...publicUser(s),
      stats: stats.get(String(s._id)) || emptyStats,
    })),
    pagination: paginationMeta(pagination, total),
  });
};

export const getStudent = async (req, res) => {
  const id = v.objectId(req.params.id, "student ID");

  const student = await User.findOne({ _id: id, role: "student" }).lean();
  if (!student) throw notFound("Student not found");

  const [progress, requests, tracked] = await Promise.all([
    studentProgress(id),
    MentorRequest.find({ student: id })
      .populate("mentor", "name subject email")
      .sort({ createdAt: -1 })
      .lean(),
    TrackedScholarship.countDocuments({ user: id }),
  ]);

  return res.json({
    success: true,
    student: publicUser(student),
    progress,
    trackedScholarships: tracked,
    mentorRequests: requests.map((r) => ({
      id: r._id,
      status: r.status,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      mentor: r.mentor
        ? { id: r.mentor._id, name: r.mentor.name, subject: r.mentor.subject }
        : null,
    })),
  });
};

// ==========================================
// MENTORS
// ==========================================

export const listMentors = async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const search = v.filter(req.query.search, "search", 80);

  const filter = { role: "mentor", ...searchFilter(search) };

  const [mentors, total] = await Promise.all([
    User.find(filter)
      .select("name email role language subject experience availability createdAt")
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments(filter),
  ]);

  const stats = await bulkMentorStats(mentors.map((m) => m._id));

  return res.json({
    success: true,
    mentors: mentors.map((m) => ({
      ...publicUser(m),
      stats: stats.get(String(m._id)) || emptyMentorStats,
    })),
    pagination: paginationMeta(pagination, total),
  });
};

export const getMentor = async (req, res) => {
  const id = v.objectId(req.params.id, "mentor ID");

  const mentor = await User.findOne({ _id: id, role: "mentor" }).lean();
  if (!mentor) throw notFound("Mentor not found");

  const [stats, requests] = await Promise.all([
    bulkMentorStats([id]),
    MentorRequest.find({ mentor: id })
      .populate("student", "name email language")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean(),
  ]);

  const studentStats = await bulkStudentStats(
    requests.filter((r) => r.student).map((r) => r.student._id)
  );

  return res.json({
    success: true,
    mentor: publicUser(mentor),
    stats: stats.get(id) || emptyMentorStats,
    requests: requests.map((r) => ({
      id: r._id,
      status: r.status,
      message: r.message,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      student: r.student
        ? {
            id: r.student._id,
            name: r.student.name,
            email: r.student.email,
            language: r.student.language,
            stats: studentStats.get(String(r.student._id)) || emptyStats,
          }
        : null,
    })),
  });
};

// ==========================================
// USERS → ROLE
// ==========================================

export const updateUserRole = async (req, res) => {
  const id = v.objectId(req.params.id, "user ID");
  const role = v.oneOf(req.body?.role, "role", ["student", "mentor"]);

  if (id === String(req.user._id)) {
    throw forbidden("You cannot change your own role");
  }

  const user = await User.findById(id);
  if (!user) throw notFound("User not found");

  // Admin accounts are managed directly in the database.
  if (user.role === "admin") throw forbidden("Admin roles cannot be changed here");

  if (user.role === role) {
    return res.json({ success: true, message: `Already a ${role}`, user: publicUser(user) });
  }

  user.role = role;
  await user.save();

  await notify(user._id, {
    type: "system",
    title: role === "mentor" ? "You are now a mentor" : "Your account role changed",
    message:
      role === "mentor"
        ? "An admin made you a mentor. Students can now send you requests."
        : "Your account is now a student account.",
    link: role === "mentor" ? "/mentor-panel" : "/",
  });

  return res.json({ success: true, message: `Role changed to ${role}`, user: publicUser(user) });
};

// ==========================================
// SCHOLARSHIPS
// ==========================================

const stringList = (value, name) => {
  if (value === undefined) return undefined;
  const list = Array.isArray(value) ? value : String(value).split(",");
  if (list.length > 20) throw badRequest(`Too many ${name}`);
  return list.map((item) => v.string(String(item), name, { max: 80 })).filter(Boolean);
};

const scholarshipInput = (body = {}, { partial = false } = {}) => {
  const opt = { optional: partial };
  const data = {
    name: v.string(body.name, "Name", { max: 160, ...opt }),
    provider: v.string(body.provider, "Provider", { max: 160, ...opt }),
    description: v.string(body.description, "Description", { max: 2000, optional: true }),
    amount: v.string(body.amount, "Amount", { max: 80, optional: true }),
    state: v.string(body.state, "State", { max: 80, optional: true }),
    incomeLimit: v.string(body.incomeLimit, "Income limit", { max: 80, optional: true }),
    deadline: v.string(body.deadline, "Deadline", { max: 80, optional: true }),
    officialLink: v.string(body.officialLink, "Official link", { max: 500, optional: true }),
    category: stringList(body.category, "categories"),
    educationLevel: stringList(body.educationLevel, "education levels"),
    documents: stringList(body.documents, "documents"),
  };

  if (data.officialLink && !/^https?:\/\//i.test(data.officialLink)) {
    throw badRequest("Official link must start with http:// or https://");
  }

  if (body.deadlineDate !== undefined) {
    if (body.deadlineDate === null || body.deadlineDate === "") {
      data.deadlineDate = null;
    } else {
      const date = new Date(body.deadlineDate);
      if (Number.isNaN(date.getTime())) throw badRequest("Invalid deadline date");
      data.deadlineDate = date;
    }
  }

  if (body.isActive !== undefined) {
    if (typeof body.isActive !== "boolean") throw badRequest("isActive must be true or false");
    data.isActive = body.isActive;
  }

  // Drop fields that were not sent so a PATCH never blanks them.
  return Object.fromEntries(Object.entries(data).filter(([, val]) => val !== undefined));
};

export const listScholarships = async (req, res) => {
  const pagination = getPagination(req.query, { defaultLimit: 20, maxLimit: 50 });
  const search = v.filter(req.query.search, "search", 80);
  const status = v.oneOf(req.query.status, "status", ["active", "inactive", "expired"], {
    optional: true,
  });

  const filter = {};
  if (search) {
    const pattern = new RegExp(escapeRegex(search), "i");
    filter.$or = [{ name: pattern }, { provider: pattern }];
  }
  if (status === "active") filter.isActive = true;
  if (status === "inactive") filter.isActive = false;
  if (status === "expired") filter.deadlineDate = { $lt: new Date() };

  const [items, total] = await Promise.all([
    Scholarship.find(filter)
      .sort({ createdAt: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Scholarship.countDocuments(filter),
  ]);

  const trackedRows = await TrackedScholarship.aggregate([
    { $match: { scholarship: { $in: items.map((s) => s._id) } } },
    { $group: { _id: "$scholarship", count: { $sum: 1 } } },
  ]);
  const tracked = new Map(trackedRows.map((r) => [String(r._id), r.count]));

  return res.json({
    success: true,
    scholarships: items.map((s) => ({
      ...s,
      trackedBy: tracked.get(String(s._id)) || 0,
      expired: Boolean(s.deadlineDate && new Date(s.deadlineDate) < new Date()),
    })),
    pagination: paginationMeta(pagination, total),
  });
};

export const createScholarship = async (req, res) => {
  const scholarship = await Scholarship.create(scholarshipInput(req.body));
  return res.status(201).json({ success: true, message: "Scholarship created", scholarship });
};

export const updateScholarship = async (req, res) => {
  const id = v.objectId(req.params.id, "scholarship ID");
  const data = scholarshipInput(req.body, { partial: true });
  if (!Object.keys(data).length) throw badRequest("Nothing to update");

  const scholarship = await Scholarship.findByIdAndUpdate(id, data, {
    returnDocument: "after",
    runValidators: true,
  });
  if (!scholarship) throw notFound("Scholarship not found");

  return res.json({ success: true, message: "Scholarship updated", scholarship });
};

// ==========================================
// ANNOUNCEMENTS
// ==========================================

export const sendAnnouncement = async (req, res) => {
  const audience = v.oneOf(req.body?.audience, "audience", ["all", "students", "mentors"]);
  const language = v.oneOf(req.body?.language, "language", LANGUAGES, { optional: true });
  const title = v.string(req.body?.title, "Title", { max: 140 });
  const message = v.string(req.body?.message, "Message", { max: 400 });
  const link = v.string(req.body?.link, "Link", { max: 200, optional: true });

  if (link && !link.startsWith("/")) throw badRequest("Link must be an in-app path like /learning");

  const filter =
    audience === "students"
      ? { role: "student" }
      : audience === "mentors"
        ? { role: "mentor" }
        : { role: { $in: ["student", "mentor"] } };
  if (language) filter.language = language;

  const recipients = await User.find(filter).select("_id").lean();

  // Small batches keep push delivery from flooding the connection pool.
  let delivered = 0;
  for (let i = 0; i < recipients.length; i += 25) {
    const batch = recipients.slice(i, i + 25);
    const results = await Promise.all(
      batch.map((u) =>
        notify(u._id, {
          type: "system",
          title,
          message,
          link,
          metadata: { announcement: true, from: String(req.user._id) },
        })
      )
    );
    delivered += results.filter(Boolean).length;
  }

  return res.json({
    success: true,
    message: `Announcement sent to ${delivered} user${delivered === 1 ? "" : "s"}`,
    delivered,
  });
};
