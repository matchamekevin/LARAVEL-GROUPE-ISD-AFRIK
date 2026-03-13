import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { searchProduits } from "../services/ProduitService";
import ProduitCard from "../components/ProduitCard";
import "../styles/produitrecherche.css";

export default function ProduitRecherche() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [query,     setQuery]     = useState(searchParams.get("q") || "");
  const [resultats, setResultats] = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [recherche, setRecherche] = useState(searchParams.get("q") || "");
  const [total,     setTotal]     = useState(0);

  // Lancer la recherche si q est dans l'URL au chargement
  useEffect(() => {
    if (recherche) {
      lancer(recherche);
    }
  }, []);

  const lancer = async (q) => {
    if (!q || q.trim().length < 2) return;
    setLoading(true);
    setRecherche(q);
    setSearchParams({ q });
    try {
      const res = await searchProduits(q.trim());
      setResultats(res.data.data   || []);
      setTotal(res.data.total      || 0);
    } catch (err) {
      console.error("Erreur recherche", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    lancer(query);
  };

  return (
    <div className="pr-page">

      {/* ── Hero recherche ────────────────────────── */}
      <div className="pr-hero">
        <div className="pr-hero-inner">
          <h1>🔍 Recherche</h1>
          {recherche && (
            <p>Résultats pour <strong>"{recherche}"</strong></p>
          )}

          <form className="pr-search-form" onSubmit={handleSubmit}>
            <input
              type="text"
              placeholder="Rechercher un produit, une marque..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
            {query && (
              <button
                type="button"
                className="pr-clear"
                onClick={() => { setQuery(""); setResultats([]); setRecherche(""); }}
              >✕</button>
            )}
            <button type="submit" className="pr-search-btn">
              Rechercher
            </button>
          </form>
        </div>
      </div>

      {/* ── Résultats ─────────────────────────────── */}
      <div className="pr-container">

        {/* Stats */}
        {!loading && recherche && (
          <div className="pr-stats">
            {total > 0
              ? <span>✅ <strong>{total}</strong> produit{total > 1 ? "s" : ""} trouvé{total > 1 ? "s" : ""}</span>
              : <span>❌ Aucun produit trouvé pour <strong>"{recherche}"</strong></span>
            }
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="pr-grid">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="pr-skeleton" />
            ))}
          </div>
        )}

        {/* Résultats */}
        {!loading && resultats.length > 0 && (
          <div className="pr-grid">
            {resultats.map((p) => (
              <ProduitCard key={p.id_produit} produit={p} />
            ))}
          </div>
        )}

        {/* État vide */}
        {!loading && recherche && resultats.length === 0 && (
          <div className="pr-empty">
            <div>🔍</div>
            <h3>Aucun résultat pour "{recherche}"</h3>
            <p>Essayez avec d'autres mots-clés ou vérifiez l'orthographe.</p>
            <div className="pr-suggestions">
              <p>Suggestions :</p>
              <ul>
                <li>Utilisez des termes plus généraux (ex: "laptop" au lieu de "laptop HP 15 pouces")</li>
                <li>Vérifiez l'orthographe du terme recherché</li>
                <li>Essayez une autre marque ou catégorie</li>
              </ul>
            </div>
          </div>
        )}

        {/* Aucune recherche encore */}
        {!loading && !recherche && (
          <div className="pr-empty">
            <div>🛍️</div>
            <h3>Que recherchez-vous ?</h3>
            <p>Tapez un nom de produit, une marque ou une référence dans la barre de recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}