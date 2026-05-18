import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getApiBase } from "../utils/apiBase";
import "../styles/projets-new.css";

export default function ProjetPresentation() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [projet, setProjet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${getApiBase()}/api/projets/${slug}`);
        if (!res.ok) { setProjet(null); return; }
        const data = await res.json();
        setProjet(data);
      } catch {
        setProjet(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [slug]);

  usePageMeta(
    projet ? `${projet.title} | Groupe ISD AFRIK` : "Projet | Groupe ISD AFRIK",
    projet?.long_desc || projet?.description || "Présentation de nos projets"
  );

  if (loading) {
    return (
      <div className="projets-page projets-modern">
        <section className="projets-hero-modern" style={{ padding: "60px 20px" }}>
          <p style={{ textAlign: 'center', color: '#64748b' }}>Chargement...</p>
        </section>
      </div>
    );
  }

  if (!projet) {
    return (
      <div className="projets-page projets-modern">
        <section className="projets-hero-modern" style={{ padding: "60px 20px" }}>
          <h1 className="projets-hero-title">Projet introuvable</h1>
          <p className="projets-hero-subtitle">Le projet que vous recherchez n'existe pas.</p>
          <button onClick={() => navigate("/projets")} className="projet-link-btn" style={{ marginTop: 20 }}>
            ← Retour aux projets
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="projets-page projets-modern">
      <section className="projets-hero-modern" style={{ padding: "60px 20px 160px" }}>
        <div className="projets-hero-chip">{projet.category}</div>
        <h1 className="projets-hero-title">{projet.title}</h1>
      </section>

      <div className="projet-pres-image-wrap">
        <div className="projet-pres-image">
          <img src={projet.image_url || projet.image_path} alt={projet.title} />
        </div>
      </div>

      <section className="projet-pres-container">
        <div className="projet-pres-content">
          <h2>À propos de ce projet</h2>
          <div className="projet-pres-meta">
            <div className="projet-pres-meta-item">
              <strong>Catégorie</strong>
              <span>{projet.category}</span>
            </div>
          </div>
          <p className="projet-pres-desc">{projet.long_desc || projet.description}</p>
          <div className="projet-pres-actions">
            <button onClick={() => navigate("/projets")} className="projet-link-btn projet-link-btn--ghost">
              ← Tous les projets
            </button>
            <a href={projet.url} target="_blank" rel="noopener noreferrer" className="projet-link-btn">
              Visiter le site <i className="fas fa-external-link-alt"></i>
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
