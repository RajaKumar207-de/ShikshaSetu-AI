import express from "express";

import {
  getScholarships,
  getScholarshipById,
  searchScholarships,
  seedScholarships,
  findScholarshipsForStudent,
} from "../controllers/scholarship.controller.js";

import {
  matchScholarships,
  trackScholarship,
  untrackScholarship,
  getTrackedScholarships,
} from "../controllers/scholarshipExtras.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";
import {
  optionalAuth,
  devOrAdminOnly,
} from "../middleware/role.middleware.js";

const router = express.Router();

// Get all scholarships
router.get("/", getScholarships);

// Search / filter scholarships
router.get("/search", searchScholarships);
router.post("/find-for-me", findScholarshipsForStudent);

// Scholarship match (percentage based on stored criteria)
router.post("/match", matchScholarships);

// Tracking (must be declared before "/:id")
router.get("/tracked", authenticate, getTrackedScholarships);
router.post("/:id/track", authenticate, writeLimiter, trackScholarship);
router.delete("/:id/track", authenticate, writeLimiter, untrackScholarship);

// Get single scholarship
router.get("/:id", getScholarshipById);

// Demo scholarship data (dev only, admin-only in production)
router.post("/seed", optionalAuth, devOrAdminOnly, seedScholarships);

export default router;
