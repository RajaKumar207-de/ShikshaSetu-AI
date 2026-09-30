import { randomUUID } from "crypto";
import logger from "../utils/logger.js";

// Assigns a request id and logs one line per finished request.
// Only method, route path, status, duration and ids: never bodies,
// query strings or headers (they can contain private data / tokens).
export const requestLogger = (req, res, next) => {
  req.id = randomUUID();
  res.setHeader("X-Request-Id", req.id);
  const started = Date.now();

  res.on("finish", () => {
    if (req.path === "/api/health") return;
    const status = res.statusCode;
    const meta = {
      requestId: req.id,
      method: req.method,
      path: req.path,
      status,
      ms: Date.now() - started,
      userId: req.user?._id?.toString(),
    };
    if (status === 429) logger.warn("rate limited", { ...meta, ip: req.ip });
    else if (status >= 500) logger.error("request failed", meta);
    else if (status >= 400 && status !== 404) logger.warn("request rejected", meta);
    else logger.info("request", meta);
  });

  next();
};
