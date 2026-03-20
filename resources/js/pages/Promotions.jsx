import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/promotions.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Promotions() {
  usePageMeta(
    "Toutes nos promotions | Groupe ISD AFRIK",
    "Découvrez toutes les promotions et offres exclusives du mois chez ISD AFRIK."
  );

  const navigate = useNavigate();
  const [promoModalIndex, setPromoModalIndex] = useState(null);
  const inscriptionLink = "/inscription";

  const promoImages = [
    { src: "/images/promotions/promo1.webp", link: "/formations" },
    { src: "/images/promotions/promo2.webp", link: "/formations" },
    { src: "/images/promotions/promo3.webp", link: "/formations" },
    { src: "/images/promotions/promo4.webp", link: "/promotions/promo-4" },
    { src: "/images/promotions/promo5.webp", link: "/produits?categories=drone-formation,fourniture-tpe" },
    { src: "/images/promotions/promo6.webp", link: "/produits?categories=drone-formation,fourniture-tpe" },
    { src: "/images/promotions/promo7.webp", link: "/promotions/promo-7" },
    { src: "/images/promotions/promo8.webp", link: "/promotions/promo-8" },
    { src: "/images/promotions/promo9.webp", link: "/promotions/promo-9" },
    { src: "/images/promotions/promo10.webp", link: "/promotions/promo-10" }
  ];

  // Noms des mois en français
  const moisNoms = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const moisActuel = new Date().getMonth(); // 0-11
  const nomMois = moisNoms[moisActuel];
  const dernierJour = new Date(new Date().getFullYear(), moisActuel + 1, 0).getDate();

  // Bloque le scroll quand modal ouverte
  useEffect(() => {
    if (promoModalIndex !== null) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [promoModalIndex]);

  return (
    <div className="promotions-page">
      {/* Breadcrumb */}
      <nav className="breadcrumb" aria-label="Fil d'ariane">
        <button onClick={() => navigate('/')} className="breadcrumb-link">
          <i className="fas fa-home"></i> Accueil
        </button>
        <span className="breadcrumb-sep">/</span>
        <span className="breadcrumb-current">Promotions</span>
      </nav>

      {/* Header */}
      <section className="promo-page-header">
        <h1>Toutes nos promotions</h1>
        <p>Découvrez l'ensemble de nos offres exclusives valables jusqu'au {dernierJour} {nomMois.toLowerCase()}</p>
      </section>

      {/* Galerie complète */}
      <section className="promo-page-gallery">
        <div className="promo-grid">
          {promoImages.map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="promo-card"
              onClick={() => { setPromoModalIndex(idx); }}
              aria-label={`Voir la promotion ${idx + 1}`}
            >
              <div className="promo-card-image">
                <img
                  src={item.src}
                  alt={`Promo ${idx + 1}`}
                  className="promo-card-img"
                  onError={(e) => { e.target.style.background = '#eee'; e.target.src = ''; }}
                />
                <div className="promo-card-overlay">
                  <button type="button" className="promo-view-btn">
                    <i className="fas fa-eye"></i> Voir
                  </button>
                </div>
              </div>
              {/* label removed per design: Promotion number hidden */}
            </button>
          ))}
        </div>
      </section>

      {/* Modal */}
      {promoModalIndex !== null && (
        <div
          className="modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={`Promotion ${promoModalIndex + 1}`}
          onKeyDown={(e) => { if (e.key === 'Escape') setPromoModalIndex(null); }}
          onClick={() => setPromoModalIndex(null)}
        >
          <div className="modal-content promo-modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setPromoModalIndex(null)}>
              <i className="fas fa-times"></i>
            </button>

            <div className="modal-promo-figure">
              <img
                src={promoImages[promoModalIndex]?.src}
                alt={`Promo ${promoModalIndex + 1}`}
                className="modal-promo-img"
                onError={(e) => { e.target.style.background = '#eee'; e.target.src = ''; }}
              />
            </div>

            <div className="modal-promo-actions">
              <button
                className="btn-primary"
                onClick={() => navigate(promoImages[promoModalIndex]?.link || inscriptionLink)}
              >
                <i className="fas fa-check"></i> Souscrire
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CTA Retour */}
      <section className="promo-cta">
        <button className="btn-secondary" onClick={() => navigate('/')}>
          <i className="fas fa-arrow-left"></i> Retour à l'accueil
        </button>
      </section>
    </div>
  );
}
