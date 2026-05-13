/**
 * ⚙️ Configuration Axios avec interceptors pour token Sanctum
 * Gère: Authorization header, erreurs 401/403, retry logic
 */

import axios from 'axios';
import { tokenService } from '../services/tokenService';

// Déterminer la base API
export function resolveApiBase() {
  if (typeof window !== 'undefined') {
    const { protocol, hostname } = window.location;
    if (['localhost', '127.0.0.1'].includes(hostname)) {
      return `${protocol}//${hostname}:8000`;
    }
    if (import.meta.env.VITE_API_BASE) {
      const envBase = import.meta.env.VITE_API_BASE.replace(/\/$/, '');
      const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
      const hostIsLocal = ['localhost', '127.0.0.1'].includes(hostname);
      if (!envLooksLocal || hostIsLocal) return envBase;
    }
    return window.location.origin;
  }
  return '';
}

export const API_BASE = resolveApiBase();

/**
 * Instance Axios configurée avec interceptors
 */
export const apiClient = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * 📤 Interceptor REQUEST - Ajouter le token automatiquement
 */
apiClient.interceptors.request.use(
  (config) => {
    const token = tokenService.getToken();
    config.__hadAuthToken = Boolean(token);

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => {
    console.error('[AxiosConfig] ❌ Erreur interceptor request:', error);
    return Promise.reject(error);
  }
);

/**
 * 📥 Interceptor RESPONSE - Gérer les erreurs 401/403
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const config = error.config;
    const status = error.response?.status;
    const url = config?.url || 'unknown';
    const hadAuthToken = Boolean(config?.__hadAuthToken);
    const isAuthFlowEndpoint = /\/api\/auth\/(login|verify-2fa|resend-2fa)/.test(String(url));

    console.error(`[AxiosConfig] ❌ Erreur Response: ${status} sur ${url}`);
    console.error(`[AxiosConfig] Message:`, error.response?.data?.message);

    // 401 - Token invalide ou expiré
    if (status === 401 && hadAuthToken && !isAuthFlowEndpoint) {
      console.warn(`[AxiosConfig] 🔐 Token invalide (401) - Déconnexion`);
      tokenService.clearSession();
      window.dispatchEvent(new Event('token-expired'));
    }

    // 403 - Accès refusé (compte désactivé, etc)
    if (status === 403 && hadAuthToken && !isAuthFlowEndpoint) {
      console.warn(`[AxiosConfig] 🚫 Accès refusé (403) - Déconnexion`);
      tokenService.clearSession();
      window.dispatchEvent(new Event('access-denied'));
    }

    return Promise.reject(error);
  }
);

export default apiClient;
