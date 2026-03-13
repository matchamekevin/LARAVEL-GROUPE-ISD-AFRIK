import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/etudiant.css";

const Particulier = () => {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [formations, setFormations] = useState([]);

  // ⚡ Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:8000/api/auth/profile", {
        headers: { Authorization: `Bearer ${token}` },
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
    axios.get("http://localhost:8000/api/formations/type/etudiant")
      .then((res) => {
        console.log("Formations reçues:", res.data); // 🔍 Pour déboguer
        setFormations(res.data);
      })
      .catch((err) => console.error("Erreur chargement formations:", err));
  }, []);

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

  // ✅ Fonction pour obtenir l'URL de l'image
  const getImageUrl = (formation) => {
    if (formation.images && formation.images.length > 0) {
      return formation.images[0].url;
    }
    return "http://localhost:8000/images/default-formation.jpg";
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

      <section className="etudiant-grid">
        {formations.map((f) => (
          <div key={f.id_formation} className="etudiant-card">
            <div className="etudiant-card-image">
              <img 
                src={getImageUrl(f)} 
                alt={f.titre}
                onError={(e) => {
                  console.error('Erreur de chargement image:', e.target.src);
                  e.target.src = 'http://localhost:8000/images/default.jpg';
                }}
              />
            </div>
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

export default Particulier;