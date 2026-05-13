import { useCallback, useEffect, useState } from "react";
import {
  addToCart,
  toggleFavorite,
  isFavorite as checkIsFavorite,
  subscribeStoreUpdates,
} from "../utils/shopStorage";

/**
 * Hook pour gérer les actions panier et favoris
 * Fonctionne pour tous les types de produits (normaux et Geovision)
 * 
 * @param {Object} product - Objet produit
 * @returns {Object} État et actions {
 *   isFavorite: boolean,
 *   isInCart: boolean, 
 *   addedToCart: boolean,
 *   isLoading: boolean,
 *   addToCart: Function,
 *   toggleFavorite: Function,
 *   quantity: number,
 *   setQuantity: Function,
 * }
 */
export function useProductActions(product) {
  const [isFav, setIsFav] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [quantity, setQuantity] = useState(1);

  // Initialiser état favoris
  useEffect(() => {
    if (!product) return;
    setIsFav(checkIsFavorite(product));

    const unsubscribe = subscribeStoreUpdates(() => {
      setIsFav(checkIsFavorite(product));
    });

    return unsubscribe;
  }, [product?.id_produit]);

  const handleAddToCart = useCallback((qty = quantity) => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      addToCart(product, qty);
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    } catch (error) {
      console.error("Erreur ajout panier:", error);
    } finally {
      setIsLoading(false);
    }
  }, [product, quantity]);

  const handleToggleFavorite = useCallback(() => {
    if (!product) return;
    
    setIsLoading(true);
    try {
      toggleFavorite(product);
      setIsFav(!isFav);
    } catch (error) {
      console.error("Erreur favoris:", error);
    } finally {
      setIsLoading(false);
    }
  }, [product, isFav]);

  return {
    isFavorite: isFav,
    addedToCart,
    isLoading,
    addToCart: handleAddToCart,
    toggleFavorite: handleToggleFavorite,
    quantity,
    setQuantity,
  };
}
