import React, { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "../styles/home.css";
import "../styles/geovision-categories.css";
import {
  geovisionProducts,
  geovisionTypes,
} from "../data/geovisionCatalog";

export default function Geovision() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [activePill, setActivePill] = useState("all");
  const normalizeText = (v = "") => {
    return String(v)
      .toLowerCase()
      .normalize("NFD")
      .replace(/\p{Diacritic}/gu, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  };

  const matchesKey = (haystack = "", key = "") => {
    if (!key) return true;
    const h = normalizeText(haystack);
    const k = normalizeText(key);
    if (!k) return false;
    return h.includes(k) || k.split(" ").every(token => token.length <= 2 || h.includes(token));
  };

  // read optional filter from URL (e.g. ?filter=cameras-ip-thermiques) or location.state.pill
  useEffect(() => {
    try {
      const params = new URLSearchParams(location.search || "");
      const q = params.get("filter");
      const statePill = (location && location.state && location.state.pill) ? location.state.pill : null;
      const f = q || statePill;
      if (f) {
        setActivePill(normalizeText(f));
        setSearchQuery("");
      }
    } catch (err) {
      // ignore
    }
  }, [location && location.search, location && location.state]);

  // scroll to products grid when a pill filter is applied (except 'all')
  useEffect(() => {
    if (!activePill || activePill === 'all') return;
    // allow render to complete
    const id = setTimeout(() => {
      const grid = document.querySelector('.pp-grid[aria-label="Produits Geovision"]') || document.querySelector('.pp-grid');
      if (grid) {
        grid.setAttribute('tabindex', '-1');
        grid.focus();
        grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 80);
    return () => clearTimeout(id);
  }, [activePill]);

  // Filter geovisionProducts by active pill and search
  const visibleProducts = geovisionProducts.filter((p) => {
    const pillMatch = activePill === 'all'
      ? true
      : normalizeText(p.type) === activePill;
    if (!pillMatch) return false;
    if (!searchQuery) return true;
    const composite = [p.nom || '', p.description || '', p.type || ''].join(' ');
    return matchesKey(composite, searchQuery);
  });

  return (
    <div className="home geovision-page">
      <section className="geovision-hero">
        <div className="geovision-hero-inner">
          <div className="section-header">
            <h2>Geovision</h2>
            <p>Camera IP, controle d'acces, VMS, PoE, signaletique et accessoires.</p>
          </div>
          <div className="geovision-hero-actions">
            <button className="btn-primary" onClick={() => navigate("/contact")}>Parler a un expert</button>
            <button className="btn-secondary" onClick={() => navigate("/produits")}>Voir la boutique</button>
          </div>
        </div>
      </section>

      <section className="geovision-categories">
        <div className="section-header">
          <h2>Types d'equipements Geovision</h2>
          <p>Une gamme complete d'outils de surveillance et de securite.</p>
        </div>
        <div className="geovision-categories-grid">
          {geovisionTypes.map((item) => (
            <article key={item.title} className="geovision-card">
              <div className="geovision-card-body">
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="geovision-categories">
        <div className="pp-container pp-hero">
          <div className="pp-heading">
            <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
            <h2>Catalogues par categorie</h2>
          </div>

          <div className="pp-category-pills" role="tablist" aria-label="Catégories principales">
            <button type="button" className={`pp-pill ${activePill === 'all' ? 'is-active' : ''}`} aria-pressed={activePill === 'all'} title="Toutes catégories" onClick={() => { setActivePill('all'); setSearchQuery(''); }}>Toutes</button>
            {geovisionTypes.map((t) => {
              const pillKey = normalizeText((t.title || ''));
              return (
                <button
                  key={`type-${pillKey}`}
                  type="button"
                  className={`pp-pill ${activePill === pillKey ? 'is-active' : ''}`}
                  title={t.title}
                  onClick={() => { setActivePill(pillKey); setSearchQuery(''); }}
                >{t.title}</button>
              );
            })}
          </div>

          <div className="pp-search-wrap" style={{ marginBottom: '12px' }}>
            <div className="mx-auto w-full max-w-[480px]">
              <label htmlFor="geovision-search" className="sr-only">Rechercher des produits</label>
              <div className="group flex items-center border-2 border-gray-100 rounded-full bg-white shadow-sm hover:shadow-lg hover:border-gray-200 overflow-hidden h-10 px-1 transition-all duration-300 focus-within:border-amber-400 focus-within:shadow-lg focus-within:shadow-amber-100">
                <span className="pl-4 pr-2 text-gray-400">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  id="geovision-search"
                  type="text"
                  className="h-full w-full border-0 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none transition-all duration-150"
                  placeholder="Rechercher un produit..."
                  aria-label="Rechercher des produits"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button
                  type="button"
                  className="btn-primary h-6 px-3 mr-2 rounded-full text-white text-[11px] font-semibold shadow hover:shadow-md focus:outline-none transition-all duration-150 active:scale-95 hover:scale-105"
                  onClick={() => { /* search handled by onChange */ }}
                  aria-label="Rechercher"
                  title="Rechercher"
                >
                  Rechercher
                </button>
              </div>
            </div>
          </div>

          <div className="pp-filters-wrap">
            <div className="pp-filters-mobile">
              <div className="pp-filters-mobile-top">
                <button type="button" className="pp-filter-btn">
                  <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line></svg>
                  Filtres
                  <svg className="pp-chevron" viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6"></path></svg>
                </button>
                <span className="pp-count">{visibleProducts.length + ' résultats'}</span>
              </div>
            </div>
            <div className="pp-filters-desktop">
              <svg viewBox="0 0 24 24" className="pp-filter-icon" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4"></line><line x1="10" x2="3" y1="4" y2="4"></line><line x1="21" x2="12" y1="12" y2="12"></line><line x1="8" x2="3" y1="12" y2="12"></line><line x1="21" x2="16" y1="20" y2="20"></line><line x1="12" x2="3" y1="20" y2="20"></line><line x1="14" x2="14" y1="2" y2="6"></line><line x1="8" x2="8" y1="10" y2="14"></line><line x1="16" x2="16" y1="18" y2="22"></line></svg>
              <div className="pp-filters-row">
                <select>
                  <option value="">Tout</option>
                  {geovisionTypes.map((t) => (
                    <option key={`opt-${t.title}`} value={t.title}>{t.title}</option>
                  ))}
                </select>
                <select>
                  <option value="all">Tous états</option>
                  <option value="disponible">Disponible</option>
                  <option value="occasion">Occasion</option>
                </select>
                <select>
                  <option value="recent">Plus récents</option>
                  <option value="nom_asc">Nom A-Z</option>
                  <option value="nom_desc">Nom Z-A</option>
                </select>
              </div>
              <span className="pp-count">{visibleProducts.length + ' résultats'}</span>
            </div>
          </div>

          <div className="pp-grid" aria-label="Produits Geovision">
            {visibleProducts.length === 0 ? (
              <div className="pp-empty">Aucun produit trouvé pour cette catégorie.</div>
            ) : (
              visibleProducts.map((p) => (
                <article key={p.id} className="pp-card">
                  <a className="pp-image-wrap" href={`#/geovision/catalogue/${encodeURIComponent(p.type)}`} onClick={(e) => { e.preventDefault(); navigate(`/geovision/catalogue/${encodeURIComponent(p.type)}`); }}>
                    <img alt={p.nom} className="pp-image" loading="lazy" src={p.image} onError={(e) => { e.target.src = "/images/geovision/cam1.webp"; }} />
                    <div className="pp-image-overlay"></div>
                    <span className="pp-badge pp-badge--neuf">{p.type}</span>
                    <div className="pp-img-actions">
                      <button className="pp-icon-btn pp-icon-btn--fav" type="button" aria-label="Ajouter aux favoris" onClick={(e) => e.preventDefault()}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"></path></svg>
                      </button>
                      <button className="pp-icon-btn pp-icon-btn--view" type="button" aria-label="Aperçu rapide" onClick={(e) => { e.preventDefault(); navigate(`/geovision/catalogue/${encodeURIComponent(p.type)}`); }}>
                        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0"></path><circle cx="12" cy="12" r="3"></circle></svg>
                      </button>
                    </div>
                  </a>
                  <div className="pp-body">
                    <h3 className="pp-title">{p.nom}</h3>
                    <p className="pp-desc">{p.description}</p>
                    <div className="pp-footer-row">
                      <button className="pp-add-btn" onClick={() => navigate(`/geovision/catalogue/${encodeURIComponent(p.type)}`)}>Voir →</button>
                    </div>
                  </div>
                </article>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
