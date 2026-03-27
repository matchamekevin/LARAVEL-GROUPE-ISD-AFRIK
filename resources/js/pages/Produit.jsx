import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCategories, getProduits } from "../services/ProduitService";
import {
  ENGINEERING_DELIVERY_STEPS,
  PRODUCT_CATEGORY_DEFINITIONS,
  PRODUCT_CATEGORY_SLUGS,
  PRODUCT_MODEL_INDEX,
  PRODUCT_SUBCATEGORY_INDEX,
} from "../data/engineeringCatalog";
import { isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import "../styles/produit.css";

const CATEGORY_IMAGES = {
  ingenierie: "/images/solutions/im1.webp",
  "archivage-numerique": "/images/solutions/im2.webp",
  "materiel-informatique": "/images/produits/proj.webp",
  "reseau-informatique": "/images/produits/int.webp",
  incendie: "/images/produits/ond.webp",
  telecommunications: "/images/solutions/im3.webp",
  "securite-informatique-base-de-donnees": "/images/produits/int.webp",
  energie: "/images/produits/ond.webp",
};

const CATEGORY_THEMES = {
  ingenierie: { accent: "#ff8a1f", soft: "#ffd5ad" },
  "archivage-numerique": { accent: "#0ea5e9", soft: "#bae6fd" },
  "materiel-informatique": { accent: "#8b5cf6", soft: "#ddd6fe" },
  "reseau-informatique": { accent: "#14b8a6", soft: "#99f6e4" },
  incendie: { accent: "#ef4444", soft: "#fecaca" },
  telecommunications: { accent: "#f59e0b", soft: "#fde68a" },
  "securite-informatique-base-de-donnees": { accent: "#06b6d4", soft: "#a5f3fc" },
  energie: { accent: "#65a30d", soft: "#d9f99d" },
};

const flattenCategories = (items = [], depth = 0) =>
  items.flatMap((item) => {
    const children = item.children_recursive || item.children || [];
    return [{ ...item, depth }, ...flattenCategories(children, depth + 1)];
  });

const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildChildrenByParent = (categories) => {
  return categories.reduce((accumulator, item) => {
    if (!item.parent_id) {
      return accumulator;
    }

    const key = String(item.parent_id);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});
};

const getDescendantIds = (rootId, categories) => {
  const byParent = buildChildrenByParent(categories);
  const stack = [Number(rootId)];
  const ids = [];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || ids.includes(currentId)) {
      continue;
    }

    ids.push(currentId);
    const children = byParent[String(currentId)] || [];
    children.forEach((child) => stack.push(Number(child.id_categorie || child.id)));
  }

  return ids;
};

const formatPrice = (value) => Number(value || 0).toLocaleString("fr-FR");

const statusLabel = (statut) => {
  if (statut === "disponible") return "Disponible";
  if (statut === "occasion") return "Occasion";
  if (statut === "rupture") return "Rupture";
  if (!statut) return "N/A";
  return `${statut.charAt(0).toUpperCase()}${statut.slice(1)}`;
};

const statusClasses = {
  disponible: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  actif: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  occasion: "bg-amber-100 text-amber-800 border border-amber-200",
  rupture: "bg-rose-100 text-rose-800 border border-rose-200",
  indisponible: "bg-rose-100 text-rose-800 border border-rose-200",
};

