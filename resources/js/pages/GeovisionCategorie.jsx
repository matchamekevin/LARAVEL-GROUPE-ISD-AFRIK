import React, { useCallback, useDeferredValue, useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/home.css";
import "../styles/geovision-categories.css";
import "../../css/product-action-buttons.css";
import SearchBar from "../components/SearchBar";
import { getCategorie, getCategorieBySlug, getProduits } from "../services/ProduitService";
import { toastError } from "../utils/toast";
import { useLivePolling } from "../hooks/useLivePolling";
import GeovisionProductCard from "../components/GeovisionProductCard";
import {
  getCategoryChildren,
  normalizeGeovisionKey,
  readGeovisionSpecifications,
  resolveGeovisionImage,
} from "../utils/geovision";

const EMPTY_FILTERS = {
  resolution: "",
  lens: "",
  environment: "",
};

function matchesPattern(value = "", patterns = []) {
  return patterns.find((pattern) => pattern.test(value)) || null;
}

function deriveProductFilterValues(product) {
  const specs = readGeovisionSpecifications(product);
  const bag = [
    ...specs.tags,
    ...specs.platforms,
    ...specs.technicalSpecs.flatMap((item) => [item.label, item.value]),
  ].filter(Boolean);

  const resolutions = new Set();
  const lensTypes = new Set();
  const environments = new Set();

  const addMatchedValue = (collection, value, patternList) => {
    const matchedPattern = matchesPattern(value, patternList);

    if (!matchedPattern) {
      return;
    }

    const matchedValue = String(value).match(matchedPattern)?.[0];

    if (matchedValue) {
      collection.add(matchedValue.replace(/\s+/g, " ").trim());
    }
  };

  bag.forEach((value) => {
    const normalizedValue = String(value).trim();

    addMatchedValue(resolutions, normalizedValue, [
      /\bAbove 8MP\b/i,
      /\b\d+\s*\*\s*\d+\s*MP\b/i,
      /\b\d+\s*MP\b/i,
      /\b4K\b/i,
    ]);

    addMatchedValue(lensTypes, normalizedValue, [
      /\bMotorized\b/i,
      /\bVari-?Focal\b/i,
      /\bVarifocal\b/i,
      /\bFixed\b/i,
    ]);

    addMatchedValue(environments, normalizedValue, [
      /\bIP6[678]\b/i,
      /\bIP66 or Above\b/i,
      /\bIndoor\b/i,
      /\bOutdoor\b/i,
      /\bArctic\b/i,
    ]);
  });

  return {
    resolutions: Array.from(resolutions),
    lensTypes: Array.from(lensTypes),
    environments: Array.from(environments),
  };
}

function buildSearchText(product) {
  const specs = readGeovisionSpecifications(product);

  return normalizeGeovisionKey([
    product.titre,
    product.reference,
    product.modele,
    product.description,
    product.description_courte,
    product.categorie?.nom,
    specs.taxonomy.family,
    specs.taxonomy.category,
    specs.taxonomy.subcategory,
    specs.taxonomy.series,
    ...specs.tags,
    ...specs.features,
    ...specs.platforms,
    ...specs.technicalSpecs.flatMap((item) => [item.label, item.value]),
  ].join(" "));
}

const GEO_STORAGE_KEY = "geovision_cat_state";

function loadGeovisionState() {
  try {
    return JSON.parse(sessionStorage.getItem(GEO_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
}

function saveGeovisionState(state) {
  try {
    sessionStorage.setItem(GEO_STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export default function GeovisionCategorie() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState(null);
  const [products, setProducts] = useState([]);
  const [loadingCategory, setLoadingCategory] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const deferredSearch = useDeferredValue(searchQuery);
  const [filters, setFilters] = useState(EMPTY_FILTERS);


  const fetchProducts = useCallback(async (isSilent = false) => {
    if (!category?.slug) {
      if (!isSilent) {
        setProducts([]);
        setLoadingProducts(false);
      }
      return;
    }

    if (!isSilent) {
      setLoadingProducts(true);
    }

    try {
      const response = await getProduits({
        segment: "geovision",
        category_slug: category.slug,
        include_descendants: 1,
        par_page: 100, // Réduit de 250 à 100
        tri: "recent",
      });
      setProducts(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (requestError) {
      if (!isSilent) {
        setProducts([]);
        const prodErr = requestError.response?.data?.message || "Impossible de charger les modèles GeoVision.";
        toastError(prodErr);
        setError(prodErr);
      }
    } finally {
      if (!isSilent) {
        setLoadingProducts(false);
      }
    }
  }, [category?.slug]);

  const fetchCategory = useCallback(async (isSilent = false) => {
    if (!isSilent) {
      setLoadingCategory(true);
      setError("");
    }

    try {
      const request = /^\d+$/.test(String(slug || ""))
        ? getCategorie(slug, { tree: 1 })
        : getCategorieBySlug(slug, { tree: 1 });

      const response = await request;
      const item = response.data?.data || response.data || null;
      setCategory(item);
    } catch (requestError) {
      if (!isSilent) {
        setCategory(null);
        const catErr = requestError.response?.data?.message || "Catégorie GeoVision introuvable.";
        toastError(catErr);
        setError(catErr);
      }
    } finally {
      if (!isSilent) {
        setLoadingCategory(false);
      }
    }
  }, [slug]);

  // Chargement initial de la catégorie
  useEffect(() => {
    fetchCategory(false);
  }, [fetchCategory]);

  // Chargement initial des produits
  useEffect(() => {
    fetchProducts(false);
  }, [fetchProducts]);

  // Polling silencieux (intervalle long: le global AutoRefresh gère les mises à jour rapides)
  useLivePolling(() => fetchProducts(true), {
    intervalMs: 30000,
    enabled: Boolean(category?.slug) && !loadingProducts,
  });

  useLivePolling(() => fetchCategory(true), {
    intervalMs: 30000,
    enabled: !loadingCategory,
  });

  // Restore GeoVision catalog state when coming back from product detail
  useEffect(() => {
    if (loadingCategory || !slug) return;
    const saved = loadGeovisionState();
    if (saved && saved.slug === slug) {
      if (saved.searchQuery) setSearchQuery(saved.searchQuery);
      if (saved.filters) setFilters(saved.filters);
    }
    sessionStorage.removeItem(GEO_STORAGE_KEY);
  }, [slug, loadingCategory]);

  // Save GeoVision state right before navigating away
  const stateRef = useRef({ searchQuery, filters, slug });
  stateRef.current = { searchQuery, filters, slug };

  useEffect(() => {
    return () => {
      const s = stateRef.current;
      if (s.slug) {
        saveGeovisionState({ searchQuery: s.searchQuery, filters: s.filters, slug: s.slug });
      }
    };
  }, []);

  useEffect(() => {
    if (loadingCategory || !category?.slug) {
      return;
    }

    // Root GeoVision categories behave as family filters on /geovision, not as model pages.
    if (!category.parent_id) {
      navigate(`/geovision?famille=${category.slug}`, { replace: true });
    }
  }, [category?.parent_id, category?.slug, loadingCategory, navigate]);

  const parentFamily = category?.parent?.parent || null;
  const parentCategory = category?.parent || null;
  const currentCategory = category || null;
  const subtypes = getCategoryChildren(category);
  const searchToken = normalizeGeovisionKey(deferredSearch);

  const filterOptions = products.reduce((accumulator, product) => {
    const values = deriveProductFilterValues(product);

    values.resolutions.forEach((value) => accumulator.resolution.add(value));
    values.lensTypes.forEach((value) => accumulator.lens.add(value));
    values.environments.forEach((value) => accumulator.environment.add(value));

    return accumulator;
  }, {
    resolution: new Set(),
    lens: new Set(),
    environment: new Set(),
  });

  const visibleProducts = products.filter((product) => {
    const values = deriveProductFilterValues(product);
    const searchText = buildSearchText(product);

    if (searchToken && !searchText.includes(searchToken)) {
      return false;
    }

    if (filters.resolution && !values.resolutions.includes(filters.resolution)) {
      return false;
    }

    if (filters.lens && !values.lensTypes.includes(filters.lens)) {
      return false;
    }

    if (filters.environment && !values.environments.includes(filters.environment)) {
      return false;
    }

    return true;
  });

  const groupedProducts = visibleProducts.reduce((accumulator, product) => {
    const specs = readGeovisionSpecifications(product);
    const groupName = product.categorie?.nom || specs.taxonomy.subcategory || category?.nom || "Modèles";

    if (!accumulator[groupName]) {
      accumulator[groupName] = [];
    }

    accumulator[groupName].push(product);
    return accumulator;
  }, {});

  const productGroups = Object.entries(groupedProducts);
  const showGroups = productGroups.length > 1;

  return (
    <div className="home geovision-page">
      <section className="geovision-hero">
        <div className="geovision-hero-inner">
          <div className="section-header">
            <h2>{category?.nom || "Catégorie GeoVision"}</h2>
            <p>{category?.description || "Découvrez les modèles et références disponibles pour cette catégorie."}</p>
          </div>
          <div className="geovision-hero-actions">
            <button className="btn-primary" onClick={() => navigate("/geovision")}>Retour GeoVision</button>
          </div>
        </div>
      </section>

      <section className="geovision-categories">
        <div className="pp-container pp-hero">
          <nav className="gpd-breadcrumb" aria-label="Fil d'Ariane">
            <Link to="/">Accueil</Link>
            <span>/</span>
            <Link to="/geovision">GeoVision</Link>
            {parentFamily && (
              <>
                <span>/</span>
                <Link to={`/geovision?famille=${parentFamily.slug}`}>{parentFamily.nom}</Link>
              </>
            )}
            {parentCategory && parentCategory.slug !== parentFamily?.slug && (
              <>
                <span>/</span>
                <Link to={`/geovision/categorie/${parentCategory.slug}`}>{parentCategory.nom}</Link>
              </>
            )}
            {currentCategory && currentCategory.slug !== parentCategory?.slug && (
              <>
                <span>/</span>
                <span>{currentCategory.nom}</span>
              </>
            )}
          </nav>

          <div className="pp-heading">
            <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true"><path d="M3 7h18"></path><path d="M3 12h18"></path><path d="M3 17h18"></path></svg>
            <h2>Modèles disponibles</h2>
          </div>

          <SearchBar
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Rechercher une référence, un tag, une plateforme ou une caractéristique..."
          />

          {subtypes.length > 0 ? (
            <section className="pcat-section">
              <div className="pcat-heading-row">
                <h2>Sous-catégories</h2>
                <p>Choisissez une sous-catégorie pour continuer.</p>
              </div>
              <div className="pcat-sub-grid">
                {subtypes.map((subtype) => (
                  <article key={subtype.slug} className="pcat-sub-card">
                    <div className="pcat-sub-visual">
                      <img 
                        src={resolveGeovisionImage(subtype)} 
                        alt={subtype.nom} 
                        loading="lazy" 
                        className="is-landscape"
                        onError={(e) => { e.target.src = "/images/produits/proj.webp"; }}
                      />
                      <div className="pcat-sub-overlay" aria-hidden="true"></div>
                    </div>
                    <div className="pcat-sub-content">
                      <h3>{subtype.nom}</h3>
                      <p>{subtype.description}</p>
                      <div className="pcat-sub-footer">
                        <span className="pcat-sub-count">{subtype.produits_count ?? 0} produit(s)</span>
                        <button 
                          type="button" 
                          className="pcat-solid-btn"
                          onClick={() => navigate(`/geovision/categorie/${subtype.slug}`)}
                        >
                          Voir plus
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          ) : (
            <>
              {(filterOptions.resolution.size > 0 || filterOptions.lens.size > 0 || filterOptions.environment.size > 0) && (
                <div className="pp-filter-bar">
                  <select
                    className="pp-filter-select"
                    value={filters.resolution}
                    onChange={(event) => setFilters((previous) => ({ ...previous, resolution: event.target.value }))}
                  >
                    <option value="">Résolution</option>
                    {Array.from(filterOptions.resolution).sort().map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>

                  <select
                    className="pp-filter-select"
                    value={filters.lens}
                    onChange={(event) => setFilters((previous) => ({ ...previous, lens: event.target.value }))}
                  >
                    <option value="">Type d’objectif</option>
                    {Array.from(filterOptions.lens).sort().map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>

                  <select
                    className="pp-filter-select"
                    value={filters.environment}
                    onChange={(event) => setFilters((previous) => ({ ...previous, environment: event.target.value }))}
                  >
                    <option value="">Environnement</option>
                    {Array.from(filterOptions.environment).sort().map((value) => (
                      <option key={value} value={value}>{value}</option>
                    ))}
                  </select>

                  <button type="button" className="pp-filter-reset" onClick={() => setFilters(EMPTY_FILTERS)}>
                    Réinitialiser
                  </button>
                </div>
              )}

              {!loadingCategory && error && <div className="pp-empty">{error}</div>}
              {!loadingCategory && !loadingProducts && !error && visibleProducts.length === 0 && (
                <div className="pp-empty">Aucun modèle trouvé pour cette catégorie avec ces critères.</div>
              )}

              {!loadingCategory && !loadingProducts && !error && visibleProducts.length > 0 && (
                <>
                  <div className="pp-meta-row pp-meta-row--space">
                    <span className="pp-meta-chip">{visibleProducts.length} modèle(s)</span>
                    <span className="pp-meta-chip">{category?.nom}</span>
                    {filters.resolution && <span className="pp-meta-chip">{filters.resolution}</span>}
                    {filters.lens && <span className="pp-meta-chip">{filters.lens}</span>}
                    {filters.environment && <span className="pp-meta-chip">{filters.environment}</span>}
                  </div>

                  <div className="pp-group-stack">
                    {productGroups.map(([groupName, items]) => (
                      <div key={groupName} className="pp-group-section">
                        {showGroups && <h3 className="pp-group-title">{groupName}</h3>}
                        <div className="pp-grid" aria-label={`Modèles ${groupName}`}>
                          {items.map((product) => (
                            <GeovisionProductCard
                              key={product.id_produit || product.slug}
                              product={product}
                              badgeLabel={category?.nom}
                              showSpecs
                              fallbackImage="/images/geovision/cam1.webp"
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  );
}
