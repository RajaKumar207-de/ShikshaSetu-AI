import Scholarship from "../models/scholarship.model.js";
import TrackedScholarship from "../models/trackedScholarship.model.js";
import { checkRemindersForUser } from "../services/reminder.service.js";
import logger, { errorMeta } from "../utils/logger.js";

const isObjectId = (id) => /^[a-f\d]{24}$/i.test(String(id));

// "Up to ₹5 Lakh" -> 5. Returns null when the text can't be parsed.
const parseIncomeLimitLakh = (text) => {
  const match = String(text || "").match(/(\d+(?:\.\d+)?)\s*lakh/i);
  return match ? parseFloat(match[1]) : null;
};

const daysUntil = (date) =>
  Math.ceil((new Date(date).getTime() - Date.now()) / 86400000);

// =====================================================
// SCHOLARSHIP MATCH
// -----------------------------------------------------
// Score = weighted share of criteria the student's own
// details satisfy, using only fields stored on the
// scholarship. Criteria the scholarship doesn't specify,
// or the student didn't provide, are left out of the score
// (not counted for or against). This is a guide only, not
// an official eligibility decision.
// =====================================================

const WEIGHTS = {
  state: 25,
  category: 30,
  educationLevel: 30,
  income: 15,
};

export const scoreScholarship = (s, student) => {
  const checks = [];

  if (student.state && student.state !== "All India") {
    const ok = s.state === "All India" || s.state === student.state;
    checks.push({
      key: "state",
      label: "State",
      matched: ok,
      detail: ok
        ? `Open to students in ${student.state}`
        : `For students in ${s.state}`,
    });
  }

  if (student.category && student.category !== "All") {
    if (s.category?.length) {
      const ok = s.category.includes(student.category);
      checks.push({
        key: "category",
        label: "Category",
        matched: ok,
        detail: ok
          ? `${student.category} is listed`
          : `Listed for ${s.category.join(", ")}`,
      });
    }
  }

  if (student.educationLevel && student.educationLevel !== "All") {
    if (s.educationLevel?.length) {
      const ok = s.educationLevel.includes(student.educationLevel);
      checks.push({
        key: "educationLevel",
        label: "Education level",
        matched: ok,
        detail: ok
          ? `${student.educationLevel} is listed`
          : `Listed for ${s.educationLevel.join(", ")}`,
      });
    }
  }

  const limit = parseIncomeLimitLakh(s.incomeLimit);
  if (
    typeof student.incomeLakh === "number" &&
    !Number.isNaN(student.incomeLakh) &&
    limit !== null
  ) {
    const ok = student.incomeLakh <= limit;
    checks.push({
      key: "income",
      label: "Family income",
      matched: ok,
      detail: ok
        ? `Within limit (${s.incomeLimit})`
        : `Limit is ${s.incomeLimit}`,
    });
  }

  if (!checks.length) {
    return { match: null, checks };
  }

  const total = checks.reduce((sum, c) => sum + WEIGHTS[c.key], 0);
  const earned = checks
    .filter((c) => c.matched)
    .reduce((sum, c) => sum + WEIGHTS[c.key], 0);

  return { match: Math.round((earned / total) * 100), checks };
};

export const matchScholarships = async (req, res) => {
  try {
    const body = req.body || {};
    const income = Number(body.incomeLakh);
    const student = {
      state: String(body.state || "").slice(0, 60),
      category: String(body.category || "").slice(0, 30),
      educationLevel: String(body.educationLevel || "").slice(0, 40),
      incomeLakh:
        body.incomeLakh === "" || body.incomeLakh == null
          ? undefined
          : income >= 0 && income < 1000
            ? income
            : undefined,
    };

    const scholarships = await Scholarship.find({
      isActive: true,
      $or: [
        { deadlineDate: null },
        { deadlineDate: { $gte: new Date() } },
      ],
    })
      .limit(500)
      .lean();

    const results = scholarships
      .map((s) => {
        const { match, checks } = scoreScholarship(s, student);
        return {
          ...s,
          match,
          matchChecks: checks,
          daysLeft: s.deadlineDate ? daysUntil(s.deadlineDate) : null,
        };
      })
      .filter((s) => s.match === null || s.match >= 50)
      .sort((a, b) => (b.match ?? -1) - (a.match ?? -1));

    return res.json({
      success: true,
      count: results.length,
      criteria: Object.entries(WEIGHTS).map(([key, weight]) => ({
        key,
        weight,
      })),
      scholarships: results,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Match scholarships error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Failed to match scholarships",
    });
  }
};

// =====================================================
// TRACKING
// =====================================================

export const trackScholarship = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid scholarship id" });
    }

    const scholarship = await Scholarship.findById(req.params.id);
    if (!scholarship) {
      return res.status(404).json({
        success: false,
        message: "Scholarship not found",
      });
    }

    await TrackedScholarship.updateOne(
      { user: req.user._id, scholarship: scholarship._id },
      { $setOnInsert: { user: req.user._id, scholarship: scholarship._id } },
      { upsert: true }
    );

    // Send any reminder that is already due (e.g. tracked with 5 days left).
    await checkRemindersForUser(req.user._id);

    return res.status(201).json({
      success: true,
      hasDeadlineDate: Boolean(scholarship.deadlineDate),
      message: scholarship.deadlineDate
        ? "Tracking started. We'll remind you before the deadline."
        : "Tracking started, but this scholarship has no exact deadline date yet, so no reminders can be scheduled.",
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Track scholarship error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not track scholarship",
    });
  }
};

export const untrackScholarship = async (req, res) => {
  try {
    if (!isObjectId(req.params.id)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid scholarship id" });
    }
    await TrackedScholarship.deleteOne({
      user: req.user._id,
      scholarship: req.params.id,
    });
    return res.json({ success: true });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    return res.status(500).json({
      success: false,
      message: "Could not stop tracking",
    });
  }
};

export const getTrackedScholarships = async (req, res) => {
  try {
    const tracked = await TrackedScholarship.find({
      user: req.user._id,
    })
      .populate("scholarship")
      .sort({ createdAt: -1 })
      .limit(200)
      .lean();

    const scholarships = tracked
      .filter((t) => t.scholarship)
      .map((t) => ({
        ...t.scholarship,
        trackedAt: t.createdAt,
        daysLeft: t.scholarship.deadlineDate
          ? daysUntil(t.scholarship.deadlineDate)
          : null,
      }));

    return res.json({
      success: true,
      count: scholarships.length,
      ids: scholarships.map((s) => String(s._id)),
      scholarships,
    });
  } catch (error) {
    // validation errors (400) go to the central error handler
    if (error.expose) throw error;

    logger.error("Tracked scholarships error:", errorMeta(error));
    return res.status(500).json({
      success: false,
      message: "Could not load tracked scholarships",
    });
  }
};
