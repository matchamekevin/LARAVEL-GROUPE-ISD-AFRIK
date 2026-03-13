import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

export default function Profile() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [preview, setPreview] = useState(null);
  const API_BASE = "http://localhost:8000";
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get(`${API_BASE}/api/auth/profile`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      })
      .then((res) => setUtilisateur(res.data))
      .catch((err) => console.error("Erreur API :", err));
  }, []);

  // ✅ Upload avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("avatar", file);

    axios
      .post(`${API_BASE}/api/auth/update-avatar`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "multipart/form-data",
        },
      })
      .then((res) => {
        setUtilisateur({ ...utilisateur, avatar: res.data.avatar });
      })
      .catch((err) => console.error("Erreur upload avatar :", err));
  };

  // ✅ Actions
  const handleEditProfile = () => navigate("/profile/edit");
  const handleChangePassword = () => navigate("/profile/password");

  const handleDeleteAccount = async () => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ?")) {
      try {
        await axios.delete(`${API_BASE}/api/auth/delete-account`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        });
        localStorage.removeItem("token");
        navigate("/register");
      } catch (err) {
        console.error("Erreur suppression :", err);
      }
    }
  };

  const handleLogout = async () => {
    try {
      await axios.post(`${API_BASE}/api/auth/logout`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      localStorage.removeItem("token");
      navigate("/login");
    } catch (err) {
      console.error("Erreur déconnexion :", err);
    }
  };

  if (!utilisateur) {
    return <div className="profile-container">Chargement du profil...</div>;
  }

  const avatarSrc =
    preview ||
    (utilisateur.avatar
      ? `${API_BASE}/storage/${utilisateur.avatar}`
      : "/default-avatar.png");

  return (
    <div className="profile-container">
      {/* En-tête */}
      <div className="profile-header">
        <div className="avatar-block">
          <label htmlFor="avatar-upload" className="avatar-label">
            <img
              src={avatarSrc}
              alt="Avatar"
              className="profile-avatar clickable"
            />
            <span className="avatar-edit-hint">Cliquer pour changer</span>
          </label>
          <input
            id="avatar-upload"
            type="file"
            name="avatar"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleAvatarChange}
          />
          <button
            className="btn-primary btn-avatar"
            onClick={() => document.getElementById("avatar-upload").click()}
          >
            Changer la photo
          </button>
        </div>

        <div className="header-texts">
          <h1>Mon Profil</h1>
          <p className="welcome">
            Bienvenue, <span>{utilisateur.nom} {utilisateur.prenom}</span>
          </p>
        </div>
      </div>

      {/* Infos personnelles */}
      <div className="profile-card">
        <h2>Informations personnelles</h2>
        <div className="profile-info-grid">
          <p><strong>Nom :</strong> {utilisateur.nom} {utilisateur.prenom}</p>
          <p><strong>Email :</strong> {utilisateur.email}</p>
          <p><strong>Téléphone :</strong> {utilisateur.telephone}</p>
          {utilisateur.role !== "client" && (
            <p><strong>Rôle :</strong> {utilisateur.role}</p>
          )}
          <p><strong>Date de création :</strong> {new Date(utilisateur.created_at).toLocaleDateString()}</p>
          {utilisateur.last_login && (
            <p><strong>Dernière connexion :</strong> {new Date(utilisateur.last_login).toLocaleString()}</p>
          )}
        </div>
      </div>

      {/* Formations */}
      <div className="profile-card">
        <h2>Mes Formations 🎓</h2>
        {Array.isArray(utilisateur.formations) && utilisateur.formations.length > 0 ? (
          <div className="formation-grid">
            {utilisateur.formations.map((f) => (
              <div key={f.id_formation} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-graduation-cap icon"></i>
                  <h3>{f.titre}</h3>
                </div>
                <p className="formation-description">{f.description}</p>
                <div className="formation-details">
                  <span><strong>📅 Début :</strong> {new Date(f.date_debut).toLocaleDateString()}</span>
                  <span><strong>⏱ Durée :</strong> {f.duree}h</span>
                  <span><strong>💰 Prix :</strong> {parseInt(f.prix).toLocaleString()} FCFA</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucune formation enregistrée.</p>
        )}
      </div>

      {/* Produits */}
      <div className="profile-card">
        <h2>Mes Produits 📦</h2>
        {Array.isArray(utilisateur.produits) && utilisateur.produits.length > 0 ? (
          <div className="formation-grid">
            {utilisateur.produits.map((p) => (
              <div key={p.id} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-box icon"></i>
                  <h3>{p.nom}</h3>
                </div>
                <div className="formation-details">
                  <span><strong>💰 Prix :</strong> {parseInt(p.prix).toLocaleString()} FCFA</span>
                  <span><strong>📦 Référence :</strong> #{p.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucun produit enregistré.</p>
        )}
      </div>

      {/* Commandes */}
      <div className="profile-card">
        <h2>Mes Commandes 🧾</h2>
        {Array.isArray(utilisateur.commandes) && utilisateur.commandes.length > 0 ? (
          <div className="formation-grid">
            {utilisateur.commandes.map((c) => (
              <div key={c.id} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-file-invoice icon"></i>
                  <h3>Commande #{c.id}</h3>
                </div>
                <div className="formation-details">
                  <span><strong>📅 Date :</strong> {new Date(c.created_at).toLocaleDateString()}</span>
                  <span><strong>📌 Statut :</strong> {c.status}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucune commande enregistrée.</p>
        )}
      </div>

      {/* Actions */}
      <div className="profile-actions">
        <button className="btn-primary" onClick={handleEditProfile}>
          Modifier mon profil
        </button>
        <button className="btn-secondary" onClick={handleChangePassword}>
          Changer mon mot de passe
        </button>
        <button className="btn-danger" onClick={handleDeleteAccount}>
          Supprimer mon compte
        </button>
        <button className="btn-logout" onClick={handleLogout}>
          Déconnexion
        </button>
      </div>
    </div>
  );
}
