import logger from "../utils/logger.js";

export const isProduction = process.env.NODE_ENV === "production";

// Fails fast on missing/weak configuration instead of failing later
// with confusing errors.
export const validateEnv = () => {
  const missing = ["MONGO_URI", "JWT_SECRET"].filter(
    (name) => !process.env[name]
  );
  if (missing.length) {
    logger.error("Missing required environment variables", { missing });
    process.exit(1);
  }

  if (isProduction) {
    if (process.env.JWT_SECRET.length < 32) {
      logger.error("JWT_SECRET must be at least 32 characters in production");
      process.exit(1);
    }
    if (!process.env.CORS_ORIGINS) {
      logger.error(
        "CORS_ORIGINS must list the frontend domain(s) in production"
      );
      process.exit(1);
    }
  }

  // Optional services: the app still runs, features degrade gracefully.
  if (!process.env.GEMINI_API_KEY) {
    logger.warn("GEMINI_API_KEY missing - AI features will return errors");
  }
  if (!process.env.SARVAM_API_KEY) {
    logger.warn("SARVAM_API_KEY missing - text-to-speech will return errors");
  }
};

// Origins allowed to call the API from a browser.
export const allowedOrigins = () => {
  const configured = (process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean);

  if (configured.length) return configured;
  // Development default only (production requires CORS_ORIGINS above).
  return ["http://localhost:5173", "http://127.0.0.1:5173"];
};
