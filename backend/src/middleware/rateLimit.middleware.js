import { createHash } from "crypto";

// In-memory fixed-window rate limiter (no extra dependency).
//
// SCALING NOTE: counters live in this process. That is fine for one
// instance. If the API is scaled to several instances, each keeps its own
// counters (limits become "per instance"); switch the store to a shared
// one (e.g. Redis) only at that point. Nothing else depends on this state.

const stores = [];

setInterval(() => {
  const now = Date.now();
  for (const hits of stores) {
    for (const [key, entry] of hits) {
      if (entry.reset <= now) hits.delete(key);
    }
  }
}, 60_000).unref();

export const rateLimit = ({
  windowMs = 60_000,
  max = 60,
  message = "Too many requests. Please slow down and try again shortly.",
  keyFn = (req) => req.user?._id?.toString() || req.ip,
  skip = () => false,
} = {}) => {
  const hits = new Map();
  stores.push(hits);

  return (req, res, next) => {
    if (skip(req)) return next();

    const key = keyFn(req);
    const limit = typeof max === "function" ? max(req) : max;
    const now = Date.now();
    let entry = hits.get(key);

    if (!entry || entry.reset <= now) {
      entry = { count: 0, reset: now + windowMs };
      hits.set(key, entry);
    }

    entry.count += 1;
    const remaining = Math.max(0, limit - entry.count);
    res.set("RateLimit-Limit", String(limit));
    res.set("RateLimit-Remaining", String(remaining));

    if (entry.count > limit) {
      const retryAfter = Math.max(1, Math.ceil((entry.reset - now) / 1000));
      res.set("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message,
        retryAfterSeconds: retryAfter,
      });
    }

    next();
  };
};

// ---- Presets (limits chosen for normal student use) ----

// Every /api request, per IP: generous, only stops floods.
export const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 300,
  keyFn: (req) => req.ip,
});

// Login: slows password guessing. Keyed by IP + email so one shared
// school/village network isn't locked out by one person's typos.
export const loginLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 10,
  keyFn: (req) =>
    `${req.ip}|${String(req.body?.email || "").toLowerCase().slice(0, 100)}`,
  message: "Too many login attempts. Please wait a few minutes and try again.",
});

// Extra IP-wide guard for login (credential stuffing across many emails).
export const loginIpLimiter = rateLimit({
  windowMs: 15 * 60_000,
  max: 60,
  keyFn: (req) => req.ip,
  message: "Too many login attempts from this network. Please try again later.",
});

export const registerLimiter = rateLimit({
  windowMs: 60 * 60_000,
  max: 20,
  keyFn: (req) => req.ip,
  message: "Too many accounts created from this network. Please try again later.",
});

// AI endpoints cost money: signed-in students get more room than guests.
const aiMessage = "You're asking too fast. Please wait a moment and try again.";

export const aiLimiter = [
  rateLimit({
    windowMs: 60_000,
    max: (req) => (req.user ? 15 : 5),
    message: aiMessage,
  }),
  rateLimit({
    windowMs: 24 * 60 * 60_000,
    max: (req) => (req.user ? 200 : 25),
    message: "You've reached today's AI limit. Please come back tomorrow.",
  }),
];

// Text-to-speech is also billed per request.
export const ttsLimiter = [
  rateLimit({
    windowMs: 60_000,
    max: (req) => (req.user ? 30 : 8),
    message: aiMessage,
  }),
  rateLimit({
    windowMs: 24 * 60 * 60_000,
    max: (req) => (req.user ? 400 : 40),
    message: "You've reached today's voice limit. Please come back tomorrow.",
  }),
];

// Writes that create records (mentor requests, tracking, events).
export const writeLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
});

// ---- Duplicate in-flight request guard ----
// Blocks an identical request from the same user while the first one is
// still running (double clicks, retries), so it can't spend AI quota twice.
// Process-local by design: it only lives as long as one request.
const inFlight = new Set();

export const preventDuplicate = (req, res, next) => {
  const who = req.user?._id?.toString() || req.ip;
  const bodyHash = createHash("sha1")
    .update(JSON.stringify(req.body || {}))
    .digest("hex");
  const key = `${who}|${req.baseUrl}${req.path}|${bodyHash}`;

  if (inFlight.has(key)) {
    return res.status(429).json({
      success: false,
      message: "Your previous request is still being processed. Please wait.",
      retryAfterSeconds: 3,
    });
  }

  inFlight.add(key);
  const release = () => inFlight.delete(key);
  res.on("finish", release);
  res.on("close", release);
  next();
};
