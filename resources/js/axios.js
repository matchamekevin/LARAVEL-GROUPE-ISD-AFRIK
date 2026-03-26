import axios from "axios";
import { getApiBase } from "./utils/apiBase";

function normalizeApiBase(raw) {
  if (!raw) return '';
  return String(raw).replace(/\/$/, '');
}

const apiBase = normalizeApiBase(getApiBase());
const computedBase = apiBase ? `${apiBase.replace(/\/$/, '')}/api` : '/api';

const api = axios.create({
  baseURL: computedBase,
  timeout: 30000, // 30s timeout in case of slow prod responses
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("adminToken") || localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    try {
      const cfg = err?.config || {};
      const url = cfg.url || cfg.baseURL || 'unknown';
      console.error('API request failed', { url, message: err.message, code: err.code, status: err?.response?.status });
    } catch (e) {
      // ignore logging errors
    }

    // simple retry/backoff for network timeouts or missing response
    const config = err.config || {};
    if (!config) return Promise.reject(err);
    config.__retryCount = config.__retryCount || 0;
    const shouldRetry = (err.code === 'ECONNABORTED' || !err.response) && config.__retryCount < 2;
    if (shouldRetry) {
      config.__retryCount += 1;
      const delay = 500 * config.__retryCount; // 500ms, 1s
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() => api(config));
    }

    return Promise.reject(err);
  }
);

export default api;
