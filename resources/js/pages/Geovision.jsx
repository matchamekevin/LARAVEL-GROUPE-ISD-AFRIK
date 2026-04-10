import React, { useDeferredValue, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/home.css";
import "../styles/geovision-categories.css";
import { getCategories, getProduits } from "../services/ProduitService";
import { useLivePolling } from "../hooks/useLivePolling";
import {
  getCategoryChildren,
  matchCategory,
  normalizeGeovisionKey,
  readGeovisionSpecifications,
  resolveGeovisionImage,
} from "../utils/geovision";

const GEOVISION_FAMILY_ORDER = [
  "geovision-cameras",
  "geovision-controle-acces",
  "geovision-lpr-anpr",
  "geovision-vms-analytics",
  "geovision-systemes-surveillance",
  "geovision-enregistreurs-nvr",
  "geovision-poe-reseau",
  "geovision-ip-speaker-io",
];

const ALL_FAMILY_SLUG = "all";

// Mapping de noms français pour les familles / catégories GeoVision
const CATEGORY_NAME_FR_MAP = {
  "geovision-cameras": "Caméras",
  "geovision-controle-acces": "Contrôle d'accès",
  "geovision-lpr-anpr": "LPR / ANPR",
  "geovision-vms-analytics": "VMS & Analytics",
  "geovision-systemes-surveillance": "Systèmes de surveillance",
  "geovision-enregistreurs-nvr": "Enregistreurs (NVR)",
  "geovision-poe-reseau": "PoE & Réseau",
  "geovision-ip-speaker-io": "Haut-parleurs IP & E/S",
};

function getFrenchCategoryName(category) {
  if (!category) return "";

  const slug = normalizeGeovisionKey(category.slug || "");
  const nameKey = normalizeGeovisionKey(category.nom || "");

  for (const [k, v] of Object.entries(CATEGORY_NAME_FR_MAP)) {
    const short = k.replace(/^geovision-/, "");
    if (slug === k || slug.startsWith(k) || slug.includes(short) || nameKey === k || nameKey.includes(short)) {
      return v;
    }
  }

  return category.nom || "";
}

export default function Geovision() {
  const navigate = useNavigate();
  const location = useLocation();
  const [families, setFamilies] = useState([]);
  const [activeFamilySlug, setActiveFamilySlug] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [modelResults, setModelResults] = useState([]);
  const [modelLoading, setModelLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshToken, setRefreshToken] = useState(0);
  const deferredSearch = useDeferredValue(searchQuery);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");

    getCategories({ segment: "geovision", tree: 1, parent_id: "null" })
      .then((response) => {
        if (!isMounted) return;

        const items = Array.isArray(response.data?.data) ? response.data.data : (response.data || []);
        const geovisionRoots = items.filter((item) => (item.segment || "").toLowerCase() === "geovision");

        const bySlug = geovisionRoots.reduce((acc, item) => {
          acc[item.slug] = item;
          return acc;
        }, {});

        const nextFamilies = GEOVISION_FAMILY_ORDER
          .map((slug) => bySlug[slug])
          .filter(Boolean);

        setFamilies(nextFamilies);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setFamilies([]);
        setError(requestError.response?.data?.message || "Impossible de charger le catalogue GeoVision.");
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  useLivePolling(
    () => {
      setRefreshToken((token) => token + 1);
    },
    {
      intervalMs: 15000,
      enabled: !loading,
    }
  );

  useEffect(() => {
    if (families.length === 0) {
      return;
    }

    const params = new URLSearchParams(location.search || "");
    const familyParam = params.get("famille") || params.get("family");

    if (!String(familyParam || "").trim()) {
      setActiveFamilySlug(ALL_FAMILY_SLUG);
      return;
    }

    if (normalizeGeovisionKey(familyParam) === "tout" || normalizeGeovisionKey(familyParam) === ALL_FAMILY_SLUG) {
      setActiveFamilySlug(ALL_FAMILY_SLUG);
      return;
    }

    const matchedFamily = matchCategory(families, familyParam);

    setActiveFamilySlug(matchedFamily?.slug || ALL_FAMILY_SLUG);
  }, [families, location.search]);

  useEffect(() => {
    const query = String(deferredSearch || "").trim();

    if (query.length < 2) {
      setModelResults([]);
      setModelLoading(false);
      return;
    }

    let isMounted = true;
    const params = {
      segment: "geovision",
      q: query,
      par_page: 24,
      tri: "recent",
    };

    if (activeFamilySlug && activeFamilySlug !== ALL_FAMILY_SLUG) {
      params.category_slug = activeFamilySlug;
      params.include_descendants = 1;
    }

    setModelLoading(true);

    getProduits(params)
      .then((response) => {
        if (!isMounted) return;

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        const uniqueItems = Array.from(
          new Map(items.map((item) => [item.slug || item.id_produit, item])).values()
        );

        setModelResults(uniqueItems);
      })
      .catch(() => {
        if (isMounted) setModelResults([]);
      })
      .finally(() => {
        if (isMounted) setModelLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [deferredSearch, activeFamilySlug]);

  const activeFamily = activeFamilySlug === ALL_FAMILY_SLUG
    ? null
    : families.find((item) => item.slug === activeFamilySlug) || families.find((item) => item.slug === "geovision-cameras") || families[0] || null;

  const familyPool = activeFamilySlug === ALL_FAMILY_SLUG
    ? families
    : (activeFamily ? [activeFamily] : []);
  const normalizedSearch = normalizeGeovisionKey(deferredSearch);
  const isSearching = normalizedSearch.length > 0;

  const visibleCategories = Array.from(
    new Map(
      familyPool
        .flatMap((family) => getCategoryChildren(family))
        .map((category) => [category.slug, category])
    ).values()
  ).filter((category) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = normalizeGeovisionKey([
      category.nom,
      category.description,
      ...getCategoryChildren(category).map((child) => child.nom),
    ].join(" "));

    return haystack.includes(normalizedSearch);
  });

  const handleFamilyChange = (family) => {
    setActiveFamilySlug(family.slug);
    const params = new URLSearchParams(location.search || "");
    if (family.slug === ALL_FAMILY_SLUG) {
      params.delete("famille");
      params.delete("family");
    } else {
      params.set("famille", family.slug);
      params.delete("family");
    }
    params.delete("filter");

    const query = params.toString();
    navigate(query ? `/geovision?${query}` : "/geovision", { replace: true });
  };

  return (
    <div className="home geovision-page">
      <section className="geovision-hero">
        <div className="geovision-hero-inner">
          <div className="section-header">
            <h2>GeoVision</h2>
            <p>Catalogue hiérarchique piloté par la base de données, structuré par familles, catégories et modèles.</p>
          </div>
          <div className="geovision-hero-actions">
            <button className="btn-primary" onClick={() => navigate("/contact")}>Parler à un expert</button>
          </div>
        </div>
      </section>

      <section className="geovision-categories">
        <div className="pp-container pp-hero">
          <div className="pp-heading">
            <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
            <h2>Familles GeoVision</h2>
          </div>

          <div className="pp-category-pills" role="tablist" aria-label="Familles GeoVision">
            {[{ slug: ALL_FAMILY_SLUG, nom: "Tout" }, ...families].map((family) => (
              <button
                key={family.slug}
                type="button"
                className={`pp-pill ${activeFamilySlug === family.slug ? "is-active" : ""}`}
                aria-pressed={activeFamilySlug === family.slug}
                onClick={() => handleFamilyChange(family)}
              >
                {family.nom}
              </button>
            ))}
          </div>

          <div className="pp-search-wrap">
            <div className="mx-auto w-full max-w-[520px]">
                <label htmlFor="geovision-family-search" className="sr-only">Rechercher une catégorie ou un modèle GeoVision</label>
              <div className="group flex items-center border-2 border-gray-100 rounded-full bg-white shadow-sm hover:shadow-lg hover:border-gray-200 overflow-hidden h-10 px-1 transition-all duration-300 focus-within:border-amber-400 focus-within:shadow-lg focus-within:shadow-amber-100">
                <span className="pl-4 pr-2 text-gray-400">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  id="geovision-family-search"
                  type="text"
                  className="h-full w-full border-0 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none transition-all duration-150"
                    placeholder="Rechercher une catégorie ou un modèle spécifique..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          {activeFamily && (
            <div className="geovision-presentation">
              <div className="geovision-logo-section">
                <img
                  src={resolveGeovisionImage(activeFamily, "/images/geovision/logo (GEOVISION).webp")}
                  alt={activeFamily.nom}
                  className="geovision-logo"
                />
              </div>
              <div className="geovision-intro">
                <h2>{activeFamily.nom}</h2>
                <p>{activeFamily.description}</p>
              </div>
            </div>
          )}

          {loading && <div className="pp-empty">Chargement des familles GeoVision...</div>}
          {!loading && error && <div className="pp-empty">{error}</div>}
          {!loading && !error && !modelLoading && isSearching && visibleCategories.length === 0 && modelResults.length === 0 && (
            <div className="pp-empty">Aucune catégorie ou modèle ne correspond à votre recherche.</div>
          )}

          {!loading && !error && isSearching && (
            <div className="pp-group-stack" style={{ marginTop: "1rem" }}>
              <div className="pp-group-section">
                <h3 className="pp-group-title">Modèles trouvés</h3>
                {modelLoading ? (
                  <div className="pp-empty">Recherche des modèles GeoVision...</div>
                ) : modelResults.length === 0 ? (
                  <div className="pp-empty">Aucun modèle trouvé pour cette recherche.</div>
                ) : (
                  <div className="pp-grid" aria-label="Modèles GeoVision trouvés">
                    {modelResults.map((product) => {
                      const specs = readGeovisionSpecifications(product);

                      return (
                        <article key={product.id_produit || product.slug} className="pp-card">
                          <button
                            type="button"
                            className="pp-image-wrap"
                            onClick={() => navigate(`/geovision/produit/${product.slug}`)}
                          >
                            <img
                              alt={product.titre}
                              className="pp-image"
                              loading="lazy"
                              src={resolveGeovisionImage(product)}
                            />
                            <div className="pp-image-overlay"></div>
                            <span className="pp-badge pp-badge--neuf">
                              {product.categorie?.nom || specs.taxonomy.subcategory || "GeoVision"}
                            </span>
                          </button>

                          <div className="pp-body">
                            <h3 className="pp-title">{product.titre}</h3>
                            <p className="pp-desc">{product.description_courte || product.description}</p>
                            <div className="pp-footer-row">
                              <button className="pp-add-btn" onClick={() => navigate(`/geovision/produit/${product.slug}`)}>
                                Voir la fiche →
                              </button>
                            </div>
                          </div>
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {!loading && !error && visibleCategories.length > 0 && (
            <div className="pp-grid" aria-label="Catégories GeoVision">
              {visibleCategories.map((category) => {
                const childCount = getCategoryChildren(category).length;
                const frenchName = getFrenchCategoryName(category);

                return (
                  <article key={category.slug} className="pp-card">
                    <button
                      type="button"
                      className="pp-image-wrap"
                      onClick={() => navigate(`/geovision/categorie/${category.slug}`)}
                    >
                      <img
                        alt={frenchName || category.nom}
                        className="pp-image"
                        loading="lazy"
                        src={resolveGeovisionImage(category)}
                      />
                      <div className="pp-image-overlay"></div>
                      <span className="pp-badge pp-badge--neuf">{activeFamily?.nom}</span>
                    </button>

                    <div className="pp-body">
                      <h3 className="pp-title">{frenchName}</h3>
                      <p className="pp-desc">{category.description}</p>
                      <div className="pp-meta-row">
                        <span className="pp-meta-chip">{childCount > 0 ? `${childCount} sous-types` : "Modèles disponibles"}</span>
                        <span className="pp-meta-chip">Base de données</span>
                      </div>
                      <div className="pp-footer-row">
                        <button className="pp-add-btn" onClick={() => navigate(`/geovision/categorie/${category.slug}`)}>
                          Voir les modèles →
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
