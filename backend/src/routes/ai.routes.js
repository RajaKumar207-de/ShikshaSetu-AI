import express from "express";

import {
    askAI,
    generateCareerRoadmap
} from "../controllers/ai.controller.js";

const router = express.Router();

// AI Tutor
router.post("/ask", askAI);

// AI Career Roadmap
router.post("/career", generateCareerRoadmap);

export default router;