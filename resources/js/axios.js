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
    const isCancelled = axios.isCancel(err);
    const isAborted = err.code === 'ECONNABORTED';
    const isNetworkError = !err.response && !isCancelled;

    try {
      const cfg = err?.config || {};
      const url = cfg.url || cfg.baseURL || 'unknown';
      if (!isCancelled) {
        console.error(`API request failed [${err.code || 'ERROR'}]`, {
          url,
          message: err.message,
          status: err?.response?.status,
          isAborted,
          isNetworkError
        });
      }
    } catch (e) {
      // ignore logging errors
    }

    // simple retry/backoff for network timeouts or missing response
    const config = err.config || {};
    if (!config || isCancelled) return Promise.reject(err);

    // Only retry on true timeouts or network failures, not on every aborted request
    // (ECONNABORTED with timeout message is a timeout, otherwise it might be a manual abort)
    const isTimeout = isAborted && err.message?.toLowerCase().includes('timeout');
    const shouldRetry = (isTimeout || isNetworkError) && (config.__retryCount || 0) < 2;

    if (shouldRetry) {
      config.__retryCount = (config.__retryCount || 0) + 1;
      const delay = 1000 * config.__retryCount; // 1s, 2s
      console.warn(`Retrying request (${config.__retryCount}/2) in ${delay}ms...`, config.url);
      return new Promise((resolve) => setTimeout(resolve, delay)).then(() => api(config));
    }

    return Promise.reject(err);
  }
);

export default api;
