import express from "express";
import {
  getMentorOverview,
  getMyStudent,
  getMyStudents,
  remindStudent,
} from "../controllers/mentorPanel.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Profile edits and accept/reject stay on the existing /api/mentors routes.
router.use(authenticate, requireRole("mentor"));

router.get("/overview", getMentorOverview);
router.get("/students", getMyStudents);
router.get("/students/:id", getMyStudent);
router.post("/students/:id/remind", writeLimiter, remindStudent);

export default router;
