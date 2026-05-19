import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../styles/profile.css";
import { getApiBase } from "../utils/apiBase";
import usePageMeta from "../hooks/usePageMeta";
import { notifyMutation } from "../utils/mutationBus";
import { toastError, toastSuccess } from "../utils/toast";
import tokenService from "../services/tokenService";

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
  usePageMeta(
    "Mon Profil | Groupe ISD AFRIK",
    "Gérez vos informations personnelles, consultez vos formations et suivez vos commandes sur votre espace client ISD AFRIK."
  );

  const [utilisateur, setUtilisateur] = useState(null);
  const [preview, setPreview] = useState(null);
  const API_BASE = getApiBase();
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
  }, [API_BASE]);

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
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) return;
    try {
      await axios.delete(`${API_BASE}/api/auth/delete-account`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          Accept: "application/json",
        },
      });
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      toastSuccess("Compte supprimé avec succès");
      notifyMutation();
      navigate("/register");
    } catch (err) {
      console.error("Erreur suppression :", err);
      toastError("Erreur lors de la suppression du compte");
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
    } catch (err) {
      console.error("Erreur déconnexion :", err);
    }
    tokenService.clearSession();
    window.dispatchEvent(new Event("userUpdated"));
    navigate("/login");
  };

  if (!utilisateur) return null;

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
    <div className="profile-page-wrapper premium-page">
      <div className="profile-container">
        {/* HERO SECTION */}
        <section className="profile-hero">
          <div className="profile-hero-grid">
            <div className="profile-hero-main">
              <div className="avatar-block">
                <label htmlFor="avatar-upload" className="avatar-label" title="Changer la photo de profil">
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="profile-avatar"
                  />
                  <span className="avatar-edit-hint">
                    <i className="fas fa-camera"></i> Modifier
                  </span>
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
                  className="btn-avatar"
                  onClick={() => document.getElementById("avatar-upload").click()}
                >
                  <i className="fas fa-upload"></i> Photo
                </button>
              </div>

              <div className="header-texts">
                <p className="profile-chip">Espace Client Sécurisé</p>
                <h1>Mon Profil</h1>
                <p className="welcome">
                  Heureux de vous revoir, <span>{utilisateur.nom} {utilisateur.prenom}</span>
                </p>
              </div>
            </div>

            <div className="profile-hero-metrics">
              <article className="metric-card">
                <p>Formations</p>
                <strong>{formations.length}</strong>
                <span>Inscriptions</span>
              </article>
              <article className="metric-card">
                <p>Produits</p>
                <strong>{produits.length}</strong>
                <span>Articles</span>
              </article>
              <article className="metric-card">
                <p>Commandes</p>
                <strong>{commandes.length}</strong>
                <span>Historique</span>
              </article>
              <article className="metric-card">
                <p>Total Investi</p>
                <strong>{formatMoney(totalFormationAmount)}</strong>
                <span>Formations</span>
              </article>
            </div>
          </div>
        </section>

        {/* IDENTITY CARD */}
        <section className="profile-card">
          <div className="profile-card-head">
            <h2><span className="material-icons" style={{fontSize:22,verticalAlign:'middle',marginRight:8}}>account_circle</span> Informations personnelles</h2>
            <span className="profile-role-badge">{utilisateur.role || "client"}</span>
          </div>
          <div className="profile-info-grid">
            <article className="profile-info-item">
              <span>Nom complet</span>
              <strong>{utilisateur.nom} {utilisateur.prenom}</strong>
            </article>
            <article className="profile-info-item">
              <span>Email</span>
              <strong>{utilisateur.email || "Non renseigné"}</strong>
            </article>
            <article className="profile-info-item">
              <span>Téléphone</span>
              <strong>{utilisateur.telephone || "Non renseigné"}</strong>
            </article>
            <article className="profile-info-item">
              <span>Date d'inscription</span>
              <strong>{formatDate(utilisateur.created_at)}</strong>
            </article>
            <article className="profile-info-item">
              <span>Dernière connexion</span>
              <strong>{formatDateTime(utilisateur.last_login)}</strong>
            </article>
            <article className="profile-info-item">
              <span>Statut Compte</span>
              <strong style={{ color: '#10b981' }}>{utilisateur.statut || "Actif"}</strong>
            </article>
          </div>
        </section>

        {/* FORMATIONS */}
        <section className="profile-card">
          <div className="profile-card-head">
            <h2><span className="material-icons" style={{fontSize:22,verticalAlign:'middle',marginRight:8}}>school</span> Mes Formations</h2>
            <span className="section-meta">{formations.length} formation(s)</span>
          </div>
          {formations.length > 0 ? (
            <div className="formation-grid">
              {formations.map((f) => (
                <div key={f.id_formation} className="formation-box">
                  <div className="formation-header">
                    <i className="fas fa-certificate icon"></i>
                    <h3>{f.titre}</h3>
                  </div>
                  <p className="formation-description">{f.description}</p>
                  <div className="formation-details">
                    <span><strong>Début :</strong> {formatDate(f.date_debut)}</span>
                    <span><strong>Durée :</strong> {f.duree}h</span>
                    <span><strong>Prix :</strong> {formatMoney(f.prix)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-formation">
              <i className="fas fa-info-circle fa-2x" style={{ marginBottom: '10px' }}></i>
              <p>Vous n'avez pas encore de formation enregistrée.</p>
            </div>
          )}
        </section>

        {/* PRODUITS */}
        <section className="profile-card">
          <div className="profile-card-head">
            <h2><span className="material-icons" style={{fontSize:22,verticalAlign:'middle',marginRight:8}}>inventory</span> Mes Produits</h2>
            <span className="section-meta">{produits.length} produit(s)</span>
          </div>
          {produits.length > 0 ? (
            <div className="formation-grid">
              {produits.map((p) => (
                <div key={p.id} className="formation-box">
                  <div className="formation-header">
                    <i className="fas fa-tag icon"></i>
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
            <div className="no-formation">
               <i className="fas fa-shopping-bag fa-2x" style={{ marginBottom: '10px' }}></i>
               <p>Aucun produit dans votre catalogue personnel.</p>
            </div>
          )}
        </section>

        {/* COMMANDES */}
        <section className="profile-card">
          <div className="profile-card-head">
            <h2><span className="material-icons" style={{fontSize:22,verticalAlign:'middle',marginRight:8}}>receipt_long</span> Mes Commandes</h2>
            <span className="section-meta">{commandes.length} commande(s)</span>
          </div>
          {commandes.length > 0 ? (
            <div className="formation-grid">
              {commandes.map((c) => (
                <div key={c.id} className="formation-box">
                  <div className="formation-header">
                    <i className="fas fa-receipt icon"></i>
                    <h3>Commande #{c.id}</h3>
                  </div>
                  <div className="formation-details">
                    <span><strong>Date :</strong> {formatDate(c.created_at)}</span>
                    <span><strong>Statut :</strong> <strong style={{ color: c.status === 'Payé' ? '#10b981' : '#f59e0b' }}>{c.status || "En attente"}</strong></span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-formation">
               <i className="fas fa-history fa-2x" style={{ marginBottom: '10px' }}></i>
               <p>Aucun historique de commande disponible.</p>
            </div>
          )}
        </section>

        {/* ACTIONS SECTION */}
        <section className="profile-actions">
          <button className="btn-primary" onClick={handleEditProfile}>
            <span className="material-icons" style={{fontSize:18,verticalAlign:'middle',marginRight:8}}>edit</span> Modifier mon profil
          </button>
          <button className="btn-secondary" onClick={handleChangePassword}>
            <span className="material-icons" style={{fontSize:18,verticalAlign:'middle',marginRight:8}}>key</span> Changer mon mot de passe
          </button>
          <button className="btn-logout" onClick={handleLogout}>
            <span className="material-icons" style={{fontSize:18,verticalAlign:'middle',marginRight:8}}>logout</span> Déconnexion
          </button>
          <button className="btn-danger" onClick={handleDeleteAccount}>
            <span className="material-icons" style={{fontSize:18,verticalAlign:'middle',marginRight:8}}>delete</span> Supprimer mon compte
          </button>
        </section>
      </div>
    </div>
  );
}
