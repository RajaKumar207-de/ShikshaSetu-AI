import dns from "dns";
dns.setDefaultResultOrder("ipv4first");

// Must be the first import so every module below sees the environment.
import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";

import connectDB from "./config/db.js";
import {
  allowedOrigins,
  isProduction,
  validateEnv,
} from "./config/env.js";
import logger, { errorMeta } from "./utils/logger.js";

import { requestLogger } from "./middleware/requestLogger.middleware.js";
import { sanitizeInput } from "./middleware/sanitize.middleware.js";
import { apiLimiter } from "./middleware/rateLimit.middleware.js";
import {
  errorHandler,
  notFoundHandler,
} from "./middleware/error.middleware.js";

import authRoutes from "./routes/auth.routes.js";
import loginRoutes from "./routes/login.routes.js";
import meRoutes from "./routes/me.routes.js";
import aiRoutes from "./routes/ai.routes.js";
import mentorRequestRoutes from "./routes/mentorRequest.routes.js";
import scholarshipRoutes from "./routes/scholarship.routes.js";
import ttsRoutes from "./routes/tts.routes.js";
import learningRoutes from "./routes/learning.routes.js";
import notificationRoutes from "./routes/notification.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import mentorPanelRoutes from "./routes/mentorPanel.routes.js";
import { startReminderScheduler } from "./services/reminder.service.js";

validateEnv();

const app = express();

app.disable("x-powered-by");

// Behind a reverse proxy / load balancer, set TRUST_PROXY=true so
// rate limits see the real client IP.
app.set("trust proxy", process.env.TRUST_PROXY === "true" ? 1 : false);

app.use(requestLogger);

app.use(
  helmet({
    // The API returns JSON/audio fetched from another origin (the frontend).
    crossOriginResourcePolicy: { policy: "cross-origin" },
  })
);

const origins = allowedOrigins();

app.use(
  cors({
    origin: (origin, callback) => {
      // No Origin header = curl, server-to-server or same-origin: allowed.
      if (!origin || origins.includes(origin)) return callback(null, true);
      return callback(new Error("CORS_NOT_ALLOWED"));
    },
    // Auth uses the Authorization header, not cookies.
    credentials: false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    maxAge: 600,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(sanitizeInput);

// Lightweight liveness/readiness check: no secrets, no internals.
app.get("/api/health", (req, res) => {
  const dbUp = mongoose.connection.readyState === 1;
  res
    .status(dbUp ? 200 : 503)
    .json({ status: dbUp ? "ok" : "degraded" });
});

app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/auth", meRoutes);

app.use("/api/ai", aiRoutes);
app.use("/api/ai", ttsRoutes);

app.use("/api/mentors", mentorRequestRoutes);
app.use("/api/scholarships", scholarshipRoutes);
app.use("/api/learning", learningRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/mentor-panel", mentorPanelRoutes);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ShikshaSetu AI Backend is running 🚀",
  });
});

app.use(notFoundHandler);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      logger.info("Server started", {
        port: PORT,
        env: isProduction ? "production" : "development",
        corsOrigins: origins,
      });
      startReminderScheduler();
    });

    // Finish in-flight requests, then close the DB on shutdown.
    const shutdown = (signal) => {
      logger.info("Shutting down", { signal });
      server.close(async () => {
        await mongoose.connection.close();
        process.exit(0);
      });
      setTimeout(() => process.exit(1), 10_000).unref();
    };
    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start server", errorMeta(error));
    process.exit(1);
  }
};

process.on("unhandledRejection", (reason) =>
  logger.error("Unhandled promise rejection", errorMeta(reason))
);
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", errorMeta(error));
  process.exit(1);
});

startServer();
