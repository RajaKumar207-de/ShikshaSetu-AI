import express from "express";
import { registerUser } from "../controllers/auth.controller.js";
import { registerLimiter } from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/register", registerLimiter, registerUser);

export default router;
