import { badRequest } from "../utils/httpError.js";

// Blocks MongoDB operator injection: no key may contain "$" or "." in the body, query string or route params.
// (Rejects rather than mutates - req.query is read-only in Express 5.)
const hasUnsafeKey = (value, depth = 0) => {
  if (!value || typeof value !== "object" || depth > 6) return false;
  for (const key of Object.keys(value)) {
    if (key.includes("$") || key.includes(".")) return true;
    if (hasUnsafeKey(value[key], depth + 1)) return true;
  }
  return false;
};

export const sanitizeInput = (req, res, next) => {
  if (
    hasUnsafeKey(req.body) ||
    hasUnsafeKey(req.query) ||
    hasUnsafeKey(req.params)
  ) {
    return next(badRequest("Invalid request"));
  }
  next();
};
