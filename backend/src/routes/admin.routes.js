import express from "express";
import {
  createScholarship,
  getMentor,
  getOverview,
  getStudent,
  listMentors,
  listScholarships,
  listStudents,
  sendAnnouncement,
  updateScholarship,
  updateUserRole,
} from "../controllers/admin.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Every admin route: valid token + admin role.
router.use(authenticate, requireRole("admin"));

router.get("/overview", getOverview);

router.get("/students", listStudents);
router.get("/students/:id", getStudent);

router.get("/mentors", listMentors);
router.get("/mentors/:id", getMentor);

router.patch("/users/:id/role", writeLimiter, updateUserRole);

router.get("/scholarships", listScholarships);
router.post("/scholarships", writeLimiter, createScholarship);
router.patch("/scholarships/:id", writeLimiter, updateScholarship);

router.post("/announcements", writeLimiter, sendAnnouncement);

export default router;
