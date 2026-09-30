import express from "express";
import { loginUser } from "../controllers/login.controller.js";
import {
  loginIpLimiter,
  loginLimiter,
} from "../middleware/rateLimit.middleware.js";

const router = express.Router();

router.post("/login", loginIpLimiter, loginLimiter, loginUser);

export default router;
