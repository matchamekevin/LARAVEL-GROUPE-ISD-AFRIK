import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Loader from "../components/Loader";
import { getApiBase } from "../utils/apiBase";
import usePageMeta from "../hooks/usePageMeta";
import { notifyMutation } from "../utils/mutationBus";
import { toastError, toastSuccess } from "../utils/toast";
import "../styles/profile.css";

export default function EditProfile() {
  usePageMeta(
    "Modifier mon profil | Groupe ISD AFRIK",
    "Mettez à jour vos informations personnelles sur votre espace client ISD AFRIK."
  );

  const API_BASE = getApiBase();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    nom: "",
    prenom: "",
    email: "",
    telephone: "",
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => {
        const user = res.data?.user || res.data;
        setForm({
          nom: user.nom || "",
          prenom: user.prenom || "",
          email: user.email || "",
          telephone: user.telephone || "",
        });
      })
      .catch(() => toastError("Impossible de charger le profil"));
  }, [API_BASE]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API_BASE}/api/auth/update-profile`, form, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      
      // Update local storage if user info is stored there
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const user = JSON.parse(storedUser);
        localStorage.setItem("user", JSON.stringify({ ...user, ...form }));
        window.dispatchEvent(new Event("userUpdated"));
      }

      toastSuccess("Profil mis à jour avec succès !");
      notifyMutation();
      navigate("/profile");
    } catch {
      toastError("Erreur lors de la mise à jour du profil");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper premium-page">
      <div className="profile-container" style={{ maxWidth: '600px' }}>
        <div className="profile-card">
          <div className="profile-card-head">
            <h2><i className="fas fa-user-edit"></i> Modifier mon profil</h2>
          </div>

          <form onSubmit={handleSubmit} className="profile-form-layout">
            <div className="profile-info-item" style={{ marginBottom: '15px', background: 'transparent' }}>
              <span>Nom</span>
              <input
                type="text"
                name="nom"
                value={form.nom}
                onChange={handleChange}
                required
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left', fontWeight: '500' }}
              />
            </div>

            <div className="profile-info-item" style={{ marginBottom: '15px', background: 'transparent' }}>
              <span>Prénom</span>
              <input
                type="text"
                name="prenom"
                value={form.prenom}
                onChange={handleChange}
                required
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left', fontWeight: '500' }}
              />
            </div>

            <div className="profile-info-item" style={{ marginBottom: '15px', background: 'transparent' }}>
              <span>Email</span>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left', fontWeight: '500' }}
              />
            </div>

            <div className="profile-info-item" style={{ marginBottom: '20px', background: 'transparent' }}>
              <span>Téléphone</span>
              <input
                type="text"
                name="telephone"
                value={form.telephone || ""}
                onChange={handleChange}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left', fontWeight: '500' }}
              />
            </div>

            <div className="profile-actions" style={{ marginTop: '20px' }}>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                {loading ? <Loader variant="inline" size="sm" /> : <i className="fas fa-save"></i>}
                <span>{loading ? "Enregistrement..." : "Enregistrer"}</span>
              </button>
              <button type="button" onClick={() => navigate("/profile")} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
