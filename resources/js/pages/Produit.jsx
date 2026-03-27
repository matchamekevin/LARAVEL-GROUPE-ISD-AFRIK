import React, { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { getCategories, getProduits } from "../services/ProduitService";
import { isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import "../styles/produit.css";

const flattenCategories = (items = [], depth = 0) =>
  items.flatMap((item) => {
    const children = item.children_recursive || item.children || [];
    return [{ ...item, depth }, ...flattenCategories(children, depth + 1)];
  });

const getDescendantIds = (rootId, categories) => {
  const byParent = categories.reduce((acc, item) => {
    const key = item.parent_id == null ? "root" : String(item.parent_id);
    if (!acc[key]) acc[key] = [];
    acc[key].push(item);
    return acc;
  }, {});

  const stack = [Number(rootId)];
  const ids = [];
  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || ids.includes(currentId)) continue;
    ids.push(currentId);
    const children = byParent[String(currentId)] || [];
    children.forEach((child) => stack.push(Number(child.id_categorie)));
  }

  return ids;
};

const isInBranch = (selectedId, branchRootId, categoriesById) => {
  let current = categoriesById[Number(selectedId)] || null;

  while (current) {
    if (Number(current.id_categorie) === Number(branchRootId)) return true;
    if (!current.parent_id) return false;
    current = categoriesById[Number(current.parent_id)] || null;
  }

  return false;
};

const formatPrice = (value) => Number(value || 0).toLocaleString("fr-FR");

const statusLabel = (statut) => {
  if (statut === "disponible") return "Neuf";
  if (statut === "occasion") return "Occasion";
  if (statut === "rupture") return "Rupture";
  if (!statut) return "N/A";
  return `${statut.charAt(0).toUpperCase()}${statut.slice(1)}`;
};

const statusClass = (statut) => {
  if (statut === "occasion") return "pp-badge pp-badge--occasion";
  if (statut === "rupture") return "pp-badge pp-badge--rupture";
  return "pp-badge pp-badge--neuf";
};
const getProductImage = (produit) => {
  const titre = produit.titre?.toLowerCase() || "";
  const categorie = produit.categorie?.nom?.toLowerCase() || "";

  // Mapping basé sur le titre ou la catégorie
  if (titre.includes("drone") || categorie.includes("drone")) {
    return "/images/produits/drone.webp";
  }
  if (titre.includes("tpe") || categorie.includes("tpe")) {
    return "/images/produits/tpe.webp";
  }
  if (titre.includes("instrumentation") || titre.includes("int")) {
    return "/images/produits/int.webp";
  }
  if (titre.includes("maintenance") || titre.includes("ond")) {
    return "/images/produits/ond.webp";
  }
  if (titre.includes("étude") || titre.includes("conseil") || titre.includes("proj")) {
    return "/images/produits/proj.webp";
  }

  // Images par défaut selon l'ID pour éviter les répétitions
  const images = [
    "/images/produits/drone1.webp",
    "/images/produits/tpe1.webp",
    "/images/produits/tpe2.webp"
  ];
  return images[produit.id_produit % images.length] || "/images/produits/drone.webp";
};
const readSpecs = (specifications) => {
  if (!specifications) return [];

  try {
    const data = typeof specifications === "string"
      ? JSON.parse(specifications)
      : specifications;

    if (Array.isArray(data)) {
      return data
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            return item.valeur || item.value || item.label || "";
          }
          return "";
        })
        .filter(Boolean)
        .slice(0, 3);
    }

    if (data && typeof data === "object") {
      return Object.entries(data)
        .slice(0, 3)
        .map(([key, value]) => `${key}: ${value}`);
    }
  } catch {
    return [];
  }

  return [];
};

