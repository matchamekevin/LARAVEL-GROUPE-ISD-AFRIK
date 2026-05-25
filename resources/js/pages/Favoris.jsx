import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { addToCart, getFavorites, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import { getProduit } from "../services/ProduitService";

function formatPrice(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("fr-FR")} FCFA`;
}

export default function Favoris() {
  const [items, setItems] = useState([]);
  const [imageCache, setImageCache] = useState({});

  useEffect(() => {
    const refresh = () => setItems(getFavorites());
    refresh();
    return subscribeStoreUpdates(refresh);
  }, []);

  // Load DB images for favourites when item snapshot uses a placeholder
  useEffect(() => {
    let cancelled = false;

    const idsToFetch = items
      .map((it) => String(it.id_produit || it.id || 0))
      .filter((id) => id && id !== "0" && !imageCache[id]);

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
        // ignore
      }
    });

    return () => {
      cancelled = true;
    };
  }, [items, imageCache]);

  const total = useMemo(() => items.length, [items]);

  return (
    <section style={{ maxWidth: "1100px", margin: "40px auto 40px", padding: "0 clamp(8px, 2vw, 16px)" }}>
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

            const rawImg = String(
              item.image_url || item.image || (item.images && item.images[0] && (item.images[0].url || item.images[0].path)) || ""
            ).trim();
            const isPlaceholder = !rawImg || rawImg === "/placeholder.webp" || rawImg === "/images/default.webp" || rawImg === "/images/prod_default.webp";
            const imageSrc = !isPlaceholder ? rawImg : (imageCache[String(item.id_produit || item.id)] || "/images/default.webp");

            return (
              <article key={item.id_produit} style={{ display: "grid", gridTemplateColumns: "84px 1fr auto", gap: "12px", background: "#fff", border: "1px solid #e2e8f0", borderRadius: "12px", padding: "12px" }}>
                <img src={imageSrc} alt={item.titre} style={{ width: "84px", height: "84px", objectFit: "cover", borderRadius: "10px" }} />

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
                  <Link to={`/produits/${item.id_produit}`} onClick={() => sessionStorage.setItem("produit_back_url", window.location.href)} style={{ color: "#1d4ed8", fontWeight: 600 }}>Voir</Link>
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
