import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/etudiant.css";
import { resolveFormationImageUrl } from "../utils/mediaUrl";

const API_BASE = (() => {
  if (typeof window !== "undefined") {
    const { hostname, origin } = window.location;
    if (["localhost", "127.0.0.1"].includes(hostname)) {
      return origin;
    }
    return import.meta.env.VITE_API_BASE?.replace(/\/$/, "") || origin;
  }
  return "";
})();

const Etudiant = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formations, setFormations] = useState([]);

  // ⚡ Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch(`${API_BASE}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      })
        .then((res) => res.json())
        .then((data) => {
          if (data && (data.user || data.id)) {
            setIsAuthenticated(true);
            localStorage.setItem("user", JSON.stringify(data.user || data));
          } else {
            setIsAuthenticated(false);
          }
        })
        .catch(() => setIsAuthenticated(false));
    }
  }, []);

  // ⚡ Charger uniquement les formations de type "particulier"
  useEffect(() => {
    axios.get(`${API_BASE}/api/formations/type/etudiant`)
      .then((res) => {
        console.log("Formations reçues:", res.data); // 🔍 Pour déboguer
        setFormations(res.data);
      })
      .catch((err) => console.error("Erreur chargement formations:", err));
  }, []);

  // ⚡ Téléchargement catalogue filtré
  const handleDownloadCatalogue = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/formations/catalogue?type=etudiant`);
      if (!response.ok) throw new Error('Erreur téléchargement catalogue');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogue-formations-etudiant-isd-afrik.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erreur téléchargement catalogue:', error);
    }
  };

  // ⚡ Gestion inscription
  const handleInscription = (id_formation) => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
    } else {
      navigate(`/formations/${id_formation}/register`);
    }
  };

  // ⚡ Voir détails
  const handleVoirDetails = (id_formation) => {
    navigate(`/formations/${id_formation}/details`);
  };

  const getImageUrl = (formation) => {
    return resolveFormationImageUrl(formation?.images?.[0]?.url, API_BASE);
  };

  return (
    <div className="etudiant-page">
      <section className="etudiant-hero">
        <h1>Formations pour Etudiant</h1>
        <p>Préparez votre avenir avec des formations certifiantes reconnues par les entreprises.</p>
        
        {/* ✅ BOUTON DE RETOUR */}
        <button 
          className="btn-retour" 
          onClick={() => navigate('/formations')}
        >
          <i className="fas fa-arrow-left"></i> Retour aux formations
        </button>
      </section>

      <button className="catalogue-download-btn" onClick={handleDownloadCatalogue}>
        <div className="catalogue-download-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        </div>
        <span>Télécharger le catalogue PDF</span>
      </button>

      <section className="etudiant-grid">
        {formations.map((f) => (
          <div key={f.id_formation} className="etudiant-card">
            {getImageUrl(f) && (
              <div className="etudiant-card-image">
                <img src={getImageUrl(f)} alt={f.titre} />
              </div>
            )}
            <div className="etudiant-card-body">
              <h3>{f.titre}</h3>
              <p><strong>Durée :</strong> {f.duree}h</p>
              <p><strong>Prix :</strong> {parseInt(f.prix).toLocaleString()} FCFA</p>
              <p><strong>Catégorie :</strong> {f.categorie}</p>

              <div className="etudiant-buttons">
                <button
                  className="btn-inscrire"
                  onClick={() => handleInscription(f.id_formation)}
                >
                  S'inscrire
                </button>

                <button
                  className="btn-details"
                  onClick={() => handleVoirDetails(f.id_formation)}
                >
                  En savoir plus
                </button>
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Etudiant;