import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addToCart, getFavorites, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";

function formatPrice(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function Favoris() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const refresh = () => setItems(getFavorites());
    refresh();
    return subscribeStoreUpdates(refresh);
  }, []);

  const total = useMemo(() => items.length, [items]);

  return (
    <section style={{ maxWidth: "1100px", margin: "120px auto 40px", padding: "0 16px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h1 style={{ margin: 0, color: "#172243" }}>Liste d'envies</h1>
        <span style={{ color: "#64748b", fontWeight: 600 }}>{total} produit(s)</span>
      </div>

      {items.length === 0 ? (
        <div style={{ background: "#fff", borderRadius: "12px", padding: "24px", border: "1px solid #e2e8f0" }}>
          <p style={{ margin: 0, color: "#64748b" }}>Votre liste d'envies est vide.</p>
          <Link to="/produits" style={{ display: "inline-block", marginTop: "12px", color: "#1d4ed8", fontWeight: 700 }}>
            Explorer les produits
          </Link>
        </div>
      ) : (
        <div style={{ display: "grid", gap: "12px" }}>
          {items.map((item) => {
            const price = Number(item.prix_promo || item.prix || 0);

            return (
              <article key={item.id_produit} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: "12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                <img src={item.image_url || "/placeholder.webp"} alt={item.titre} style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "10px" }} />

                <div>
                  <h3 style={{ margin: "0 0 6px", color: "#172243", fontSize: "1rem" }}>{item.titre}</h3>
                  {item.marque && <p style={{ margin: "0 0 6px", color: "#64748b", fontSize: "0.9rem" }}>{item.marque}</p>}
                  <p style={{ margin: 0, color: "#0f172a", fontWeight: 700 }}>{formatPrice(price)}</p>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "8px", alignItems: "flex-end", justifyContent: "center" }}>
                  <button
                    type="button"
                    onClick={() => addToCart(item, 1)}
                    style={{ border: "none", borderRadius: "8px", background: "#172243", color: "#fff", padding: "8px 12px", cursor: "pointer", fontWeight: 700 }}
                  >
                    Ajouter au panier
                  </button>
                  <Link to={`/produits/${item.id_produit}`} style={{ color: "#1d4ed8", fontWeight: 600 }}>Voir</Link>
                  <button
                    type="button"
                    onClick={() => toggleFavorite(item)}
                    style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer", fontWeight: 700 }}
                  >
                    Retirer
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
