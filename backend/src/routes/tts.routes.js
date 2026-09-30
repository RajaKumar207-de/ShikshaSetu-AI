import express from "express";
import { textToSpeech } from "../controllers/tts.controller.js";
import { optionalAuth } from "../middleware/role.middleware.js";
import { ttsLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/speech", optionalAuth, ...ttsLimiter, textToSpeech);

export default router;
