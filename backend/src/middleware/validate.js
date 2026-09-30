import { badRequest } from "../utils/httpError.js";

// Tiny dependency-free validators. Each returns the cleaned value or
// throws a 400 HttpError with a user-friendly message.

const OBJECT_ID = /^[a-f\d]{24}$/i;
const EMAIL = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

export const LANGUAGES = [
  "English",
  "Hindi",
  "Marathi",
  "Bengali",
  "Tamil",
  "Telugu",
  "Gujarati",
  "Punjabi",
];

export const v = {
  string(value, name, { min = 1, max = 200, optional = false } = {}) {
    if (value === undefined || value === null || value === "") {
      if (optional) return undefined;
      throw badRequest(`${name} is required`);
    }
    if (typeof value !== "string") throw badRequest(`${name} must be text`);
    const clean = value.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, "").trim();
    if (clean.length < min) throw badRequest(`${name} is too short`);
    if (clean.length > max) throw badRequest(`${name} is too long (max ${max} characters)`);
    return clean;
  },

  email(value) {
    const clean = v.string(value, "Email", { max: 254 }).toLowerCase();
    if (!EMAIL.test(clean)) throw badRequest("Please enter a valid email address");
    return clean;
  },

  password(value, { strict = false } = {}) {
    if (typeof value !== "string" || !value) throw badRequest("Password is required");
    // bcrypt only reads the first 72 bytes: reject longer input instead of silently truncating.
    if (Buffer.byteLength(value) > 72) throw badRequest("Password is too long (max 72 characters)");
    if (strict && value.length < 8) {
      throw badRequest("Password must be at least 8 characters");
    }
    return value;
  },

  objectId(value, name = "ID") {
    if (typeof value !== "string" || !OBJECT_ID.test(value)) {
      throw badRequest(`Invalid ${name}`);
    }
    return value;
  },

  oneOf(value, name, allowed, { optional = false } = {}) {
    if (value === undefined || value === null || value === "") {
      if (optional) return undefined;
      throw badRequest(`${name} is required`);
    }
    if (!allowed.includes(value)) throw badRequest(`Invalid ${name}`);
    return value;
  },

  int(value, name, { min = 1, max = 1000, fallback } = {}) {
    if (value === undefined || value === "") return fallback;
    const n = Number(value);
    if (!Number.isInteger(n) || n < min || n > max) {
      throw badRequest(`${name} must be a whole number between ${min} and ${max}`);
    }
    return n;
  },

  // Optional filter text from a query string: must be a plain string.
  filter(value, name, max = 60) {
    if (value === undefined || value === "") return undefined;
    return v.string(value, name, { max });
  },
};

// Pagination from query string: ?page=1&limit=20
export const getPagination = (query, { defaultLimit = 20, maxLimit = 50 } = {}) => {
  const page = v.int(query.page, "page", { min: 1, max: 10000, fallback: 1 });
  const limit = v.int(query.limit, "limit", { min: 1, max: maxLimit, fallback: defaultLimit });
  return { page, limit, skip: (page - 1) * limit };
};

export const paginationMeta = ({ page, limit }, total) => ({
  page,
  limit,
  total,
  hasNext: page * limit < total,
});

// Wraps a function that builds cleaned input, turning its errors into
// 400 responses handled by the central error handler.
export const validate = (build) => (req, res, next) => {
  try {
    req.valid = build(req);
    next();
  } catch (error) {
    next(error);
  }
};
