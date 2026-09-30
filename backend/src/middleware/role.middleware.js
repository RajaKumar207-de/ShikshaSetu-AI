import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const requireRole =
  (...roles) =>
  (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission for this action",
      });
    }
    next();
  };

// Attaches req.user when a valid token is present, but never blocks.
export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (header) {
      const token = header.startsWith("Bearer ")
        ? header.split(" ")[1]
        : header;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select(
        "-password"
      );
    }
  } catch {
    // ignore invalid tokens for optional auth
  }
  next();
};

// Demo/seed endpoints: open in development, admin-only in production.
export const devOrAdminOnly = (req, res, next) => {
  if (process.env.NODE_ENV !== "production") return next();
  if (req.user?.role === "admin") return next();
  return res.status(403).json({
    success: false,
    message: "Not available in production",
  });
};
