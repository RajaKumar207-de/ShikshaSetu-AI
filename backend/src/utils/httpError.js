// Errors that are safe to show to the user (message + status).
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
    this.expose = true;
  }
}

export const badRequest = (message) => new HttpError(400, message);
export const unauthorized = (message = "Please sign in again") =>
  new HttpError(401, message);
export const forbidden = (message = "You do not have permission for this action") =>
  new HttpError(403, message);
export const notFound = (message = "Not found") => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);

// Rejects if `promise` takes longer than `ms`.
export const withTimeout = (promise, ms, label = "Request") => {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      const error = new Error(`${label} timed out after ${ms}ms`);
      error.code = "ETIMEDOUT";
      reject(error);
    }, ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
};

// Maps failures of external services (Gemini / Sarvam) to a safe response.
export const externalServiceFailure = (error, serviceName = "The AI service") => {
  const text = String(error?.message || "").toLowerCase();
  const status = error?.status || error?.statusCode;

  if (error?.code === "ETIMEDOUT" || /timed? ?out|abort/.test(text)) {
    return { status: 504, message: `${serviceName} is taking too long. Please try again.` };
  }
  if (status === 429 || /quota|rate.?limit|resource.?exhausted|too many/.test(text)) {
    return { status: 503, message: `${serviceName} is busy right now. Please try again in a minute.` };
  }
  if (status === 401 || status === 403) {
    // Misconfiguration: don't tell users, the log has the detail.
    return { status: 503, message: `${serviceName} is temporarily unavailable.` };
  }
  return { status: 502, message: `${serviceName} could not respond. Please try again.` };
};
