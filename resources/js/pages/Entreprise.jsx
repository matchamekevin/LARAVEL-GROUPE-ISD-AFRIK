import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../styles/entreprise.css";

const Entreprise = () => {
  const navigate = useNavigate();
  const [formations, setFormations] = useState([]);
  const [activeMonth, setActiveMonth] = useState("");

  // Charger les formations de type "entreprise"
  useEffect(() => {
    axios
      .get("http://localhost:8000/api/formations/type/entreprise")
      .then((res) => {
        // Debug: afficher la réponse dans la console navigateur
        console.debug('API /api/formations/type/entreprise response:', res);
        setFormations(res.data || []);
      })
      .catch((err) => {
        console.error("Erreur chargement formations:", err);
        // Afficher plus d'infos pour debug
        if (err.response) console.error('Response data:', err.response.data, 'status:', err.response.status);
      });
  }, []);

  // Regrouper les formations par mois
  const formationsParMois = useMemo(() => {
    const grouped = {};
    formations.forEach((f) => {
      const mois = new Date(f.date_debut).toLocaleString("fr-FR", { month: "long" });
      const moisKey = mois.charAt(0).toUpperCase() + mois.slice(1); // Capitaliser
      if (!grouped[moisKey]) grouped[moisKey] = [];
      grouped[moisKey].push(f);
    });
    return grouped;
  }, [formations]);

  // Liste des mois en ordre chronologique
  const moisReference = [
    "Janvier",
    "Février",
    "Mars",
    "Avril",
    "Mai",
    "Juin",
    "Juillet",
    "Août",
    "Septembre",
    "Octobre",
    "Novembre",
    "Décembre"
  ];

  const moisList = useMemo(() => {
    return moisReference.filter((mois) => formationsParMois[mois]);
  }, [formationsParMois]);

  // Définir le mois actif par défaut
  useEffect(() => {
    if (!activeMonth && moisList.length > 0) setActiveMonth(moisList[0]);
  }, [moisList, activeMonth]);

  // Image principale (fallback)
  const getImageUrl = (f) =>
    f?.images?.[0]?.url || "http://localhost:8000/images/default.jpg";

  return (
    <div className="entreprise-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1 className="hero-title">Formations pour Entreprises</h1>
          <p className="hero-subtitle">
            Boostez la performance de vos équipes avec des solutions de formation sur mesure et innovantes.
          </p>
          <button className="cta-button" onClick={() => navigate("/formations")}>
            ← Retour aux formations
          </button>
        </div>
      </section>

      {/* Debug: nombre de formations chargées (temporaire) */}
      <div style={{ padding: 12, background: '#fff8', margin: '12px 16px', borderRadius: 8 }}>
        <strong>Debug:</strong> {formations.length} formation(s) chargée(s)
      </div>

      {/* Pourquoi choisir */}
      <section className="details-section">
        <h2>Pourquoi choisir nos formations pour entreprises ?</h2>
        <ul className="details-list">
          <li>Formation intra-entreprise</li>
          <li>Programmes 100% personnalisés</li>
          <li>ROI mesurable et garanti</li>
          <li>Certification collective</li>
        </ul>
      </section>

      {/* Navigation par mois */}
      {moisList.length > 0 && (
        <nav className="mois-nav" aria-label="Navigation par mois">
          {moisList.map((mois) => (
            <button
              key={mois}
              className={`mois-chip ${activeMonth === mois ? "active" : ""}`}
              onClick={() => setActiveMonth(mois)}
            >
              {mois}
            </button>
          ))}
        </nav>
      )}

      {/* Liste des formations par mois */}
      <section className="formations-section">
        {moisList.length === 0 ? (
          <div className="empty-state">
            <p>Aucune formation entreprise disponible pour le moment.</p>
          </div>
        ) : (
          <div className="mois-block">
            <h2 className="mois-title">{activeMonth?.toUpperCase()}</h2>
            <div className="formations-grid">
              {(formationsParMois[activeMonth] || []).map((f) => (
                <article key={f.id_formation} className="formation-card">
                  <div className="card-header-accent" />
                  <div className="formation-image">
                    <img
                      src={getImageUrl(f)}
                      alt={f.titre}
                      onError={(e) => {
                        e.currentTarget.src = "http://localhost:8000/images/default.jpg";
                      }}
                    />
                  </div>
                  <div className="formation-body">
                    <h3 className="formation-title">{f.titre}</h3>
                    <p className="formation-desc">{f.description}</p>

                    <div className="meta-row">
                      <span className="meta-badge">
                        {new Date(f.date_debut).toLocaleDateString("fr-FR")}
                      </span>
                      <span className="meta-badge">
                        {f.duree} {f.duree > 1 ? "jours" : "jour"}
                      </span>
                      <span className="meta-badge">
                        {parseInt(f.prix).toLocaleString()} FCFA
                      </span>
                    </div>

                    <div className="card-actions">
                      <button
                        className="btn-primary"
                        onClick={() => navigate(`/formations/${f.id_formation}/register`)}
                      >
                        S'inscrire
                      </button>
                      <button
                        className="btn-secondary"
                        onClick={() => navigate(`/formations/${f.id_formation}/details`)}
                      >
                        En savoir plus →
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Entreprise;
