import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/produitcard.css";

export default function ProduitCard({ produit, from }) {
  const [favori, setFavori] = useState(false);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);

  const handlePanier = (e) => {
    e.preventDefault();
    setAjouteAuPanier(true);
    // TODO: dispatch vers contexte panier
    setTimeout(() => setAjouteAuPanier(false), 1800);
  };

  const handleFavori = (e) => {
    e.preventDefault();
    setFavori((prev) => !prev);
    // TODO: appel API favoris
  };

  const prixFinal = produit.prix_promo ?? produit.prix;
  const reduction = produit.prix_promo
    ? Math.round(((produit.prix - produit.prix_promo) / produit.prix) * 100)
    : null;

  const location = useLocation();
  const back = from ?? (`${location.pathname}${location.search}` || "/produits");

  return (
    <div className={`pc-card ${produit.stock === 0 ? "pc-card--rupture" : ""}`}>

      {/* ── Badges ─────────────────────────────────── */}
      <div className="pc-badges">
        {produit.est_nouveau  && <span className="pc-badge pc-badge--nouveau">Nouveau</span>}
        {produit.en_promo     && reduction && (
          <span className="pc-badge pc-badge--promo">-{reduction}%</span>
        )}
        {produit.stock === 0  && <span className="pc-badge pc-badge--rupture">Rupture</span>}
        {produit.est_en_vedette && !produit.est_nouveau && (
          <span className="pc-badge pc-badge--vedette">⭐ Vedette</span>
        )}
      </div>

      {/* ── Bouton favori ──────────────────────────── */}
      <button
        className={`pc-favori ${favori ? "pc-favori--actif" : ""}`}
        onClick={handleFavori}
        title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
      >
        {favori ? "❤️" : "🤍"}
      </button>

      {/* ── Image ──────────────────────────────────── */}
      <Link to={`/produits/${produit.id_produit}`} className="pc-image-link" state={{ from: back }}>
        <div className="pc-image-wrapper">
          <img
            src={produit.image_url || "/placeholder.png"}
            alt={produit.titre}
            className="pc-image"
            loading="lazy"
          />
          {produit.stock === 0 && (
            <div className="pc-overlay-rupture">Rupture de stock</div>
          )}
        </div>
      </Link>

      {/* ── Infos ──────────────────────────────────── */}
      <div className="pc-body">
        {produit.marque && (
          <span className="pc-marque">{produit.marque}</span>
        )}

        <Link to={`/produits/${produit.id_produit}`} className="pc-titre-link" state={{ from: back }}>
          <h3 className="pc-titre">{produit.titre}</h3>
        </Link>

        {/* Note */}
        {produit.note_moyenne > 0 && (
          <div className="pc-note">
            {[1, 2, 3, 4, 5].map((i) => (
              <span
                key={i}
                className={`pc-etoile ${i <= Math.round(produit.note_moyenne) ? "pc-etoile--pleine" : ""}`}
              >★</span>
            ))}
            <span className="pc-note-count">({produit.nombre_avis})</span>
          </div>
        )}

        {/* Prix */}
        <div className="pc-prix">
          <span className="pc-prix-final">
            {Number(prixFinal).toLocaleString("fr-FR")} FCFA
          </span>
          {produit.prix_promo && (
            <span className="pc-prix-barre">
              {Number(produit.prix).toLocaleString("fr-FR")} FCFA
            </span>
          )}
        </div>

        {/* Stock alerte */}
        {produit.stock > 0 && produit.stock <= 5 && (
          <p className="pc-stock-alerte">⚠️ Plus que {produit.stock} en stock !</p>
        )}
      </div>

      {/* ── Actions ────────────────────────────────── */}
      <div className="pc-actions">
        <button
          className={`pc-btn-panier ${ajouteAuPanier ? "pc-btn-panier--ok" : ""}`}
          onClick={handlePanier}
          disabled={produit.stock === 0 || ajouteAuPanier}
        >
          {ajouteAuPanier ? "✅ Ajouté !" : "🛒 Ajouter au panier"}
        </button>

        <Link to={`/produits/${produit.id_produit}`} className="pc-btn-detail" state={{ from: back }}>
          Voir détails
        </Link>
      </div>
    </div>
  );
}