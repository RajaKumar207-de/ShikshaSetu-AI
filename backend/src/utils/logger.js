// Minimal structured logger (one JSON line per event) with redaction.
// Never pass request bodies, tokens or user content to it.

const REDACT = /pass|token|secret|authorization|api[-_]?key|cookie|mongo_uri/i;
const isProd = process.env.NODE_ENV === "production";

const redact = (value, depth = 0) => {
  if (value == null || depth > 3) return value;
  if (Array.isArray(value)) return value.slice(0, 10).map((v) => redact(v, depth + 1));
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [
        k,
        REDACT.test(k) ? "[redacted]" : redact(v, depth + 1),
      ])
    );
  }
  if (typeof value === "string") return value.slice(0, 300);
  return value;
};

const write = (level, message, meta = {}) => {
  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...redact(meta),
  };
  const line = JSON.stringify(entry);
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
};

// Turns an Error into safe metadata (stack only outside production).
export const errorMeta = (error) => ({
  error: String(error?.message || error).slice(0, 300),
  code: error?.code,
  status: error?.status || error?.statusCode,
  ...(isProd ? {} : { stack: error?.stack }),
});

export const logger = {
  info: (message, meta) => write("info", message, meta),
  warn: (message, meta) => write("warn", message, meta),
  error: (message, meta) => write("error", message, meta),
};

export default logger;
