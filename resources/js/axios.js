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
  timeout: 15000, // 15s timeout to avoid hanging requests in prod
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
    return Promise.reject(err);
  }
);

export default api;
