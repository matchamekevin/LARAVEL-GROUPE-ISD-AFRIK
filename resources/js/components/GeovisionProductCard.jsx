import React from "react";
import { useNavigate } from "react-router-dom";
import { useProductActions } from "../hooks/useProductActions";
import { readGeovisionSpecifications, resolveGeovisionImage, normalizeGeovisionKey } from "../utils/geovision";

export default function GeovisionProductCard({ product, badgeLabel, showSpecs, fallbackImage }) {
  const navigate = useNavigate();
  const specs = readGeovisionSpecifications(product);
  const { isFavorite, addToCart, toggleFavorite } = useProductActions(product);

  const taxonomyText = showSpecs
    ? [specs.taxonomy.category, specs.taxonomy.subcategory, specs.taxonomy.series].filter(Boolean).join(" / ")
    : null;

  const handleImageError = (e) => {
    if (!fallbackImage) return;
    e.target.onerror = null;
    e.target.src = fallbackImage;
  };

  return (
    <article key={product.id_produit || product.slug} className="pp-card">
      <button
        type="button"
        className="pp-image-wrap"
        onClick={() => navigate(`/geovision/produit/${product.slug}`)}
      >
        <img
          alt={product.titre}
          className="pp-image"
          loading="lazy"
          src={resolveGeovisionImage(product)}
          onError={handleImageError}
        />
        <div className="pp-image-overlay"></div>
        <span className="pp-badge pp-badge--neuf">
          <span className="material-icons" style={{fontSize:14,marginRight:4,verticalAlign:'middle'}}>sell</span>
          {badgeLabel || product.categorie?.nom || specs.taxonomy.subcategory || "GeoVision"}
        </span>
      </button>

      <div className="pp-body">
        <h3 className="pp-title">{product.titre}</h3>
        <p className="pp-desc">{product.description_courte || product.description}</p>
        {taxonomyText && <p className="pp-card-note">{taxonomyText}</p>}
        {showSpecs && specs.tags.length > 0 && (
          <div className="pp-meta-row">
            {specs.tags.slice(0, 4).map((tag) => (
              <span key={`${product.slug}-${normalizeGeovisionKey(tag)}`} className="pp-meta-chip">{tag}</span>
            ))}
          </div>
        )}
        <div className="pp-footer-row">
          <button className="pp-add-btn" onClick={() => navigate(`/geovision/produit/${product.slug}`)}>
            Voir la fiche →
          </button>
          <button
            className="btn-cart-minimal"
            onClick={() => addToCart(1)}
            title="Ajouter au panier"
          >
            <span className="material-icons">shopping_cart</span>
          </button>
          <button
            className={`btn-favorite-minimal ${isFavorite ? 'active' : ''}`}
            onClick={() => toggleFavorite()}
            title="Ajouter aux favoris"
          >
            <span className="material-icons">{isFavorite ? 'favorite' : 'favorite_border'}</span>
          </button>
        </div>
      </div>
    </article>
  );
}
