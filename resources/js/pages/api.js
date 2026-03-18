import axios from "axios";

const apiBase = (() => {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    if (import.meta.env.VITE_API_BASE) {
      const envBase = import.meta.env.VITE_API_BASE.replace(/\/$/, "");
      const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
      const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);
      if (!envLooksLocal || hostIsLocal) return envBase;
    }
    if (["localhost", "127.0.0.1"].includes(hostname)) return `${protocol}//${hostname}:8000`;
    return window.location.origin;
  }
  if (import.meta.env.VITE_API_BASE) return import.meta.env.VITE_API_BASE.replace(/\/$/, "");
  return "";
})();

const api = axios.create({
  baseURL: `${apiBase}/api/auth`,
  headers: {
    Authorization: `Bearer ${typeof window !== "undefined" ? localStorage.getItem("token") : ""}`,
  },
});

// Récupérer profil
export const getProfile = async () => {
  const res = await api.get("/profile");
  return res.data;
};

// Mettre à jour profil
export const updateProfile = async (data) => {
  const res = await api.put("/update-profile", data);
  return res.data;
};

// Changer mot de passe
export const changePassword = async (data) => {
  const res = await api.post("/change-password", data);
  return res.data;
};

// Déconnexion
export const logout = async () => {
  const res = await api.post("/logout");
  return res.data;
};

// Supprimer compte
export const deleteAccount = async () => {
  const res = await api.delete("/delete-account");
  return res.data;
};