function Stars({ note = 0 }) {
  const rounded = Math.round(Number(note || 0));

  return (
    <div className="pp-stars" aria-label={`Note ${rounded} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={`pp-star ${i <= rounded ? "is-filled" : ""}`} aria-hidden="true">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>
      ))}
    </div>
  );
}

export default function Produits() {
  const navigate = useNavigate();
  const [produits, setProduits] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  // Détection dynamique de la hauteur de la navigation pour centrer le hero
  useEffect(() => {
    const selector = 'header, nav, .navbar, .site-nav, #navbar, [data-navbar]';
    const computeOffset = () => {
      try {
        const el = document.querySelector(selector);
        const h = el ? Math.ceil(el.getBoundingClientRect().height) : 100;
        // Ajouter un petit offset supplémentaire (8px)
        document.documentElement.style.setProperty('--pp-hero-offset', `${h + 8}px`);
      } catch (e) {
        document.documentElement.style.setProperty('--pp-hero-offset', `100px`);
      }
    };

    computeOffset();
    window.addEventListener('resize', computeOffset);

    const mo = new MutationObserver(() => computeOffset());
    mo.observe(document.body, { childList: true, subtree: true, attributes: true });

    return () => {
      window.removeEventListener('resize', computeOffset);
      mo.disconnect();
    };
  }, []);

  const [filtres, setFiltres] = useState({
    id_categorie: "all",
    statut: "all",
    tri: "recent",
  });

  const categoriesById = useMemo(() => {
    return categories.reduce((acc, item) => {
      acc[Number(item.id_categorie)] = item;
      return acc;
    }, {});
  }, [categories]);

  const engineeringRoot = useMemo(() => {
    return categories.find((item) => String(item.slug || "").toLowerCase() === "ingenierie") || null;
  }, [categories]);

  const engineeringFamilies = useMemo(() => {
    if (!engineeringRoot) return [];
    return categories
      .filter((item) => Number(item.parent_id) === Number(engineeringRoot.id_categorie))
      .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));
  }, [categories, engineeringRoot]);

  const location = useLocation();

  useEffect(() => {
    const refreshFavorites = () => {
      const next = new Set();
      produits.forEach((item) => {
        const id = Number(item.id_produit || item.id);
        if (id && isFavorite(id)) {
          next.add(id);
        }
      });
      setFavoriteIds(next);
    };

    refreshFavorites();
    return subscribeStoreUpdates(refreshFavorites);
  }, [produits]);


  useEffect(() => {
    const loadCategories = async () => {
      try {
        const res = await getCategories({ segment: "general", tree: 1 });
        const tree = res.data?.data || res.data || [];
        setCategories(flattenCategories(tree));
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  // Si l'URL contient ?categories=slug1,slug2 alors mapper les slugs vers les ids
  useEffect(() => {
    if (!location.search) return;
    const params = new URLSearchParams(location.search);
    const cats = params.get('categories');
    if (!cats) return;
    // n'appliquer que si les catégories sont chargées
    if (!categories || categories.length === 0) return;

    const normalize = (s) => String(s || '')
      .normalize('NFD')
      .replace(/\p{Diacritic}/gu, '')
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    const slugs = cats.split(',').map(s => normalize(s.trim())).filter(Boolean);

    const ids = [];
    slugs.forEach((slug) => {
      // exact slug match
      let found = categories.find((c) => normalize(c.slug) === slug);
      if (found) { ids.push(Number(found.id_categorie || found.id)); return; }

      // contains match on slug
      found = categories.find((c) => normalize(c.slug).includes(slug));
      if (found) { ids.push(Number(found.id_categorie || found.id)); return; }

      // match on name (nom)
      found = categories.find((c) => normalize(c.nom) === slug || normalize(c.nom).includes(slug));
      if (found) { ids.push(Number(found.id_categorie || found.id)); return; }
    });

    const uniq = Array.from(new Set(ids)).filter(Boolean);
    if (uniq.length === 1) {
      setFiltres((prev) => ({ ...prev, id_categorie: Number(uniq[0]) }));
    } else if (uniq.length > 1) {
      // set as array of ids; loadProduits will join them into CSV
      setFiltres((prev) => ({ ...prev, id_categorie: uniq }));
    }
  }, [location.search, categories]);

  // Categories à afficher dans le <select> selon la pillule sélectionnée
  const displayedCategories = useMemo(() => {
    if (!Array.isArray(categories)) return [];
    if (filtres.id_categorie === 'all') return categories;

    const parentId = Number(filtres.id_categorie);
    if (Number.isNaN(parentId)) return categories;

    // Trouver le parent et ses enfants
    const parent = categories.find((c) => Number(c.id_categorie) === parentId);
    const children = categories.filter((c) => Number(c.parent_id) === parentId);

    // Si parent existe, placer parent en tête puis children
    if (parent) return [parent, ...children];

    // Si pas de parent (peut être un sous-catégorie déjà sélectionnée), afficher cette catégorie seulement
    const self = categories.filter((c) => Number(c.id_categorie) === parentId);
    if (self.length) return self;

    return categories;
  }, [categories, filtres.id_categorie]);

  useEffect(() => {
    const loadProduits = async () => {
      setLoading(true);
      setError("");
      try {
        const params = {
          par_page: 12,
          page,
          tri: filtres.tri,
          segment: "general",
        };

        if (filtres.id_categorie !== "all") {
          if (Array.isArray(filtres.id_categorie)) {
            params.id_categorie = filtres.id_categorie.join(',');
          } else {
            const selectedId = Number(filtres.id_categorie);
            const branchIds = getDescendantIds(selectedId, categories);
            params.id_categorie = branchIds.join(',');
          }
        }
        if (filtres.statut !== "all") params.statut = filtres.statut;
        if (filtres.q) params.q = filtres.q;

        const res = await getProduits(params);
        const incoming = res.data?.data || [];

        setProduits((prev) => {
          if (page === 1) return incoming;

          const seen = new Set(prev.map((item) => item.id_produit));
          const merged = [...prev];

          incoming.forEach((item) => {
            if (!seen.has(item.id_produit)) {
              merged.push(item);
            }
          });

          return merged;
        });
        setTotal(res.data?.meta?.total || 0);
      } catch {
        setError("Impossible de charger les produits pour le moment.");
        setProduits([]);
        setTotal(0);
      } finally {
        setLoading(false);
      }
    };

    loadProduits();
  }, [filtres, page]);

  // Debounce search input and map to filtres.q
  useEffect(() => {
    const id = setTimeout(() => {
      // setFilter will reset page to 1
      setFilter("q", search.trim());
    }, 400);

    return () => clearTimeout(id);
  }, [search]);

  const hasMore = useMemo(() => page * 12 < total, [page, total]);

  const setFilter = (key, value) => {
    setPage(1);
    setFiltres((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <section className="pp-container pp-hero">
      <div className="pp-heading">
        <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true">
          <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          <path d="M20 3v4" />
          <path d="M22 5h-4" />
          <path d="M4 17v2" />
          <path d="M5 18H3" />
        </svg>
        <h2>Nos Produits</h2>
      </div>

      {/* Barre de pillules centrée (Toutes + 4 catégories principales) */}
      <div className="pp-category-pills" role="tablist" aria-label="Catégories principales">
        <button
          type="button"
          className={`pp-pill ${filtres.id_categorie === 'all' ? 'is-active' : ''}`}
          onClick={() => setFilter('id_categorie', 'all')}
          aria-pressed={filtres.id_categorie === 'all'}
          title="Toutes catégories"
        >
          Toutes
        </button>

        {engineeringFamilies.map((cat) => {
          const id = Number(cat.id_categorie);

          const selected = filtres.id_categorie;

          let isActive = false;
          if (selected === 'all') {
            isActive = false;
          } else if (Array.isArray(selected)) {
            isActive = selected.some((s) => isInBranch(Number(s), id, categoriesById));
          } else {
            isActive = isInBranch(Number(selected), id, categoriesById);
          }

          return (
            <button
              key={id}
              type="button"
              className={`pp-pill ${isActive ? 'is-active' : ''}`}
              onClick={() => { if (id) setFilter('id_categorie', id); }}
              aria-pressed={isActive}
              title={cat.nom}
            >
              {cat.nom}
            </button>
          );
        })}
        </div>

      {/* Barre de recherche centrée et stylisée */}
      <div className="pp-search-wrap">
        <div className="pp-search">
          <svg viewBox="0 0 24 24" className="pp-search-icon" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" stroke="currentColor" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <input
            type="search"
            className="pp-search-input"
            placeholder="Rechercher"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Rechercher des produits"
          />
          {search && (
            <button
              type="button"
              className="pp-search-clear"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
            >
              <svg viewBox="0 0 24 24" style={{ width: '16px', height: '16px', fill: 'none', stroke: 'currentColor', strokeWidth: '2', strokeLinecap: 'round', strokeLinejoin: 'round' }} aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="pp-filters-wrap">
        <div className="pp-filters-mobile">
          <div className="pp-filters-mobile-top">
            <button type="button" className="pp-filter-btn" onClick={() => setMobileFiltersOpen((v) => !v)}>
              <svg viewBox="0 0 24 24" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></svg>
              Filtres
              <svg className={`pp-chevron ${mobileFiltersOpen ? "is-open" : ""}`} viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            </button>
            <span className="pp-count">{total} produits</span>
          </div>

          {mobileFiltersOpen && (
            <div className="pp-filters-panel">
              <select value={filtres.id_categorie === 'all' ? '' : filtres.id_categorie} onChange={(e) => setFilter("id_categorie", e.target.value || 'all')}>
                <option value="">Tout</option>
                {displayedCategories.map((c) => (
                  <option key={c.id_categorie} value={c.id_categorie}>{c.nom}</option>
                ))}
              </select>

              <select value={filtres.statut} onChange={(e) => setFilter("statut", e.target.value)}>
                <option value="all">Tous états</option>
                <option value="disponible">Neuf</option>
                <option value="occasion">Occasion</option>
                <option value="rupture">Rupture</option>
              </select>

              <select value={filtres.tri} onChange={(e) => setFilter("tri", e.target.value)}>
                <option value="recent">Plus récents</option>
                <option value="prix_asc">Prix croissant</option>
                <option value="prix_desc">Prix décroissant</option>
                <option value="populaire">Populaires</option>
                <option value="note">Mieux notés</option>
              </select>
            </div>
          )}
        </div>

        <div className="pp-filters-desktop">
          <svg viewBox="0 0 24 24" className="pp-filter-icon" aria-hidden="true"><line x1="21" x2="14" y1="4" y2="4" /><line x1="10" x2="3" y1="4" y2="4" /><line x1="21" x2="12" y1="12" y2="12" /><line x1="8" x2="3" y1="12" y2="12" /><line x1="21" x2="16" y1="20" y2="20" /><line x1="12" x2="3" y1="20" y2="20" /><line x1="14" x2="14" y1="2" y2="6" /><line x1="8" x2="8" y1="10" y2="14" /><line x1="16" x2="16" y1="18" y2="22" /></svg>

          <div className="pp-filters-row">
              <select value={filtres.id_categorie === 'all' ? '' : filtres.id_categorie} onChange={(e) => setFilter("id_categorie", e.target.value || 'all')}>
                <option value="">Tout</option>
                {displayedCategories.map((c) => (
                  <option key={c.id_categorie} value={c.id_categorie}>{c.nom}</option>
                ))}
              </select>

            <select value={filtres.statut} onChange={(e) => setFilter("statut", e.target.value)}>
              <option value="all">Tous états</option>
              <option value="disponible">Neuf</option>
              <option value="occasion">Occasion</option>
              <option value="rupture">Rupture</option>
            </select>

            <select value={filtres.tri} onChange={(e) => setFilter("tri", e.target.value)}>
              <option value="recent">Plus récents</option>
              <option value="prix_asc">Prix croissant</option>
              <option value="prix_desc">Prix décroissant</option>
              <option value="populaire">Populaires</option>
              <option value="note">Mieux notés</option>
            </select>
          </div>

          <span className="pp-count">{total} produits</span>
        </div>
      </div>

      {error && <p className="pp-error">{error}</p>}

      <div className="pp-grid" aria-label="Liste des produits">
        {loading && [...Array(8)].map((_, i) => (
          <article className="pp-card pp-card--skeleton" key={i} aria-hidden="true" />
        ))}

        {!loading && produits.map((produit) => {
          const prixFinal = produit.prix_promo ?? produit.prix;
          const specs = readSpecs(produit.specifications);
          const shortDescription = produit.description_courte || produit.description;
          const isFav = favoriteIds.has(Number(produit.id_produit));

          return (
            <article key={produit.id_produit} className="pp-card">
              <Link to={`/produits/${produit.id_produit}`} className="pp-image-wrap">
                <img
                  src={getProductImage(produit)}
                  alt={produit.titre}
                  className="pp-image"
                  loading="lazy"
                />
                <div className="pp-image-overlay" />
                <span className={statusClass(produit.statut)}>{statusLabel(produit.statut)}</span>
              </Link>

              <button
                className={`pp-icon-btn pp-icon-btn--fav ${isFav ? "is-active" : ""}`}
                type="button"
                aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                title={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={() => {
                  toggleFavorite(produit);
                }}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" /></svg>
              </button>

              <button className="pp-icon-btn pp-icon-btn--view" type="button" aria-label="Voir le produit" onClick={() => navigate(`/produits/${produit.id_produit}`)}>
                <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0" /><circle cx="12" cy="12" r="3" /></svg>
              </button>

              <div className="pp-body">
                {produit.marque && <p className="pp-meta">{produit.marque}</p>}
                <h3 className="pp-title">{produit.titre}</h3>

                {shortDescription && (
                  <p className="pp-desc">{shortDescription}</p>
                )}

                <div className="pp-rating-row">
                  <Stars note={produit.note_moyenne} />
                  <span>{produit.nombre_avis > 0 ? `(${produit.nombre_avis})` : "Aucun avis"}</span>
                </div>

                {specs.length > 0 && (
                  <div className="pp-specs">
                    {specs.map((spec) => (
                      <span key={`${produit.id_produit}-${spec}`} className="pp-spec">{spec}</span>
                    ))}
                  </div>
                )}

                <div className="pp-footer-row">
                  <p className="pp-price">{formatPrice(prixFinal)} FCFA</p>
                  <Link to={`/produits/${produit.id_produit}`} className="pp-add-btn">Voir</Link>
                </div>
              </div>
            </article>
          );
        })}

        {!loading && !error && produits.length === 0 && (
          <div className="pp-empty">Aucun produit ne correspond aux filtres actuels.</div>
        )}
      </div>

      {hasMore && !loading && (
        <div className="pp-load-more-wrap">
          <button className="pp-load-more" type="button" onClick={() => setPage((p) => p + 1)}>
            <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 9 6 6 6-6" /></svg>
            Voir plus ({Math.max(total - page * 12, 0)} restants)
          </button>
        </div>
      )}
    </section>
  );
}
