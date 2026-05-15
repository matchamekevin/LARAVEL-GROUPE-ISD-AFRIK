import React, { useDeferredValue, useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import "../styles/home.css";
import "../styles/geovision-categories.css";
import SearchBar from "../components/SearchBar";
import Loader from "../components/Loader";
import { getCategories, getProduits } from "../services/ProduitService";
import { toastError } from "../utils/toast";
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
        const geoErr = requestError.response?.data?.message || "Impossible de charger le catalogue GeoVision.";
        toastError(geoErr);
        setError(geoErr);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [refreshToken]);

  const backgroundLoadFamilies = async () => {
    try {
      const response = await getCategories({ segment: "geovision", tree: 1, parent_id: "null" });
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
    } catch (requestError) {
      // silent background refresh: keep existing families
    }
  };

  useLivePolling(
    () => backgroundLoadFamilies(),
    {
      intervalMs: 4000,
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
        .flatMap((family) =>
          getCategoryChildren(family).map((category) => [
            category.slug,
            { category, family },
          ])
        )
    ).values()
  ).filter(({ category, family }) => {
    if (!normalizedSearch) {
      return true;
    }

    const haystack = normalizeGeovisionKey([
      category.nom,
      category.description,
      family?.nom,
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
        </div>
      </section>

      <section className="geovision-categories">
        <div className="pp-container pp-hero">
          <div className="pp-heading">
            <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"></path><path d="M20 3v4"></path><path d="M22 5h-4"></path><path d="M4 17v2"></path><path d="M5 18H3"></path></svg>
            <h2>Familles GeoVision</h2>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher une catégorie ou un modèle spécifique..."
          />

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

          {loading && <Loader variant="skeleton" count={4} />}
          {!loading && error && <div className="pp-empty">{error}</div>}
          {!loading && !error && !modelLoading && isSearching && visibleCategories.length === 0 && modelResults.length === 0 && (
            <div className="pp-empty">Aucune catégorie ou modèle ne correspond à votre recherche.</div>
          )}

          {!loading && !error && isSearching && (
            <div className="pp-group-stack" style={{ marginTop: "1rem" }}>
              <div className="pp-group-section">
                <h3 className="pp-group-title">Modèles trouvés</h3>
                {modelLoading ? (
                  <Loader text="Recherche des modèles GeoVision..." />
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
              {visibleCategories.map(({ category, family }) => {
                const childCount = getCategoryChildren(category).length;

                return (
                  <article key={category.slug} className="pp-card">
                    <button
                      type="button"
                      className="pp-image-wrap"
                      onClick={() => navigate(`/geovision/categorie/${category.slug}`)}
                    >
                      <img
                        alt={category.nom}
                        className="pp-image"
                        loading="lazy"
                        src={resolveGeovisionImage(category)}
                      />
                      <div className="pp-image-overlay"></div>
                      <span className="pp-badge pp-badge--neuf">{family?.nom || activeFamily?.nom || "GeoVision"}</span>
                    </button>

                    <div className="pp-body">
                      <h3 className="pp-title">{category.nom}</h3>
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
