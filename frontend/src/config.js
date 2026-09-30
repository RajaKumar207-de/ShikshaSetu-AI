const raw = import.meta.env.VITE_API_URL || "http://localhost:5000";

// Base URL of the backend, without a trailing slash.
export const API_URL = raw.replace(/\/+$/, "");
