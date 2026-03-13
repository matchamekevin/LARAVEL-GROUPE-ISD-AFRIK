import React, { useEffect, useState } from "react";
import ProduitCard from "./ProduitCard";
import { getProduits, getProduitsVedette, getProduitsNouveaux, getProduitsPromo } from "../services/ProduitService";
import "../styles/produitlist.css";

/**
 * ProduitList — Composant réutilisable
 * 
 * Props :
 * @param {string}  mode        - "all" | "vedette" | "nouveaux" | "promo" (défaut: "all")
 * @param {number}  limit       - Nombre max de produits à afficher (défaut: 8)
 * @param {string}  titre       - Titre de la section (optionnel)
 * @param {string}  sousTitre   - Sous-titre (optionnel)
 * @param {boolean} showVoirPlus- Afficher le bouton "Voir tous" (défaut: true)
 * @param {string}  lienVoirPlus- Lien du bouton voir plus (défaut: "/produits")
 * @param {object}  filtres     - Filtres supplémentaires (id_categorie, marque, etc.)
 * @param {string}  layout      - "grid" | "horizontal" (défaut: "grid")
 */
export default function ProduitList({
  mode         = "all",
  limit        = 8,
  titre        = "",
  sousTitre    = "",
  showVoirPlus = true,
  lienVoirPlus = "/produits",
  filtres      = {},
  layout       = "grid",
}) {
  const [produits, setProduits] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [erreur,   setErreur]   = useState(null);

  useEffect(() => {
    charger();
  }, [mode, limit, JSON.stringify(filtres)]);

  const charger = async () => {
    setLoading(true);
    setErreur(null);
    try {
      let res;

      switch (mode) {
        case "vedette":
          res = await getProduitsVedette();
          break;
        case "nouveaux":
          res = await getProduitsNouveaux();
          break;
        case "promo":
          res = await getProduitsPromo();
          break;
        default:
          res = await getProduits({ ...filtres, par_page: limit });
      }

      const data = res.data.data || [];
      // Limiter au nombre demandé
      setProduits(data.slice(0, limit));
    } catch (err) {
      console.error("Erreur ProduitList", err);
      setErreur("Impossible de charger les produits.");
    } finally {
      setLoading(false);
    }
  };

  // ── Titres par défaut selon le mode ──────────────────
  const titreDefaut = {
    all:      "Nos Produits",
    vedette:  "⭐ Produits en Vedette",
    nouveaux: "🆕 Nouveautés",
    promo:    "🏷️ Promotions en Cours",
  };

  const titreAffiche  = titre    || titreDefaut[mode] || "Produits";
  const lienParDefaut = mode === "vedette"  ? "/produits?en_vedette=1"
                      : mode === "nouveaux" ? "/produits?est_nouveau=1"
                      : mode === "promo"    ? "/produits?en_promo=1"
                      : lienVoirPlus;

  return (
    <section className={`pl-section pl-section--${mode}`}>

      {/* ── En-tête section ─────────────────────── */}
      {(titreAffiche || sousTitre) && (
        <div className="pl-header">
          <div className="pl-header-text">
            {titreAffiche && <h2 className="pl-titre">{titreAffiche}</h2>}
            {sousTitre    && <p  className="pl-sous-titre">{sousTitre}</p>}
          </div>

          {showVoirPlus && !loading && produits.length > 0 && (
            <a href={lienParDefaut} className="pl-voir-plus">
              Voir tout →
            </a>
          )}
        </div>
      )}

      {/* ── Loading skeleton ─────────────────────── */}
      {loading && (
        <div className={`pl-grid ${layout === "horizontal" ? "pl-grid--horizontal" : ""}`}>
          {[...Array(Math.min(limit, 4))].map((_, i) => (
            <div key={i} className="pl-skeleton" />
          ))}
        </div>
      )}

      {/* ── Erreur ───────────────────────────────── */}
      {!loading && erreur && (
        <div className="pl-erreur">
          <span>⚠️</span>
          <p>{erreur}</p>
          <button onClick={charger}>Réessayer</button>
        </div>
      )}

      {/* ── Liste produits ───────────────────────── */}
      {!loading && !erreur && produits.length > 0 && (
        <div className={`pl-grid ${layout === "horizontal" ? "pl-grid--horizontal" : ""}`}>
          {produits.map((p) => (
            <ProduitCard key={p.id_produit} produit={p} />
          ))}
        </div>
      )}

      {/* ── Vide ─────────────────────────────────── */}
      {!loading && !erreur && produits.length === 0 && (
        <div className="pl-vide">
          <span>📦</span>
          <p>Aucun produit disponible pour le moment.</p>
        </div>
      )}

      {/* ── Bouton voir plus (bas) ───────────────── */}
      {showVoirPlus && !loading && produits.length >= limit && (
        <div className="pl-footer">
          <a href={lienParDefaut} className="pl-btn-voir-plus">
            Voir tous les produits →
          </a>
        </div>
      )}
    </section>
  );
}