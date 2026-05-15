import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { addToCart, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import "../styles/produitcard.css";

export default function ProduitCard({ produit, from }) {
  const [favori, setFavori] = useState(false);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);

  useEffect(() => {
    const refresh = () => setFavori(isFavorite(produit?.id_produit));
    refresh();
    return subscribeStoreUpdates(refresh);
  }, [produit?.id_produit]);

  const handlePanier = (e) => {
    e.preventDefault();
    addToCart(produit, 1);
    setAjouteAuPanier(true);
    setTimeout(() => setAjouteAuPanier(false), 1800);
  };

  const handleFavori = (e) => {
    e.preventDefault();
    const result = toggleFavorite(produit);
    setFavori(Boolean(result?.isFavorite));
  };

  const prixFinal = produit.prix_promo ?? produit.prix;
  const reduction = produit.prix_promo
    ? Math.round(((produit.prix - produit.prix_promo) / produit.prix) * 100)
    : null;

  const location = useLocation();
  const back = from ?? (`${location.pathname}${location.search}` || "/produits");

  const isGeovision = produit?.categorie?.segment === "geovision" || (produit?.marque && String(produit.marque).toLowerCase().includes("geovision"));
  const detailLink = isGeovision && produit?.slug ? `/geovision/produit/${produit.slug}` : `/produits/${produit.id_produit}`;

  return (
    <div className={`pc-card ${produit.stock === 0 ? "pc-card--rupture" : ""} ${isGeovision ? "pc-card--geovision" : ""}`}>

      {/* ── Badges ─────────────────────────────────── */}
      <div className="pc-badges">
        {isGeovision && <span className="pc-badge pc-badge--geovision">GeoVision</span>}
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
      <Link to={detailLink} className="pc-image-link" onClick={() => sessionStorage.setItem("produit_back_url", window.location.href)}>
        <div className="pc-image-wrapper">
          <img
            src={produit.image_url || "/placeholder.webp"}
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

        <Link to={detailLink} className="pc-titre-link" onClick={() => sessionStorage.setItem("produit_back_url", window.location.href)}>
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

        <Link to={`/produits/${produit.id_produit}`} className="pc-btn-detail" onClick={() => sessionStorage.setItem("produit_back_url", window.location.href)}>
          Voir détails
        </Link>
      </div>
    </div>
  );
}