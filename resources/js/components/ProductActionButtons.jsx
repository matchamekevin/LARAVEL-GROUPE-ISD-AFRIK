import React, { useEffect, useState } from "react";
import {
  addToCart,
  toggleFavorite,
  isFavorite as checkIsFavorite,
  subscribeStoreUpdates,
} from "../utils/shopStorage";

/**
 * Composant réutilisable pour les actions produit (panier, favoris, paiement)
 * Fonctionne pour les produits normaux ET Geovision
 * 
 * @param {Object} product - Objet produit (id_produit, titre, prix, etc.)
 * @param {Object} options - Configuration optionnelle
 * @param {number} options.defaultQuantity - Quantité par défaut (default: 1)
 * @param {boolean} options.showQuantity - Afficher le sélecteur de quantité (default: true)
 * @param {boolean} options.showPaymentBtn - Afficher le bouton paiement (default: true)
 * @param {Function} options.onPaymentClick - Callback pour paiement
 * @param {string} options.className - Classe CSS personnalisée
 */
export default function ProductActionButtons({
  product,
  options = {},
}) {
  const {
    defaultQuantity = 1,
    showQuantity = true,
    showPaymentBtn = true,
    onPaymentClick = null,
    className = "",
  } = options;

  const [quantite, setQuantite] = useState(defaultQuantity);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);
  const [favori, setFavori] = useState(false);
  const [loading, setLoading] = useState(false);

  // Initialiser l'état favoris
  useEffect(() => {
    if (!product) return;
    setFavori(checkIsFavorite(product));

    // S'abonner aux mises à jour du store
    const unsubscribe = subscribeStoreUpdates(() => {
      setFavori(checkIsFavorite(product));
    });

    return unsubscribe;
  }, [product]);

  const handleAddToCart = () => {
    if (!product) return;

    setLoading(true);
    try {
      addToCart(product, quantite);
      setAjouteAuPanier(true);

      setTimeout(() => {
        setAjouteAuPanier(false);
      }, 2000);
    } catch (error) {
      console.error("Erreur ajout panier:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = () => {
    if (!product) return;

    setLoading(true);
    try {
      toggleFavorite(product);
      setFavori(!favori);
    } catch (error) {
      console.error("Erreur favoris:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayment = () => {
    if (!product) return;

    if (onPaymentClick) {
      onPaymentClick(product, quantite);
    } else {
      // Comportement par défaut : redirection vers checkout
      console.warn("Paiement non configuré. Implémentez onPaymentClick.");
      // TODO: Implémenter redirection vers page paiement
    }
  };

  if (!product) {
    return <div className={`pab-error ${className}`}>Produit invalide</div>;
  }

  return (
    <div className={`product-action-buttons ${className}`}>
      {/* Sélecteur de quantité */}
      {showQuantity && (
        <div className="pab-quantity-group">
          <label htmlFor={`qty-${product.id_produit}`}>Quantité:</label>
          <input
            id={`qty-${product.id_produit}`}
            type="number"
            min="1"
            max="999"
            value={quantite}
            onChange={(e) => setQuantite(Math.max(1, parseInt(e.target.value) || 1))}
            className="pab-quantity-input"
            aria-label="Quantité"
          />
        </div>
      )}

      {/* Boutons d'action */}
      <div className="pab-button-group">
        {/* Bouton Panier */}
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={loading || ajouteAuPanier}
          className={`pab-btn pab-btn--cart ${ajouteAuPanier ? "pab-btn--success" : ""}`}
          title="Ajouter au panier"
          aria-label="Ajouter au panier"
        >
          <i className={`fas ${ajouteAuPanier ? "fa-check" : "fa-shopping-cart"}`}></i>
          <span>{ajouteAuPanier ? "Ajouté !" : "Panier"}</span>
        </button>

        {/* Bouton Favoris */}
        <button
          type="button"
          onClick={handleToggleFavorite}
          disabled={loading}
          className={`pab-btn pab-btn--favorite ${favori ? "pab-btn--active" : ""}`}
          title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
          aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
        >
          <i className={`${favori ? "fas" : "far"} fa-heart`}></i>
          <span>{favori ? "Dans vos favoris" : "Ajouter aux favoris"}</span>
        </button>

        {/* Bouton Paiement */}
        {showPaymentBtn && (
          <button
            type="button"
            onClick={handlePayment}
            disabled={loading}
            className="pab-btn pab-btn--payment"
            title="Procéder au paiement"
            aria-label="Procéder au paiement"
          >
            <i className="fas fa-credit-card"></i>
            <span>Payer</span>
          </button>
        )}
      </div>
    </div>
  );
}
