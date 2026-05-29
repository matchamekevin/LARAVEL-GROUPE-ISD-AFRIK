import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import api from "../axios";
import Loader from "../components/Loader";
import { getProduit, getProduitBySlug, getProduits } from "../services/ProduitService";
import { toastError } from "../utils/toast";
import { addToCart, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import {
  formatGeovisionPrice,
  getGeovisionAvailability,
  getProductGallery,
  readGeovisionSpecifications,
  resolveGeovisionImage,
} from "../utils/geovision";
import "../styles/geovision-product-detail.css";

export default function GeovisionProduitDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [product, setProduct] = useState(null);
  const [relatedProducts, setRelatedProducts] = useState([]);
  const [activeImage, setActiveImage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [manufacturerSheetOpen, setManufacturerSheetOpen] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [quantite, setQuantite] = useState(1);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);
  const [favori, setFavori] = useState(false);
  const resumeHandledRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError("");
    setActiveImage(0);

    const request = /^\d+$/.test(String(slug || ""))
      ? getProduit(slug)
      : getProduitBySlug(slug);

    request
      .then((response) => {
        if (!isMounted) return;
        setProduct(response.data?.data || null);
      })
      .catch((requestError) => {
        if (!isMounted) return;
        setProduct(null);
        const prodErr = requestError.response?.data?.message || "Produit GeoVision introuvable.";
        toastError(prodErr);
        setError(prodErr);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  useEffect(() => {
    if (!product?.categorie?.slug) {
      setRelatedProducts([]);
      return;
    }

    let isMounted = true;
    const relatedCategorySlug = product.categorie?.parent?.slug || product.categorie?.slug;

    getProduits({
      segment: "geovision",
      category_slug: relatedCategorySlug,
      include_descendants: 1,
      par_page: 8,
      tri: "recent",
    })
      .then((response) => {
        if (!isMounted) return;

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        setRelatedProducts(
          items
            .filter((item) => item.slug !== product.slug)
            .slice(0, 4)
        );
      })
      .catch(() => {
        if (isMounted) setRelatedProducts([]);
      });

    return () => {
      isMounted = false;
    };
  }, [product?.categorie?.slug, product?.categorie?.parent?.slug, product?.slug]);

  useEffect(() => {
    if (!manufacturerSheetOpen) {
      return undefined;
    }

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setManufacturerSheetOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [manufacturerSheetOpen]);

  useEffect(() => {
    if (!product?.id_produit) { setFavori(false); return; }
    const refresh = () => setFavori(isFavorite(product.id_produit));
    refresh();
    return subscribeStoreUpdates(refresh);
  }, [product?.id_produit]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantite);
    setAjouteAuPanier(true);
    setTimeout(() => setAjouteAuPanier(false), 2000);
  };

  const handleToggleFavorite = () => {
    if (!product) return;
    toggleFavorite(product);
    setFavori(!favori);
  };

  const handleProductPayment = () => {
    if (!product || Number(product.stock || 0) <= 0 || paymentLoading) return;
    const quantityToPay = Math.max(1, quantite);
    if (!localStorage.getItem("token")) {
      navigate("/login", {
        state: {
          from: `${location.pathname}${location.search || ""}`,
          post_login_intent: "pay_product",
          post_login_payload: {
            id_produit: String(product.id_produit),
            quantite: quantityToPay,
          },
        },
      });
      return;
    }
    setPaymentLoading(true);
    try {
      const user = getCurrentUser();
      api.post("/produits/paiement", {
        id_produit: String(product.id_produit),
        quantite: quantityToPay,
        nom_livraison: user.nom || "Client",
        prenom_livraison: user.prenom || "ISD",
        email: user.email || "",
        telephone: user.telephone || "00000000",
        adresse: user.adresse || "Lomé, Togo",
      }).then((response) => {
        const checkoutUrl = response?.data?.checkout_url;
        if (!checkoutUrl) throw new Error("URL de paiement manquante.");
        window.location.href = checkoutUrl;
      }).catch((err) => {
        if (err?.response?.status === 401) {
          setPaymentLoading(false);
          navigate("/login", {
            state: {
              from: `${location.pathname}${location.search || ""}`,
              post_login_intent: "pay_product",
              post_login_payload: {
                id_produit: String(product.id_produit),
                quantite: quantityToPay,
              },
            },
          });
          return;
        }
        toastError(err?.response?.data?.message || "Impossible d'initialiser le paiement.");
        setPaymentLoading(false);
      });
    } catch {
      toastError("Erreur lors du paiement.");
      setPaymentLoading(false);
    }
  };

  const getCurrentUser = () => {
    try {
      const raw = localStorage.getItem("user");
      if (!raw) return {};
      return JSON.parse(raw) || {};
    } catch {
      return {};
    }
  };

  useEffect(() => {
    const intent = location.state?.post_login_intent;
    const payload = location.state?.post_login_payload;
    const hasToken = Boolean(localStorage.getItem("token"));

    if (!hasToken || !product?.id_produit || paymentLoading || resumeHandledRef.current) {
      return;
    }

    if (intent !== "pay_product") {
      return;
    }

    const targetProductId = String(payload?.id_produit || 0);
    if (targetProductId && targetProductId !== String(product.id_produit)) {
      return;
    }

    resumeHandledRef.current = true;
    handleProductPayment(product, Math.max(1, Number(payload?.quantite || 1)));
  }, [location.state, paymentLoading, product?.id_produit]);

  if (loading) return <Loader variant="skeleton" type="detail" />;

  if (!product) {
    return (
      <div className="gpd-page">
        <div className="gpd-shell gpd-empty-state">
          <p className="gpd-kicker">Catalogue GeoVision</p>
          <h1>Produit introuvable</h1>
          <p>{error || "Ce produit n'est plus disponible dans le catalogue GeoVision."}</p>
          <div className="gpd-empty-actions">
            <Link to="/geovision" className="gpd-btn gpd-btn--primary">Retour au catalogue</Link>
            <Link to="/contact" className="gpd-btn gpd-btn--ghost">Contacter un expert</Link>
          </div>
        </div>
      </div>
    );
  }

  const specs = readGeovisionSpecifications(product);
  const images = getProductGallery(product);
  const availability = getGeovisionAvailability(product);
  const subcategory = product.categorie || null;
  const category = subcategory?.parent || null;
  const family = category?.parent || null;
  const price = formatGeovisionPrice(product.prix_promo || product.prix);
  const featureCards = (specs.features.length > 0 ? specs.features : specs.tags).slice(0, 6);
  const detailCards = Array.from(new Set([
    specs.overview,
    ...specs.detailNotes,
    ...specs.technicalSpecs.slice(0, 4).map((item) => `${item.label}: ${item.value}`),
  ].filter((item) => Boolean(String(item || "").trim())).map((item) => String(item).trim())));

  const openManufacturerSheet = () => setManufacturerSheetOpen(true);
  const closeManufacturerSheet = () => setManufacturerSheetOpen(false);

  return (
    <div className="gpd-page">
      <div className="gpd-shell">
        <nav className="gpd-breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/geovision">GeoVision</Link>
          {family && (
            <>
              <span>/</span>
              <Link to={`/geovision?famille=${family.slug}`}>{family.nom}</Link>
            </>
          )}
          {category && category.slug !== family?.slug && (
            <>
              <span>/</span>
              <Link to={`/geovision/categorie/${category.slug}`}>{category.nom}</Link>
            </>
          )}
          {subcategory && subcategory.slug !== category?.slug && (
            <>
              <span>/</span>
              <Link to={`/geovision/categorie/${subcategory.slug}`}>{subcategory.nom}</Link>
            </>
          )}
          <span>/</span>
          <span>{product.titre}</span>
        </nav>

        <section className="gpd-hero">
          <div className="gpd-gallery-panel">
            <div className="gpd-main-image-wrap">
              <img src={images[activeImage]} alt={product.titre} className="gpd-main-image" />
              <span className="gpd-badge">{specs.taxonomy.subcategory || category?.nom || "GeoVision"}</span>
            </div>
          </div>

          <div className="gpd-content">
            <p className="gpd-kicker">{product.marque || "GeoVision"}</p>
            <h1>{product.titre}</h1>
            <p className="gpd-category">
              {[specs.taxonomy.category, specs.taxonomy.subcategory].filter(Boolean).join(" / ") || category?.nom}
            </p>
            <p className="gpd-description">{specs.overview || product.description}</p>

            <div className="gpd-price-row">
              <span className="gpd-price">{price}</span>
              <span className="gpd-availability">{availability}</span>
            </div>

            <div className="gpd-summary-grid">
              <div className="gpd-summary-card">
                <span>Référence</span>
                <strong>{product.reference || product.modele || product.slug}</strong>
              </div>
              <div className="gpd-summary-card">
                <span>Série</span>
                <strong>{specs.taxonomy.series || product.modele || "GeoVision"}</strong>
              </div>
              <div className="gpd-summary-card">
                <span>Garantie</span>
                <strong>{product.garantie || "Selon projet"}</strong>
              </div>
              <div className="gpd-summary-card">
                <span>Catégorie</span>
                <strong>{category?.nom || specs.taxonomy.category || "Catalogue GeoVision"}</strong>
              </div>
            </div>

            {specs.tags.length > 0 && (
              <div className="gpd-feature-list">
                {specs.tags.map((tag) => (
                  <span key={`${product.slug}-${tag}`} className="gpd-feature-chip">{tag}</span>
                ))}
              </div>
            )}

            <div className="gpd-action-bar">
              <div className="gpd-qty-group">
                <button
                  type="button"
                  className="gpd-qty-btn"
                  onClick={() => setQuantite((q) => Math.max(1, q - 1))}
                  aria-label="Diminuer la quantité"
                >
                  <i className="fa-solid fa-minus"></i>
                </button>
                <input
                  id={`gpd-qty-${product.id_produit}`}
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  min="1"
                  max="999"
                  value={quantite}
                  onChange={(e) => {
                    const val = parseInt(e.target.value.replace(/\D/g, ""), 10);
                    if (!isNaN(val)) setQuantite(Math.max(1, Math.min(999, val)));
                  }}
                  className="gpd-qty-input"
                />
                <button
                  type="button"
                  className="gpd-qty-btn"
                  onClick={() => setQuantite((q) => Math.min(999, q + 1))}
                  aria-label="Augmenter la quantité"
                >
                  <i className="fa-solid fa-plus"></i>
                </button>
              </div>
              <button
                type="button"
                className={`gpd-icon-btn ${ajouteAuPanier ? "gpd-icon-btn--success" : ""}`}
                title="Ajouter au panier"
                aria-label="Ajouter au panier"
                onClick={handleAddToCart}
                disabled={ajouteAuPanier}
              >
                <i className={`fa-solid ${ajouteAuPanier ? "fa-check" : "fa-cart-shopping"}`}></i>
              </button>
              <button
                type="button"
                className={`gpd-icon-btn ${favori ? "gpd-icon-btn--active" : ""}`}
                title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                onClick={handleToggleFavorite}
              >
                <i className={`fa-${favori ? "solid" : "regular"} fa-heart`}></i>
              </button>
              <button
                type="button"
                className="gpd-btn-pay"
                title="Payer maintenant"
                aria-label="Payer maintenant"
                onClick={handleProductPayment}
                disabled={paymentLoading}
              >
                {paymentLoading ? <Loader variant="inline" size="sm" /> : <i className="fa-solid fa-credit-card"></i>}
                <span>{paymentLoading ? "Redirection..." : "Payer"}</span>
              </button>
            </div>

            <div className="gpd-actions">
              <button type="button" className="gpd-btn gpd-btn--primary" onClick={() => navigate("/contact", { state: { subject: product.titre } })}>
                Demander un devis
              </button>
            </div>
          </div>
        </section>

        <section className="gpd-section">
          <div className="gpd-section-head">
            <h2>Positionnement du modèle</h2>
            <p>Lecture rapide de la famille produit, de la série et de l’usage principal.</p>
          </div>
          <div className="gpd-spec-grid">
            <article className="gpd-spec-card">
              <p>Famille</p>
              <strong>{specs.taxonomy.family || family?.nom || "GeoVision"}</strong>
            </article>
            <article className="gpd-spec-card">
              <p>Catégorie</p>
              <strong>{specs.taxonomy.category || category?.nom || "Catalogue"}</strong>
            </article>
            <article className="gpd-spec-card">
              <p>Sous-type</p>
              <strong>{specs.taxonomy.subcategory || product.categorie?.nom || "Modèle"}</strong>
            </article>
            <article className="gpd-spec-card">
              <p>Série</p>
              <strong>{specs.taxonomy.series || product.modele || "GeoVision"}</strong>
            </article>
          </div>
        </section>

        {specs.platforms.length > 0 && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Plateformes et compatibilité</h2>
              <p>Informations utiles remontées du catalogue officiel pour les logiciels, appliances et accessoires.</p>
            </div>
            <div className="gpd-feature-list">
              {specs.platforms.map((platform) => (
                <span key={`${product.slug}-${platform}`} className="gpd-feature-chip">{platform}</span>
              ))}
            </div>
          </section>
        )}

        {specs.features.length > 0 && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Points clés</h2>
              <p>Fonctions et capacités principales de cette référence.</p>
            </div>
            <div className="gpd-bullet-list">
              {specs.features.map((feature) => (
                <article key={`${product.slug}-${feature}`} className="gpd-bullet-card">
                  <span className="gpd-bullet-dot"></span>
                  <p>{feature}</p>
                </article>
              ))}
            </div>
          </section>
        )}

        {featureCards.length > 0 && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Caractéristiques du modèle</h2>
              <p>Caractéristiques fournies par la fiche produit enregistrée en base.</p>
            </div>
            <div className="gpd-spec-grid">
              {featureCards.map((item) => (
                <article key={`${product.slug}-${item}`} className="gpd-spec-card">
                  <p>{specs.taxonomy.category || category?.nom || "GeoVision"}</p>
                  <strong>{item}</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        {specs.technicalSpecs.length > 0 && (
          <section className="gpd-section" id="fiche-constructeur">
            <div className="gpd-section-head">
              <h2>Fiche constructeur</h2>
              <p>Détails utiles pour l’étude, le dimensionnement et l’intégration de la référence.</p>
            </div>
            <div className="gpd-spec-grid">
              {specs.technicalSpecs.map((spec) => (
                <article key={`${product.slug}-${spec.label}`} className="gpd-spec-card">
                  <p>{spec.label}</p>
                  <strong>{spec.value}</strong>
                </article>
              ))}
            </div>
          </section>
        )}

        {(detailCards.length > 0 || specs.useCases.length > 0) && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Plus de détails</h2>
              <p>Informations détaillées depuis la fiche stockée en base de données.</p>
            </div>
            {detailCards.length > 0 && (
              <div className="gpd-bullet-list">
                {detailCards.map((detail) => (
                  <article key={`${product.slug}-detail-${detail}`} className="gpd-bullet-card">
                    <span className="gpd-bullet-dot"></span>
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            )}

            {specs.useCases.length > 0 && (
              <div style={{ marginTop: "1rem" }}>
                <div className="gpd-section-head" style={{ marginBottom: "0.75rem" }}>
                  <h2>Cas d’usage recommandés</h2>
                  <p>Contextes dans lesquels ce modèle apporte le plus de valeur.</p>
                </div>
                <div className="gpd-feature-list">
                  {specs.useCases.map((item) => (
                    <span key={`${product.slug}-usecase-${item}`} className="gpd-feature-chip">
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}

        {relatedProducts.length > 0 && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Modèles liés</h2>
              <p>Autres références de la même famille ou de la même catégorie GeoVision.</p>
            </div>
            <div className="gpd-related-grid">
              {relatedProducts.map((item) => (
                <article key={item.slug} className="gpd-related-card">
                  <img src={resolveGeovisionImage(item)} alt={item.titre} className="gpd-related-image" />
                  <div className="gpd-related-body">
                    <span>{item.categorie?.nom || specs.taxonomy.category || "GeoVision"}</span>
                    <h3>{item.titre}</h3>
                    <p>{item.description_courte || item.description}</p>
                    <Link to={`/geovision/produit/${item.slug}`} className="gpd-related-link">Voir le modèle</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        {manufacturerSheetOpen && (
          <div className="gpd-sheet-backdrop" role="presentation" onClick={closeManufacturerSheet}>
            <div
              className="gpd-sheet-modal"
              role="dialog"
              aria-modal="true"
              aria-labelledby="manufacturer-sheet-title"
              onClick={(event) => event.stopPropagation()}
            >
              <div className="gpd-sheet-header">
                <div>
                  <p className="gpd-kicker">Fiche constructeur</p>
                  <h2 id="manufacturer-sheet-title">{product.titre}</h2>
                  <p>{specs.taxonomy.category || category?.nom || "GeoVision"} - {specs.taxonomy.series || product.modele || product.reference}</p>
                </div>
                <button type="button" className="gpd-sheet-close" onClick={closeManufacturerSheet} aria-label="Fermer la fiche constructeur">
                  ×
                </button>
              </div>

              <div className="gpd-sheet-content">
                <div className="gpd-sheet-block gpd-sheet-block--intro">
                  <h3>Aperçu constructeur</h3>
                  <p>{specs.overview || product.description}</p>
                  {specs.useCases.length > 0 && (
                    <div className="gpd-feature-list">
                      {specs.useCases.map((item) => (
                        <span key={`sheet-usecase-${item}`} className="gpd-feature-chip">{item}</span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="gpd-sheet-block">
                  <h3>Caractéristiques principales</h3>
                  {featureCards.length > 0 ? (
                    <div className="gpd-spec-grid">
                      {featureCards.map((item) => (
                        <article key={`sheet-feature-${item}`} className="gpd-spec-card">
                          <p>{specs.taxonomy.category || category?.nom || "GeoVision"}</p>
                          <strong>{item}</strong>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="gpd-description">Aucune caractéristique n'est encore renseignée en base.</p>
                  )}
                </div>

                <div className="gpd-sheet-block">
                  <h3>Spécifications techniques</h3>
                  <div className="gpd-spec-grid">
                    {specs.technicalSpecs.map((spec) => (
                      <article key={`sheet-tech-${spec.label}`} className="gpd-spec-card">
                        <p>{spec.label}</p>
                        <strong>{spec.value}</strong>
                      </article>
                    ))}
                  </div>
                </div>

                <div className="gpd-sheet-block">
                  <h3>Plus de détails</h3>
                  {detailCards.length > 0 ? (
                    <div className="gpd-bullet-list">
                      {detailCards.map((detail) => (
                        <article key={`sheet-detail-${detail}`} className="gpd-bullet-card">
                          <span className="gpd-bullet-dot"></span>
                          <p>{detail}</p>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="gpd-description">Aucun détail complémentaire n'est encore renseigné en base.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
