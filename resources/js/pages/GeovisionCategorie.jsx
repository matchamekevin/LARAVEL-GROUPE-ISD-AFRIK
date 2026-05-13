import React, { useCallback, useDeferredValue, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import "../styles/home.css";
import "../styles/geovision-categories.css";
import { getCategorie, getCategorieBySlug, getProduits } from "../services/ProduitService";
import { useLivePolling } from "../hooks/useLivePolling";
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
  const [categoryRefreshToken, setCategoryRefreshToken] = useState(0);
  const [productsRefreshToken, setProductsRefreshToken] = useState(0);

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
        setError(requestError.response?.data?.message || "Impossible de charger les modèles GeoVision.");
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
        setError(requestError.response?.data?.message || "Catégorie GeoVision introuvable.");
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

  // Polling silencieux
  useLivePolling(() => fetchProducts(true), {
    intervalMs: 30000,
    enabled: Boolean(category?.slug) && !loadingProducts,
  });

  useLivePolling(() => fetchCategory(true), {
    intervalMs: 60000,
    enabled: !loadingCategory,
  });

  useEffect(() => {
    if (loadingCategory || !category?.slug) {
      return;
    }

    // Root GeoVision categories behave as family filters on /geovision, not as model pages.
    if (!category.parent_id) {
      navigate(`/geovision?famille=${category.slug}`, { replace: true });
    }
  }, [category?.parent_id, category?.slug, loadingCategory, navigate]);

  const parentFamily = category?.parent?.parent || category?.parent || null;
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
            {category && (
              <>
                <span>/</span>
                <span>{category.nom}</span>
              </>
            )}
          </nav>

          <div className="pp-heading">
            <svg viewBox="0 0 24 24" className="pp-heading-icon" aria-hidden="true"><path d="M3 7h18"></path><path d="M3 12h18"></path><path d="M3 17h18"></path></svg>
            <h2>Modèles disponibles</h2>
          </div>

          <div className="pp-search-wrap">
            <div className="mx-auto w-full max-w-[520px]">
              <label htmlFor="geovision-product-search" className="sr-only">Rechercher un modèle GeoVision</label>
              <div className="group flex items-center border-2 border-gray-100 rounded-full bg-white shadow-sm hover:shadow-lg hover:border-gray-200 overflow-hidden h-10 px-1 transition-all duration-300 focus-within:border-amber-400 focus-within:shadow-lg focus-within:shadow-amber-100">
                <span className="pl-4 pr-2 text-gray-400">
                  <svg className="h-5 w-5 text-gray-400 group-focus-within:text-amber-500 transition-colors duration-200" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
                </span>
                <input
                  id="geovision-product-search"
                  type="text"
                  className="h-full w-full border-0 bg-transparent px-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none transition-all duration-150"
                  placeholder="Rechercher une référence, un tag, une plateforme ou une caractéristique..."
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>
            </div>
          </div>

          {subtypes.length > 0 && (
            <div className="pp-meta-row pp-meta-row--wrap">
              {subtypes.map((subtype) => (
                <span key={subtype.slug} className="pp-meta-chip">{subtype.nom}</span>
              ))}
            </div>
          )}

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

          {(loadingCategory || loadingProducts) && <div className="pp-empty">Chargement des modèles GeoVision...</div>}
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
                      {items.map((product) => {
                        const specs = readGeovisionSpecifications(product);
                        const taxonomyText = [
                          specs.taxonomy.category,
                          specs.taxonomy.subcategory,
                          specs.taxonomy.series,
                        ].filter(Boolean).join(" / ");

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
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.src = "/images/geovision/cam1.webp";
                                }}
                              />
                              <div className="pp-image-overlay"></div>
                              <span className="pp-badge pp-badge--neuf">{product.categorie?.nom || specs.taxonomy.subcategory || category?.nom}</span>
                            </button>

                            <div className="pp-body">
                              <h3 className="pp-title">{product.titre}</h3>
                              <p className="pp-desc">{product.description_courte || product.description}</p>
                              {taxonomyText && <p className="pp-card-note">{taxonomyText}</p>}
                              <div className="pp-meta-row">
                                {specs.tags.slice(0, 4).map((tag) => (
                                  <span key={`${product.slug}-${normalizeGeovisionKey(tag)}`} className="pp-meta-chip">{tag}</span>
                                ))}
                              </div>
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
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
