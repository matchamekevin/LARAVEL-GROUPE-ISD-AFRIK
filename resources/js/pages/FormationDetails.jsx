import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/formationDetails.css";

const FormationDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [formation, setFormation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    axios
      .get(`http://localhost:8000/api/formations/${id}`)
      .then((res) => {
        console.log("Formation reçue:", res.data);
        setFormation(res.data);
      })
      .catch((err) => {
        console.error("Erreur:", err);
        setError("Formation non trouvée");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleInscription = () => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      navigate(`/formations/${id}/register`);
    }
  };

  // ✅ Fonction pour obtenir l'URL de l'image
  const getImageUrl = () => {
    if (formation?.images && formation.images.length > 0) {
      return formation.images[0].url;
    }
    return "http://localhost:8000/images/default-formation.jpg";
  };

  if (loading) {
    return (
      <div className="formation-details-loading">
        <div className="spinner"></div>
        <p>Chargement des détails...</p>
      </div>
    );
  }

  if (error || !formation) {
    return (
      <div className="formation-details-error">
        <h2>❌ Erreur</h2>
        <p>{error || "Formation non trouvée"}</p>
        <button className="btn-back-error" onClick={() => navigate(-1)}>
          ← Retour
        </button>
      </div>
    );
  }

  return (
    <div className="formation-details-page">
      <div className="formation-details-container">
        <button className="btn-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Retour
        </button>

        <div className="formation-details-header">
          <div className="formation-details-image-container">
            <img
              src={getImageUrl()}
              alt={formation.titre}
              className="formation-details-image"
              onError={(e) => {
                e.target.src = 'http://localhost:8000/images/default-formation.jpg';
              }}
            />
          </div>
          <div className="formation-details-info">
            <h1>{formation.titre}</h1>
            <div className="formation-meta">
              <span className="badge-categorie">{formation.categorie}</span>
              {formation.niveau && <span className="badge-niveau">{formation.niveau}</span>}
            </div>
          </div>
        </div>

        <div className="formation-details-body">
          {/* DESCRIPTION */}
          {formation.description && (
            <div className="formation-details-section">
              <h2>📋 Description</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.description}</p>
            </div>
          )}

          {/* BÉNÉFICES */}
          {formation.benefices && (
            <div className="formation-details-section">
              <h2>✨ Bénéfices</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.benefices}</p>
            </div>
          )}

          {/* OBJECTIFS */}
          {formation.objectifs && (
            <div className="formation-details-section">
              <h2>🎯 Objectifs pédagogiques</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.objectifs}</p>
            </div>
          )}

          {/* PROGRAMME */}
          {formation.programme && (
            <div className="formation-details-section">
              <h2>📚 Programme détaillé</h2>
              <div className="programme-content">
                <p style={{ whiteSpace: 'pre-line' }}>{formation.programme}</p>
              </div>
            </div>
          )}

          {/* PUBLIC CIBLE */}
          {formation.public_cible && (
            <div className="formation-details-section">
              <h2>👥 Public cible</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.public_cible}</p>
            </div>
          )}

          {/* PRÉREQUIS */}
          {formation.prerequis && (
            <div className="formation-details-section">
              <h2>✅ Prérequis</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.prerequis}</p>
            </div>
          )}

          {/* MÉTHODES PÉDAGOGIQUES */}
          {formation.methodes_pedagogiques && (
            <div className="formation-details-section">
              <h2>🎓 Méthodes pédagogiques</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.methodes_pedagogiques}</p>
            </div>
          )}

          {/* OUTILS PÉDAGOGIQUES */}
          {formation.outils_pedagogiques && (
            <div className="formation-details-section">
              <h2>🛠️ Outils pédagogiques</h2>
              <p style={{ whiteSpace: 'pre-line' }}>{formation.outils_pedagogiques}</p>
            </div>
          )}

          {/* INFORMATIONS PRATIQUES */}
          <div className="formation-details-section info-pratiques">
            <h2>📊 Informations pratiques</h2>
            <div className="info-grid">
              <div className="info-item">
                <i className="fas fa-clock"></i>
                <div>
                  <strong>Durée</strong>
                  <p>{formation.duree} heures</p>
                </div>
              </div>
              <div className="info-item">
                <i className="fas fa-money-bill-wave"></i>
                <div>
                  <strong>Prix</strong>
                  <p>{parseInt(formation.prix).toLocaleString()} FCFA</p>
                </div>
              </div>
              {formation.niveau && (
                <div className="info-item">
                  <i className="fas fa-signal"></i>
                  <div>
                    <strong>Niveau</strong>
                    <p>{formation.niveau}</p>
                  </div>
                </div>
              )}
              {formation.certification && (
                <div className="info-item">
                  <i className="fas fa-certificate"></i>
                  <div>
                    <strong>Certification</strong>
                    <p>{formation.certification}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* BOUTON D'INSCRIPTION */}
          <div className="formation-cta">
            <button className="btn-inscrire-details" onClick={handleInscription}>
              <i className="fas fa-check-circle"></i> S'inscrire à cette formation
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormationDetails;