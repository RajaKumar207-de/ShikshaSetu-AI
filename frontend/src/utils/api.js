import axios from "axios";
import { API_URL } from "../config";

export const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

export const getCurrentUser = () => {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
};

export const isLoggedIn = () => Boolean(getToken());

// Axios instance that attaches the JWT when one exists.
// 45s: slightly above the server's own AI timeout, so a hung request
// always ends with a clear error instead of spinning forever.
const api = axios.create({ baseURL: API_URL, timeout: 45_000 });

api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

// Expired / revoked session: clear it and send the student to sign in.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && getToken()) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      } catch {
        // ignore
      }
      if (window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    return Promise.reject(error);
  }
);
