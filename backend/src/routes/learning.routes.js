import express from "express";
import {
  recordEvents,
  getSummary,
} from "../controllers/learning.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";
import { writeLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/events", authenticate, writeLimiter, recordEvents);
router.get("/summary", authenticate, getSummary);

export default router;