const getProductImage = (produit) => {
  const directImage = produit.image_url || produit.images?.[0]?.url || produit.images?.[0]?.path;
  if (directImage) {
    return directImage;
  }

  const titre = String(produit.titre || "").toLowerCase();
  const modele = String(produit.modele || "").toLowerCase();
  const category = normalizeSlug(produit.categorie?.slug || produit.categorie?.nom || "");

  if (titre.includes("drone") || modele.includes("dji") || category.includes("drone")) {
    return "/images/produits/drone.webp";
  }
  if (titre.includes("tpe") || category.includes("tpe")) {
    return "/images/produits/tpe.webp";
  }
  if (category.includes("reseau") || category.includes("securite")) {
    return "/images/produits/int.webp";
  }
  if (category.includes("energie") || category.includes("incendie")) {
    return "/images/produits/ond.webp";
  }

  return "/images/produits/proj.webp";
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
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeCategorySlug, setActiveCategorySlug] = useState(PRODUCT_CATEGORY_SLUGS[0] || "ingenierie");
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());

  const categoriesById = useMemo(() => {
    return categories.reduce((accumulator, item) => {
      accumulator[Number(item.id_categorie || item.id)] = item;
      return accumulator;
    }, {});
  }, [categories]);

  const mainCategories = useMemo(() => {
    return PRODUCT_CATEGORY_DEFINITIONS.map((definition) => {
      const node = categories.find((item) => normalizeSlug(item.slug || item.nom) === definition.slug) || null;
      return {
        ...definition,
        id: node ? Number(node.id_categorie || node.id) : null,
        node,
      };
    });
  }, [categories]);

  const activeCategory = useMemo(() => {
    return mainCategories.find((item) => item.slug === activeCategorySlug) || mainCategories[0] || null;
  }, [activeCategorySlug, mainCategories]);

  const subcategories = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    if (activeCategory.id) {
      const realChildren = categories
        .filter((item) => Number(item.parent_id) === Number(activeCategory.id))
        .sort((a, b) => (a.ordre || 0) - (b.ordre || 0));

      if (realChildren.length > 0) {
        return realChildren.map((item) => {
          const itemSlug = normalizeSlug(item.slug || item.nom);
          const fallback = PRODUCT_SUBCATEGORY_INDEX[itemSlug] || null;
          return {
            id: Number(item.id_categorie || item.id),
            slug: itemSlug,
            label: item.nom,
            description: item.description || fallback?.description || "",
            fallbackModels: PRODUCT_MODEL_INDEX[itemSlug] || [],
          };
        });
      }
    }

    return (activeCategory.subcategories || []).map((item) => ({
      id: null,
      slug: item.slug,
      label: item.label,
      description: item.description,
      fallbackModels: item.models || [],
    }));
  }, [activeCategory, categories]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedSubcategoryId && !selectedSubcategorySlug) {
      return null;
    }

    if (selectedSubcategoryId) {
      const direct = subcategories.find((item) => String(item.id) === String(selectedSubcategoryId));
      if (direct) {
        return direct;
      }
    }

    if (selectedSubcategorySlug) {
      return subcategories.find((item) => item.slug === selectedSubcategorySlug) || null;
    }

    return null;
  }, [selectedSubcategoryId, selectedSubcategorySlug, subcategories]);

  const searchNormalized = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  const filteredSubcategories = useMemo(() => {
    if (!searchNormalized) {
      return subcategories;
    }

    return subcategories.filter((item) => {
      const haystack = `${item.label} ${item.description || ""}`.toLowerCase();
      return haystack.includes(searchNormalized);
    });
  }, [searchNormalized, subcategories]);

  const countsBySubcategory = useMemo(() => {
    const buckets = {};
    if (!activeCategory?.id) {
      return buckets;
    }

    const subcategoryIds = new Set(subcategories.filter((item) => item.id).map((item) => Number(item.id)));

    produits.forEach((produit) => {
      let current = Number(produit.id_categorie || produit.categorie?.id_categorie || 0);
      let guard = 0;

      while (current && guard < 15) {
        if (subcategoryIds.has(current)) {
          buckets[current] = (buckets[current] || 0) + 1;
          break;
        }

        const parent = categoriesById[current];
        current = Number(parent?.parent_id || 0);
        guard += 1;
      }
    });

    return buckets;
  }, [activeCategory, categoriesById, produits, subcategories]);

  const modelCards = useMemo(() => {
    if (!selectedSubcategory) {
      return [];
    }

    const byModel = {};
    produits.forEach((item) => {
      const modelName = String(item.modele || "").trim();
      if (!modelName) {
        return;
      }

      const key = modelName.toLowerCase();
      if (!byModel[key]) {
        byModel[key] = {
          name: modelName,
          count: 0,
          source: "db",
        };
      }

      byModel[key].count += 1;
    });

    let cards = Object.values(byModel).sort((a, b) => a.name.localeCompare(b.name, "fr"));

    if (cards.length === 0) {
      cards = (selectedSubcategory.fallbackModels || []).map((modelName) => ({
        name: modelName,
        count: 0,
        source: "catalogue",
      }));
    }

    if (searchNormalized) {
      return cards.filter((item) => item.name.toLowerCase().includes(searchNormalized));
    }

    return cards;
  }, [produits, searchNormalized, selectedSubcategory]);

  const produitsModele = useMemo(() => {
    if (!selectedModel) {
      return [];
    }

    return produits.filter((item) => String(item.modele || "").trim().toLowerCase() === selectedModel.toLowerCase());
  }, [produits, selectedModel]);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories({ segment: "general", tree: 1 });
        const tree = response.data?.data || response.data || [];
        setCategories(flattenCategories(tree));
      } catch {
        setCategories([]);
      }
    };

    loadCategories();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoriesParam = String(params.get("categories") || "")
      .split(",")
      .map((item) => normalizeSlug(item))
      .filter(Boolean);
    const modelParam = String(params.get("modele") || "").trim();

    if (categoriesParam.length === 0) {
      return;
    }

    const requestedCategory = categoriesParam.find((slug) => PRODUCT_CATEGORY_SLUGS.includes(slug));
    if (requestedCategory) {
      setActiveCategorySlug(requestedCategory);
    }

    const categoryFromDb = categories.find((item) => {
      const slug = normalizeSlug(item.slug || item.nom);
      return categoriesParam.includes(slug);
    });

    if (categoryFromDb) {
      const ownSlug = normalizeSlug(categoryFromDb.slug || categoryFromDb.nom);
      const parent = categoriesById[Number(categoryFromDb.parent_id)];
      const parentSlug = normalizeSlug(parent?.slug || parent?.nom || "");

      if (PRODUCT_CATEGORY_SLUGS.includes(ownSlug)) {
        setActiveCategorySlug(ownSlug);
        setSelectedSubcategoryId("");
        setSelectedSubcategorySlug("");
      } else if (PRODUCT_CATEGORY_SLUGS.includes(parentSlug)) {
        setActiveCategorySlug(parentSlug);
        setSelectedSubcategoryId(String(categoryFromDb.id_categorie || categoryFromDb.id));
        setSelectedSubcategorySlug(ownSlug);
      }
    }

    if (modelParam) {
      setSelectedModel(modelParam);
    }
  }, [categories, categoriesById, location.search]);

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
    const loadProduits = async () => {
      if (!activeCategory) {
        return;
      }

      setLoading(true);
      setError("");

      try {
        const params = {
          segment: "general",
          tri: "recent",
          par_page: selectedModel ? 100 : 250,
        };

        const categoryIds = [];

        if (selectedSubcategoryId) {
          categoryIds.push(...getDescendantIds(Number(selectedSubcategoryId), categories));
        } else if (activeCategory.id) {
          const descendants = getDescendantIds(Number(activeCategory.id), categories);
          descendants.forEach((id) => {
            if (id !== Number(activeCategory.id)) {
              categoryIds.push(id);
            }
          });
        }

        if (categoryIds.length > 0) {
          params.id_categorie = Array.from(new Set(categoryIds)).join(",");
        }

        if (selectedModel) {
          params.modele = selectedModel;
        }

        if (selectedModel && searchNormalized) {
          params.q = searchNormalized;
        }

        const response = await getProduits(params);
        setProduits(response.data?.data || []);
      } catch {
        setError("Impossible de charger les produits pour le moment.");
        setProduits([]);
      } finally {
        setLoading(false);
      }
    };

    loadProduits();
  }, [activeCategory, categories, searchNormalized, selectedModel, selectedSubcategoryId]);

  const searchPlaceholder = selectedModel
    ? "Rechercher un produit dans ce modele"
    : selectedSubcategory
      ? "Rechercher un modele"
      : "Rechercher une sous-categorie";

  const activeTheme = CATEGORY_THEMES[activeCategorySlug] || {
    accent: "#ff8a1f",
    soft: "#ffd5ad",
  };

  const handleCategoryChange = (slug) => {
    setActiveCategorySlug(slug);
    setSelectedSubcategoryId("");
    setSelectedSubcategorySlug("");
    setSelectedModel("");
    setSearchTerm("");
  };

  const handleSubcategoryClick = (item) => {
    setSelectedSubcategoryId(item.id ? String(item.id) : "");
    setSelectedSubcategorySlug(item.slug || "");
    setSelectedModel("");
    setSearchTerm("");
  };

  const handleModelClick = (modelName) => {
    const matching = produits.filter(
      (item) => String(item.modele || "").trim().toLowerCase() === String(modelName).trim().toLowerCase()
    );

    if (matching.length === 1) {
      navigate(`/produits/${matching[0].id_produit}`);
      return;
    }

    setSelectedModel(modelName);
    setSearchTerm("");
  };

  return (
    <section className="pcat-shell" style={{ "--pcat-accent": activeTheme.accent, "--pcat-accent-soft": activeTheme.soft }}>
      <div className="pcat-bg-layer" aria-hidden="true" />
      <div className="pcat-container">
        <section className="pcat-hero">
          <div className="pcat-hero-topline">
            <span className="pcat-hero-kicker">Catalogue Produits</span>
            {activeCategory?.label && <span className="pcat-hero-tag">Focus: {activeCategory.label}</span>}
          </div>

          <h1 className="pcat-hero-title">Parcourez notre catalogue en 3 etapes simples</h1>
          <p className="pcat-hero-text">
            Selectionnez une categorie, puis une sous-categorie en cartes visuelles. Choisissez ensuite un modele
            pour afficher ses produits et ouvrir la fiche detaillee.
          </p>

          <div className="pcat-steps">
            {ENGINEERING_DELIVERY_STEPS.map((step, index) => (
              <div key={step} className="pcat-step-item">
                <span className="pcat-step-index">0{index + 1}</span>
                <span>{step}</span>
              </div>
            ))}
          </div>

          <label className="pcat-search" aria-label="Recherche catalogue">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M11 19a8 8 0 1 1 5.293-14.002A8 8 0 0 1 11 19Zm9.707 1.293-4.52-4.52" />
            </svg>
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={searchPlaceholder}
            />
            {searchTerm && (
              <button type="button" onClick={() => setSearchTerm("")} className="pcat-search-clear" aria-label="Effacer la recherche">
                x
              </button>
            )}
          </label>
        </section>

        <section className="pcat-main-pills" aria-label="Categories principales">
          {mainCategories.map((item) => {
            const active = item.slug === activeCategorySlug;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => handleCategoryChange(item.slug)}
                className={`pcat-pill ${active ? "is-active" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </section>

        {(selectedSubcategory || selectedModel) && (
          <section className="pcat-breadcrumb">
            <div className="pcat-breadcrumb-actions">
              <button
                type="button"
                className="pcat-outline-btn"
                onClick={() => {
                  setSelectedSubcategoryId("");
                  setSelectedSubcategorySlug("");
                  setSelectedModel("");
                  setSearchTerm("");
                }}
              >
                Retour sous-categories
              </button>

              {selectedSubcategory && (
                <button
                  type="button"
                  className="pcat-outline-btn"
                  onClick={() => {
                    setSelectedModel("");
                    setSearchTerm("");
                  }}
                >
                  Retour modeles
                </button>
              )}
            </div>

            <p className="pcat-breadcrumb-path">
              {activeCategory?.label}
              {selectedSubcategory ? ` / ${selectedSubcategory.label}` : ""}
              {selectedModel ? ` / ${selectedModel}` : ""}
            </p>
          </section>
        )}

        {!selectedSubcategory && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Sous-categories</h2>
              <p>Choisissez une famille pour afficher les modeles disponibles.</p>
            </div>

            <div className="pcat-sub-grid">
              {filteredSubcategories.map((item) => (
                <article key={`${item.slug}-${item.id || "catalog"}`} className="pcat-sub-card">
                  <div className="pcat-sub-visual">
                    <img
                      src={CATEGORY_IMAGES[activeCategory?.slug] || "/images/produits/proj.webp"}
                      alt={item.label}
                      loading="lazy"
                    />
                    <div className="pcat-sub-overlay" aria-hidden="true" />
                  </div>

                  <div className="pcat-sub-content">
                    <h3>{item.label}</h3>
                    <p>{item.description || "Selectionnez cette sous-categorie pour afficher les modeles precis."}</p>
                    <div className="pcat-sub-footer">
                      <span className="pcat-sub-count">
                        {item.id ? `${countsBySubcategory[item.id] || 0} produit(s) DB` : "Catalogue modele"}
                      </span>
                      <button type="button" onClick={() => handleSubcategoryClick(item)} className="pcat-solid-btn">
                        Voir modeles
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>

            {!loading && filteredSubcategories.length === 0 && (
              <div className="pcat-empty-box">Aucune sous-categorie ne correspond a votre recherche.</div>
            )}
          </section>
        )}

        {selectedSubcategory && !selectedModel && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Modeles precis</h2>
              <p>Cliquez sur un modele pour afficher les produits associes.</p>
            </div>

            <div className="pcat-model-grid">
              {modelCards.map((item) => (
                <article key={`${selectedSubcategory.slug}-${item.name}`} className="pcat-model-card">
                  <h3>{item.name}</h3>
                  <p>{item.source === "db" ? `${item.count} produit(s) en base` : "Modele de reference catalogue"}</p>
                  <button type="button" onClick={() => handleModelClick(item.name)} className="pcat-solid-btn">
                    Voir produits / detail
                  </button>
                </article>
              ))}
            </div>

            {!loading && modelCards.length === 0 && (
              <div className="pcat-empty-box">Aucun modele trouve pour cette sous-categorie.</div>
            )}
          </section>
        )}

        {selectedModel && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Produits du modele {selectedModel}</h2>
            </div>

            {error && <p className="pcat-error-text">{error}</p>}

            <div className="pcat-product-grid">
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <article key={`skeleton-${index}`} className="pcat-product-card is-skeleton">
                  <div className="pcat-product-image-wrap" />
                  <div className="pcat-product-body">
                    <div className="pcat-skeleton-line" />
                    <div className="pcat-skeleton-line short" />
                  </div>
                </article>
              ))}

              {!loading && produitsModele.map((produit) => {
                const prixFinal = produit.prix_promo ?? produit.prix;
                const isFav = favoriteIds.has(Number(produit.id_produit));
                const badgeClass = statusClasses[produit.statut] || "bg-slate-100 text-slate-800 border border-slate-200";

                return (
                  <article key={produit.id_produit} className="pcat-product-card">
                    <div className="pcat-product-image-wrap">
                      <img src={getProductImage(produit)} alt={produit.titre} className="pcat-product-image" loading="lazy" />

                      <span className={`pcat-status-chip ${badgeClass}`}>{statusLabel(produit.statut)}</span>

                      <button
                        type="button"
                        className={`pcat-fav-btn ${isFav ? "is-active" : ""}`}
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        onClick={() => toggleFavorite(produit)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                    </div>

                    <div className="pcat-product-body">
                      <p className="pcat-brand">{produit.marque || "Marque non renseignee"}</p>
                      <h3 className="pcat-title">{produit.titre}</h3>
                      <p className="pcat-description">{produit.description_courte || produit.description || "Description en cours."}</p>

                      <div className="pcat-rating-row">
                        <Stars note={produit.note_moyenne} />
                        <span>{produit.nombre_avis > 0 ? `(${produit.nombre_avis})` : "Aucun avis"}</span>
                      </div>

                      <div className="pcat-footer-row">
                        <p className="pcat-price">{formatPrice(prixFinal)} FCFA</p>
                        <button type="button" onClick={() => navigate(`/produits/${produit.id_produit}`)} className="pcat-solid-btn">
                          Voir detail
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && !error && produitsModele.length === 0 && (
              <div className="pcat-empty-box">Aucun produit detaille trouve pour ce modele.</div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
