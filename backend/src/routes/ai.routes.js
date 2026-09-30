import express from "express";

import {
  askAI,
  generateCareerRoadmap,
} from "../controllers/ai.controller.js";

import {
  explainAgain,
  askSarthi,
  generateQuestions,
} from "../controllers/aiAssist.controller.js";

import { authenticate } from "../middleware/auth.middleware.js";
import { optionalAuth } from "../middleware/role.middleware.js";
import {
  aiLimiter,
  preventDuplicate,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

// Gemini calls are limited per user (or per IP for guests, with tighter
// limits), and an identical request can't run twice at the same time.
// AI Tutor, Career and Explain stay open to guests (existing product
// behaviour); Sarthi and question generation require sign-in.
router.post("/ask", optionalAuth, ...aiLimiter, preventDuplicate, askAI);
router.post("/career", optionalAuth, ...aiLimiter, preventDuplicate, generateCareerRoadmap);
router.post("/explain", optionalAuth, ...aiLimiter, preventDuplicate, explainAgain);

router.post("/sarthi", authenticate, ...aiLimiter, preventDuplicate, askSarthi);
router.post("/questions", authenticate, ...aiLimiter, preventDuplicate, generateQuestions);

export default router;
