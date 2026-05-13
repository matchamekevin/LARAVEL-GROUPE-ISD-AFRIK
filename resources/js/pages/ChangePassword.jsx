import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { getApiBase } from "../utils/apiBase";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/profile.css";

export default function ChangePassword() {
  usePageMeta(
    "Changer mon mot de passe | Groupe ISD AFRIK",
    "Sécurisez votre compte en mettant à jour votre mot de passe sur votre espace client ISD AFRIK."
  );

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const API_BASE = getApiBase();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      setLoading(true);

      const res = await axios.post(
        `${API_BASE}/api/auth/change-password`,
        {
          old: oldPassword,
          new: newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
            Accept: "application/json",
          },
        }
      );

      setSuccess(res.data.message);

      setTimeout(() => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.dispatchEvent(new Event("userUpdated"));
        navigate("/login");
      }, 1500);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Erreur lors du changement du mot de passe"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page-wrapper premium-page">
      <div className="profile-container" style={{ maxWidth: '500px' }}>
        <div className="profile-card">
          <div className="profile-card-head">
            <h2><i className="fas fa-key"></i> Changer mon mot de passe</h2>
          </div>

          <form onSubmit={handleSubmit} className="profile-form-layout">
            <div className="profile-info-item" style={{ marginBottom: '15px', background: 'transparent' }}>
              <span>Ancien mot de passe</span>
              <input
                type={show ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left' }}
              />
            </div>

            <div className="profile-info-item" style={{ marginBottom: '15px', background: 'transparent' }}>
              <span>Nouveau mot de passe</span>
              <input
                type={show ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="btn-secondary"
                style={{ width: '100%', padding: '12px', textAlign: 'left' }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', padding: '0 10px' }}>
              <input
                type="checkbox"
                id="show-password"
                checked={show}
                onChange={() => setShow(!show)}
                style={{ cursor: 'pointer', width: '18px', height: '18px' }}
              />
              <label htmlFor="show-password" style={{ cursor: 'pointer', fontSize: '0.9rem', color: '#64748b' }}>
                Afficher les mots de passe
              </label>
            </div>

            {error && (
              <div style={{ background: '#fef2f2', color: '#dc2626', padding: '12px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #fee2e2' }}>
                <i className="fas fa-exclamation-circle"></i> {error}
              </div>
            )}
            
            {success && (
              <div style={{ background: '#ecfdf5', color: '#10b981', padding: '12px', borderRadius: '10px', marginBottom: '20px', border: '1px solid #d1fae5' }}>
                <i className="fas fa-check-circle"></i> {success}
              </div>
            )}

            <div className="profile-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
                style={{ flex: 1 }}
              >
                {loading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync-alt"></i>}
                <span>{loading ? "Modification..." : "Mettre à jour"}</span>
              </button>

              <button
                type="button"
                onClick={() => navigate("/profile")}
                className="btn-secondary"
              >
                Annuler
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
