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

const router = express.Router();

// Seed demo mentors
router.post("/seed", seedMentors);

// Get all mentors
router.get("/", getMentors);

// Update mentor profile
router.patch("/profile/:mentorId", updateMentorProfile);

// Student sends mentor request
router.post("/request", authenticate, createMentorRequest);

// Mentor gets incoming requests
router.get("/requests", authenticate, getMentorRequests);

// Student gets their sent mentor requests
router.get(
  "/my-requests",
  authenticate,
  getStudentMentorRequests
);

// Mentor accepts/rejects request
router.patch(
  "/request/:requestId",
  authenticate,
  updateMentorRequest
);

export default router;