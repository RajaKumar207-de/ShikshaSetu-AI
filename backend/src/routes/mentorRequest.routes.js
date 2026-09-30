import express from "express";

import {
  createMentorRequest,
  getMentorRequests,
  getStudentMentorRequests,
  updateMentorRequest,
  getMentors,
  updateMentorProfile,
  seedMentors,
} from "../controllers/mentorRequest.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import {
  requireRole,
  optionalAuth,
  devOrAdminOnly,
} from "../middleware/role.middleware.js";
import { validate, v, LANGUAGES } from "../middleware/validate.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// ---- input validation (also strips unexpected fields) ----

const validateRequestBody = validate((req) => {
  req.body = {
    mentorId: v.objectId(req.body?.mentorId, "mentor id"),
    message: v.string(req.body?.message, "Message", {
      max: 500,
      optional: true,
    }),
  };
});

const validateDecision = validate((req) => {
  v.objectId(req.params.requestId, "request id");
  req.body = {
    status: v.oneOf(req.body?.status, "status", ["accepted", "rejected"]),
  };
});

const validateProfile = validate((req) => {
  v.objectId(req.params.mentorId, "mentor id");
  const body = req.body || {};
  req.body = {
    subject: v.string(body.subject, "Subject", { max: 80, optional: true }),
    experience: v.string(body.experience, "Experience", {
      max: 200,
      optional: true,
    }),
    language: v.oneOf(body.language, "language", LANGUAGES, {
      optional: true,
    }),
    availability: v.oneOf(body.availability, "availability", [
      "Available",
      "Offline",
    ], { optional: true }),
  };
});

// ---- routes ----

// Seed demo mentors (dev only, admin-only in production)
router.post("/seed", optionalAuth, devOrAdminOnly, seedMentors);

// Mentor list (contact emails only for signed-in users)
router.get("/", optionalAuth, getMentors);

// A mentor edits their own profile (admins can edit any)
router.patch(
  "/profile/:mentorId",
  authenticate,
  validateProfile,
  updateMentorProfile
);

// Student sends mentor request
router.post(
  "/request",
  authenticate,
  requireRole("student"),
  writeLimiter,
  validateRequestBody,
  createMentorRequest
);

// Mentor gets incoming requests
router.get(
  "/requests",
  authenticate,
  requireRole("mentor"),
  getMentorRequests
);

// Student gets their sent mentor requests
router.get("/my-requests", authenticate, getStudentMentorRequests);

// Mentor accepts/rejects a request addressed to them
router.patch(
  "/request/:requestId",
  authenticate,
  requireRole("mentor"),
  writeLimiter,
  validateDecision,
  updateMentorRequest
);

export default router;
