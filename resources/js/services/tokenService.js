/**
 * 🔐 Service centralisé pour la gestion des tokens Sanctum
 * Gère: génération, stockage, récupération, suppression, expiration
 */

const TOKEN_KEY = 'token';
const USER_KEY = 'user';
const PAYS_KEY = 'pays';

export const tokenService = {
  /**
   * 📝 Stocker le token en localStorage
   */
  setToken(token) {
    if (!token) {
      console.warn('[TokenService] ⚠️ Tentative de stocker un token vide');
      return false;
    }
    try {
      localStorage.setItem(TOKEN_KEY, token);
      return true;
    } catch (e) {
      console.error('[TokenService] ❌ Erreur stockage token:', e);
      return false;
    }
  },

  /**
   * 🔍 Récupérer le token depuis localStorage
   */
  getToken() {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('[TokenService] ❌ Erreur récupération token:', e);
      return null;
    }
  },

  /**
   * 🗑️ Supprimer le token (déconnexion)
   */
  removeToken() {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(PAYS_KEY);
      return true;
    } catch (e) {
      console.error('[TokenService] ❌ Erreur suppression token:', e);
      return false;
    }
  },

  /**
   * ❓ Vérifier si un token existe
   */
  hasToken() {
    return this.getToken() !== null;
  },

  /**
   * 👤 Stocker les données utilisateur
   */
  setUser(user) {
    if (!user) {
      console.warn('[TokenService] ⚠️ Tentative de stocker un utilisateur vide');
      return false;
    }
    try {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch (e) {
      console.error('[TokenService] ❌ Erreur stockage utilisateur:', e);
      return false;
    }
  },

  /**
   * 👤 Récupérer les données utilisateur
   */
  getUser() {
    try {
      const user = localStorage.getItem(USER_KEY);
      if (user) {
        return JSON.parse(user);
      }
      return null;
    } catch (e) {
      console.error('[TokenService] ❌ Erreur parse utilisateur:', e);
      return null;
    }
  },

  /**
   * 🌍 Stocker le pays
   */
  setPays(paysId) {
    try {
      localStorage.setItem(PAYS_KEY, paysId);
      return true;
    } catch (e) {
      console.error('[TokenService] ❌ Erreur stockage pays:', e);
      return false;
    }
  },

  /**
   * 🌍 Récupérer le pays
   */
  getPays() {
    try {
      return localStorage.getItem(PAYS_KEY);
    } catch (e) {
      console.error('[TokenService] ❌ Erreur récupération pays:', e);
      return null;
    }
  },

  /**
   * 🔄 Nettoyer la session complète
   */
  clearSession() {
    this.removeToken();
  },

  /**
   * 📤 Obtenir le header Authorization
   */
  getAuthHeader() {
    const token = this.getToken();
    if (!token) {
      return {};
    }
    return {
      Authorization: `Bearer ${token}`,
    };
  },

  /**
   * ✅ Vérifier si la session est valide
   */
  isSessionValid() {
    const token = this.getToken();
    const user = this.getUser();

    if (!token || !user) {
      return false;
    }

    // Vérifications de sécurité basiques
    if (!user.can_access_client && !user.is_admin) {
      return false;
    }

    return true;
  },
};

export default tokenService;
