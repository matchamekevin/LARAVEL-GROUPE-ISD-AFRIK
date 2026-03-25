import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";

function formatDate(value) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponible";
  return date.toLocaleDateString("fr-FR");
}

function formatDateTime(value) {
  if (!value) return "Non disponible";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Non disponible";
  return date.toLocaleString("fr-FR");
}

function formatMoney(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

export default function Profile() {
  const [utilisateur, setUtilisateur] = useState(null);
  const [preview, setPreview] = useState(null);
  const API_BASE = (() => {
    if (typeof window !== "undefined") {
      const { protocol, hostname } = window.location;
      if (["localhost", "127.0.0.1"].includes(hostname)) {
        return `${protocol}//${hostname}:8000`;
      }
      if (import.meta.env.VITE_API_BASE) {
        const envBase = import.meta.env.VITE_API_BASE.replace(/\/$/, "");
        const envLooksLocal = /localhost|127\.0\.0\.1/i.test(envBase);
        const hostIsLocal = ["localhost", "127.0.0.1"].includes(hostname);
        if (!envLooksLocal || hostIsLocal) return envBase;
      }
      return window.location.origin;
    }
    return "";
  })();
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
      : "/default-avatar.webp");

  const formations = Array.isArray(utilisateur.formations) ? utilisateur.formations : [];
  const produits = Array.isArray(utilisateur.produits) ? utilisateur.produits : [];
  const commandes = Array.isArray(utilisateur.commandes) ? utilisateur.commandes : [];
  const totalFormationAmount = formations.reduce((sum, item) => sum + Number(item.prix || 0), 0);

  return (
    <div className="profile-container">
      <section className="profile-hero">
        <div className="profile-hero-grid">
          <div className="profile-hero-main">
            <div className="avatar-block">
              <label htmlFor="avatar-upload" className="avatar-label" title="Changer la photo de profil">
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
              <p className="profile-chip">Espace personnel</p>
              <h1>Mon Profil</h1>
              <p className="welcome">
                Bienvenue, <span>{utilisateur.nom} {utilisateur.prenom}</span>
              </p>
            </div>
          </div>

          <div className="profile-hero-metrics">
            <article className="metric-card">
              <p>Formations</p>
              <strong>{formations.length}</strong>
              <span>Inscriptions actives</span>
            </article>
            <article className="metric-card">
              <p>Produits</p>
              <strong>{produits.length}</strong>
              <span>Éléments enregistrés</span>
            </article>
            <article className="metric-card">
              <p>Commandes</p>
              <strong>{commandes.length}</strong>
              <span>Historique client</span>
            </article>
            <article className="metric-card">
              <p>Budget formations</p>
              <strong>{formatMoney(totalFormationAmount)}</strong>
              <span>Volume total</span>
            </article>
          </div>
        </div>
      </section>

      <section className="profile-card profile-card--identity">
        <div className="profile-card-head">
          <h2>Informations personnelles</h2>
          <span className="profile-role-badge">{utilisateur.role || "client"}</span>
        </div>
        <div className="profile-info-grid">
          <article className="profile-info-item">
            <span>Nom complet</span>
            <strong>{utilisateur.nom} {utilisateur.prenom}</strong>
          </article>
          <article className="profile-info-item">
            <span>Email</span>
            <strong>{utilisateur.email || "Non disponible"}</strong>
          </article>
          <article className="profile-info-item">
            <span>Téléphone</span>
            <strong>{utilisateur.telephone || "Non disponible"}</strong>
          </article>
          <article className="profile-info-item">
            <span>Date de création</span>
            <strong>{formatDate(utilisateur.created_at)}</strong>
          </article>
          <article className="profile-info-item">
            <span>Dernière connexion</span>
            <strong>{formatDateTime(utilisateur.last_login)}</strong>
          </article>
        </div>
      </section>

      <section className="profile-card">
        <div className="profile-card-head">
          <h2>Mes Formations</h2>
          <span className="section-meta">{formations.length} élément(s)</span>
        </div>
        {formations.length > 0 ? (
          <div className="formation-grid">
            {formations.map((f) => (
              <div key={f.id_formation} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-graduation-cap icon"></i>
                  <h3>{f.titre}</h3>
                </div>
                <p className="formation-description">{f.description}</p>
                <div className="formation-details">
                  <span><strong>Début :</strong> {formatDate(f.date_debut)}</span>
                  <span><strong>⏱ Durée :</strong> {f.duree}h</span>
                  <span><strong>Prix :</strong> {formatMoney(f.prix)}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucune formation enregistrée.</p>
        )}
      </section>

      <section className="profile-card">
        <div className="profile-card-head">
          <h2>Mes Produits</h2>
          <span className="section-meta">{produits.length} élément(s)</span>
        </div>
        {produits.length > 0 ? (
          <div className="formation-grid">
            {produits.map((p) => (
              <div key={p.id} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-box icon"></i>
                  <h3>{p.nom}</h3>
                </div>
                <div className="formation-details">
                  <span><strong>Prix :</strong> {formatMoney(p.prix)}</span>
                  <span><strong>Référence :</strong> #{p.id}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucun produit enregistré.</p>
        )}
      </section>

      <section className="profile-card">
        <div className="profile-card-head">
          <h2>Mes Commandes</h2>
          <span className="section-meta">{commandes.length} élément(s)</span>
        </div>
        {commandes.length > 0 ? (
          <div className="formation-grid">
            {commandes.map((c) => (
              <div key={c.id} className="formation-box">
                <div className="formation-header">
                  <i className="fas fa-file-invoice icon"></i>
                  <h3>Commande #{c.id}</h3>
                </div>
                <div className="formation-details">
                  <span><strong>Date :</strong> {formatDate(c.created_at)}</span>
                  <span><strong>Statut :</strong> {c.status || "En attente"}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-formation">Aucune commande enregistrée.</p>
        )}
      </section>

      <section className="profile-actions">
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
      </section>
    </div>
  );
}
