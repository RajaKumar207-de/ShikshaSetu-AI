import express from "express";

import {
  getScholarships,
  getScholarshipById,
  searchScholarships,
   seedScholarships,
   findScholarshipsForStudent,
} from "../controllers/scholarship.controller.js";

const router = express.Router();

// Get all scholarships
router.get("/", getScholarships);

// Search / filter scholarships
router.get("/search", searchScholarships);
router.post("/find-for-me", findScholarshipsForStudent);

// Get single scholarship
router.get("/:id", getScholarshipById);
// Demo scholarship data
router.post("/seed", seedScholarships);
export default router;