import express from "express";
import { textToSpeech } from "../controllers/tts.controller.js";

const router = express.Router();

router.post("/speech", textToSpeech);

export default router;