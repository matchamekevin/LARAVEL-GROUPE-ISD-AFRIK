import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import api from "../axios";
import {
  clearCart,
  getCartItems,
  removeFromCart,
  setCartItemQuantity,
  subscribeStoreUpdates,
} from "../utils/shopStorage";
import { getProduit } from "../services/ProduitService";
import { notifyMutation } from "../utils/mutationBus";
import { toastError } from "../utils/toast";

function formatPrice(value) {
  return `${Number(value || 0).toLocaleString("fr-FR")} FCFA`;
}

export default function Panier() {
  const [items, setItems] = useState([]);
  const [imageCache, setImageCache] = useState({});
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    const refresh = () => setItems(getCartItems());
    refresh();
    return subscribeStoreUpdates(refresh);
  }, []);

  // Fetch missing product images for cart items when necessary
  useEffect(() => {
    let cancelled = false;

    const idsToFetch = items
      .map((it) => Number(it.id_produit || it.id || 0))
      .filter((id) => id > 0 && !imageCache[id]);

    if (idsToFetch.length === 0) return undefined;

    idsToFetch.forEach(async (id) => {
      try {
        const res = await getProduit(id);
        const prod = res.data?.data || res.data || null;
        if (!prod) return;

        const candidates = [
          prod.image_url,
          ...(Array.isArray(prod.image_urls) ? prod.image_urls : []),
          prod.images?.[0]?.url,
          prod.images?.[0]?.path,
          prod.image,
          prod.photo_url,
          prod.thumbnail,
        ]
          .map((v) => String(v || "").trim())
          .filter(Boolean);

        const dbImage = candidates[0] || null;
        if (dbImage && !cancelled) {
          setImageCache((prev) => ({ ...prev, [id]: dbImage }));
        }
      } catch (e) {
        // ignore fetch errors silently
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items, imageCache]);

  const summary = useMemo(() => {
    const totalQty = items.reduce((sum, item) => sum + Number(item.quantite || 0), 0);
    const totalAmount = items.reduce((sum, item) => {
      const unit = Number(item.prix_promo || item.prix || 0);
      return sum + unit * Number(item.quantite || 0);
    }, 0);

    return { totalQty, totalAmount };
  }, [items]);

  const handlePayCart = async () => {
    if (paying) return;

    const payloadItems = items
      .map((item) => ({
        id_produit: Number(item.id_produit || item.id || 0),
        quantite: Math.max(1, Number(item.quantite || 1)),
      }))
      .filter((item) => item.id_produit > 0);

    if (payloadItems.length === 0) {
      toastError("Aucun produit valide dans le panier.");
      return;
    }

    setPaying(true);

    try {
      const response = await api.post("/produits/paiement", {
        items: payloadItems,
      });

      const checkoutUrl = response?.data?.checkout_url;
      if (!checkoutUrl) {
        throw new Error("URL de paiement manquante.");
      }

      notifyMutation();
      window.location.href = checkoutUrl;
    } catch (error) {
      const backendMessage =
        error?.response?.data?.message ||
        "Impossible d'initialiser le paiement du panier.";
      toastError(backendMessage);
      setPaying(false);
    }
  };

  return (
    <section style={{ maxWidth: "1100px", margin: "40px auto 40px", padding: "0 clamp(8px, 2vw, 16px)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ margin: 0, color: "#172243" }}>Panier</h1>
        <span style={{ color: "#64748b", fontWeight: 600 }}>{summary.totalQty} article(s)</span>
      </div>

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, color: "#64748b" }}>Votre panier est vide.</p>
          <Link to="/produits" style={{ display: "inline-block", marginTop: "12px", color: "#1d4ed8", fontWeight: 700 }}>
            Continuer vos achats
          </Link>
        </div>
      ) : (
        <>
          <div style={{ display: "grid", gap: "12px" }}>
            {items.map((item, index) => {
              const unitPrice = Number(item.prix_promo || item.prix || 0);
              const quantity = Number(item.quantite || 1);

              // Prefer explicit id_produit, fall back to id
              const productId = Number(item.id_produit || item.id || 0);

              const rawImg = String(item.image_url || item.image || (item.images && item.images[0] && (item.images[0].url || item.images[0].path)) || "").trim();
              const isPlaceholder = !rawImg || rawImg === "/placeholder.webp" || rawImg === "/images/default.webp" || rawImg === "/images/prod_default.webp";
              const imageSrc = !isPlaceholder ? rawImg : (imageCache[productId] || "/images/default.webp");

              return (
                <article key={productId > 0 ? `cart-${productId}` : `cart-fallback-${index}`} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: "12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                  <img src={imageSrc} alt={item.titre} style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "10px" }} />

                  <div>
                    <h3 style={{ margin: "0 0 6px", color: "#172243", fontSize: "1rem" }}>{item.titre}</h3>
                    <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "0.9rem" }}>Prix unitaire: {formatPrice(unitPrice)}</p>
                    <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>Sous-total: {formatPrice(unitPrice * quantity)}</p>
                  </div>

                  <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", justifyContent: "center" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", border: "1px solid #cbd5e1", borderRadius: "8px" }}>
                      <button type="button" onClick={() => { const next = setCartItemQuantity(productId, quantity - 1); setItems(next); }} style={{ border: "none", background: "transparent", width: "32px", height: "32px", cursor: "pointer" }}>-</button>
                      <span style={{ minWidth: "28px", textAlign: "center", fontWeight: 700 }}>{quantity}</span>
                      <button type="button" onClick={() => { const next = setCartItemQuantity(productId, quantity + 1); setItems(next); }} style={{ border: "none", background: "transparent", width: "32px", height: "32px", cursor: "pointer" }}>+</button>
                    </div>
                    <button type="button" onClick={() => { const next = removeFromCart(productId); setItems(next); }} style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}>
                      Retirer
                    </button>
                    <Link to={`/produits/${productId}`} onClick={() => sessionStorage.setItem("produit_back_url", window.location.href)} style={{ color: "#1d4ed8", fontWeight: 600 }}>Voir</Link>
                  </div>
                </article>
              );
            })}
          </div>

          <div style={{ marginTop: "16px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "16px", display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <p style={{ margin: 0, color: "#64748b" }}>Total panier</p>
              <p style={{ margin: 0, fontSize: "1.2rem", fontWeight: 800, color: "#172243" }}>{formatPrice(summary.totalAmount)}</p>
            </div>
            <div style={{ display: "flex", gap: "10px" }}>
              <button type="button" onClick={() => { clearCart(); notifyMutation(); setItems([]); }} style={{ border: "1px solid #cbd5e1", background: "#fff", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}>
                Vider le panier
              </button>
              <button
                type="button"
                onClick={handlePayCart}
                disabled={paying}
                style={{ border: "none", borderRadius: "8px", padding: "8px 12px", background: "#0f766e", color: "#fff", fontWeight: 700, cursor: paying ? "not-allowed" : "pointer", opacity: paying ? 0.7 : 1 }}
              >
                {paying ? "Redirection..." : "Payer maintenant"}
              </button>
              <Link to="/produits" style={{ textDecoration: "none", borderRadius: "8px", padding: "8px 12px", background: "#172243", color: "#fff", fontWeight: 700 }}>
                Continuer vos achats
              </Link>
            </div>
          </div>

          
        </>
      )}
    </section>
  );
}
