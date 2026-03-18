import axios from "axios";

const getBaseUrl = () => {
  // Prioritise the older `VITE_API_BASE` (used in some builds), then the newer `VITE_API_BASE_URL`.
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/$/, '') + '/api';
  }

  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL.replace(/\/$/, '');
  }

  if (typeof window !== "undefined") {
    const { protocol, hostname, port } = window.location;

    if (["localhost", "127.0.0.1"].includes(hostname) && port && port !== "8000") {
      return `${protocol}//${hostname}:8000/api`;
    }

    return `${window.location.origin}/api`;
  }

  return "http://127.0.0.1:8000/api";
};

const api = axios.create({
  baseURL: getBaseUrl(),
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

export default api;