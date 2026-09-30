import logger, { errorMeta } from "../utils/logger.js";
import { HttpError } from "../utils/httpError.js";

export const notFoundHandler = (req, res) =>
  res.status(404).json({ success: false, message: "Route not found" });

// Single place that turns any thrown error into a safe JSON response.
// Technical details go to the server log only.
// eslint-disable-next-line no-unused-vars
export const errorHandler = (error, req, res, next) => {
  let status = error.status || error.statusCode || 500;
  let message = "Something went wrong. Please try again.";

  // Body-parser errors also have .expose, so they are matched first and
  // get a fixed message instead of the parser's technical text.
  if (error.type === "entity.parse.failed") {
    status = 400;
    message = "Invalid request format";
  } else if (error.type === "entity.too.large") {
    status = 413;
    message = "Request is too large";
  } else if (error instanceof HttpError) {
    message = error.message; // written for users
  } else if (error.name === "CastError" || error.name === "ValidationError") {
    status = 400;
    message = "Invalid request";
  } else if (error.code === 11000) {
    status = 409;
    message = "This already exists";
  } else if (error.message === "CORS_NOT_ALLOWED") {
    status = 403;
    message = "This origin is not allowed";
  } else if (status >= 500 || status < 400) {
    status = 500;
  }

  if (status >= 500) {
    logger.error("Unhandled error", {
      requestId: req.id,
      method: req.method,
      path: req.path,
      userId: req.user?._id?.toString(),
      ...errorMeta(error),
    });
  }

  if (res.headersSent) return;
  res.status(status).json({ success: false, message });
};
