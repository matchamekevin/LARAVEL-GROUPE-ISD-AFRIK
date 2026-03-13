import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000/api/auth",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
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