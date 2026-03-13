import React from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { DETAIL_TYPES } from "../data/homeDetails";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/why-cards-grid.css";

export default function DetailDomaine() {
  const { type, slug } = useParams();
  const navigate = useNavigate();

  const group = DETAIL_TYPES[type];
  const item = group?.items?.[slug];

  usePageMeta(
    item ? `${item.title} | Groupe ISD AFRIK` : "Detail | Groupe ISD AFRIK",
    item ? item.subtitle : "Decouvrez les details de cette offre du Groupe ISD AFRIK."
  );

  if (!group || !item) {
    return (
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
          <h1 className="text-2xl font-bold text-slate-800">Detail introuvable</h1>
          <p className="text-slate-600 mt-3">Cette fiche n'existe pas ou a ete deplacee.</p>
          <div className="mt-6 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-5 py-2.5 rounded-lg bg-slate-100 text-slate-800 font-medium hover:bg-slate-200"
            >
              Retour
            </button>
            <Link to="/" className="px-5 py-2.5 rounded-lg bg-[#172243] text-white font-medium hover:opacity-95">
              Accueil
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="why-detail-page">
      <section className="why-detail-container">
        <div className="why-detail-breadcrumb">
          <Link to="/" data-discover="true">Accueil</Link>
          <span>/</span>
          <span>{group.label}</span>
        </div>

        <div className="why-detail-hero">
          <div className="why-detail-hero-image">
            <img src={item.image} alt={item.title} />
          </div>
          <div className="why-detail-hero-content">
            <h1>{item.title}</h1>
            <p className="lead">{item.subtitle}</p>

            <div className="bullets">
              {item.highlights.map((point) => (
                <div key={point} className="bullet">{point}</div>
              ))}
            </div>

            <div className="why-detail-cta">
              <Link
                to={item.ctaLink}
                className="why-detail-btn-primary"
              >
                {item.ctaLabel}
              </Link>
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="why-detail-btn-secondary"
              >
                Retour
              </button>
            </div>
          </div>
        </div>

        <div className="why-detail-section">
          <h2>Ce qu'il faut savoir</h2>
          <div className="why-detail-grid-2">
            {item.details.map((paragraph) => (
              <div key={paragraph} className="why-detail-card">
                <p>{paragraph}</p>
              </div>
            ))}
          </div>
        </div>

        <Link to="/" className="why-detail-back">
          ← Retour à l'accueil
        </Link>
      </section>
    </div>
  );
}
