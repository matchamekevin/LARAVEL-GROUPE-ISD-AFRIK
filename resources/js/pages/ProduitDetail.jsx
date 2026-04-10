import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../axios";
import { getCategorie, getProduit, getProduits } from "../services/ProduitService";
import { useLivePolling } from "../hooks/useLivePolling";
import { addToCart, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import { toastError } from "../utils/toast";
import "../styles/produitdetail.css";

function normalizeMediaUrl(value) {
  const trimmed = String(value || "").trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) {
    return trimmed;
  }

  return `/${trimmed}`;
}

function collectProductMedia(product) {
  const candidates = [
    product?.image_url,
    ...(Array.isArray(product?.image_urls) ? product.image_urls : []),
    ...(Array.isArray(product?.images)
      ? product.images.flatMap((image) => [image?.url, image?.path])
      : []),
  ];

  const seen = new Set();

  return candidates
    .map((candidate) => normalizeMediaUrl(candidate))
    .filter((candidate) => candidate && candidate !== "/images/default.webp" && candidate !== "/placeholder.webp")
    .filter((candidate) => {
      if (seen.has(candidate)) {
        return false;
      }

      seen.add(candidate);
      return true;
    });
}

function collectGalleryFromProducts(products) {
  const gallery = [];
  const seen = new Set();

  (Array.isArray(products) ? products : []).forEach((product) => {
    collectProductMedia(product).forEach((candidate) => {
      if (seen.has(candidate)) {
        return;
      }

      seen.add(candidate);
      gallery.push(candidate);
    });
  });

  return gallery;
}

function toReadableSpecValue(value) {
  if (value === null || value === undefined || value === "") {
    return "-";
  }

  if (Array.isArray(value)) {
    const flat = value
      .map((item) => toReadableSpecValue(item))
      .filter((item) => item !== "-");

    return flat.length > 0 ? flat.join(", ") : "-";
  }

  if (typeof value === "object") {
    const nestedEntries = Object.entries(value)
      .map(([k, v]) => `${k}: ${toReadableSpecValue(v)}`)
      .filter((item) => !item.endsWith(": -"));

    return nestedEntries.length > 0 ? nestedEntries.join(" | ") : "-";
  }

  return String(value);
}

function toSpecificationsObject(specifications) {
  if (!specifications) {
    return {};
  }

  if (typeof specifications === "string") {
    try {
      const parsed = JSON.parse(specifications);
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch {
      return {};
    }
  }

  return typeof specifications === "object" ? specifications : {};
}

export default function ProduitDetail() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [produit,       setProduit]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [imageActive,   setImageActive]   = useState(0);
  const [quantite,      setQuantite]      = useState(1);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);
  const [favori,        setFavori]        = useState(false);
  const [onglet,        setOnglet]        = useState("description");
  const [categorieInfo, setCategorieInfo] = useState(null);
  const [avisForm, setAvisForm] = useState({ note: 0, contenu: "" });
  const [hoverNote, setHoverNote] = useState(0);
  const [avisSubmitting, setAvisSubmitting] = useState(false);
  const [avisMessage, setAvisMessage] = useState("");
  const [avisError, setAvisError] = useState("");
  const [modelGallery, setModelGallery] = useState([]);
  const [paiementLoading, setPaiementLoading] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);

  const getCurrentUserId = () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return null;
      const parsed = JSON.parse(stored);
      return parsed?.id_utilisateur || parsed?.id || null;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    setLoading(true);
    setOnglet("description");
    setAvisMessage("");
    setAvisError("");
    setImageActive(0);
    setModelGallery([]);
    getProduit(id)
      .then((res) => {
        setProduit(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement produit", err);
        setLoading(false);
      });
  }, [id, refreshToken]);

  const backgroundLoadProduit = async () => {
    try {
      const res = await getProduit(id);
      setProduit(res.data.data);
    } catch (err) {
      // silent background refresh
    }
  };

  useLivePolling(
    () => backgroundLoadProduit(),
    {
      intervalMs: 8000,
      enabled: Boolean(id) && !avisSubmitting && !paiementLoading,
    }
  );

  // Si le produit n'inclut pas l'objet categorie, tenter de le charger séparément
  useEffect(() => {
    let active = true;
    if (produit && !produit.categorie && produit.id_categorie) {
      getCategorie(produit.id_categorie)
        .then((r) => {
          if (!active) return;
          const cat = r.data?.data || r.data || null;
          setCategorieInfo(cat);
        })
        .catch(() => {
          if (active) setCategorieInfo(null);
        });
    }
    return () => { active = false; };
  }, [produit]);

  useEffect(() => {
    let active = true;

    const loadModelGallery = async () => {
      if (!produit?.modele) {
        setModelGallery([]);
        return;
      }

      const baseParams = {
        modele: produit.modele,
        par_page: 50,
        tri: "recent",
      };

      if (produit.id_categorie) {
        baseParams.id_categorie = produit.id_categorie;
      }

      try {
        const response = await getProduits(baseParams);
        if (!active) return;

        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        const categoryGallery = collectGalleryFromProducts(items);

        if (categoryGallery.length > 0) {
          setModelGallery(categoryGallery);
          return;
        }

        const fallbackResponse = await getProduits({
          modele: produit.modele,
          par_page: 50,
          tri: "recent",
        });

        if (!active) return;

        const fallbackItems = Array.isArray(fallbackResponse.data?.data) ? fallbackResponse.data.data : [];
        setModelGallery(collectGalleryFromProducts(fallbackItems));
      } catch {
        if (active) {
          setModelGallery([]);
        }
      }
    };

    loadModelGallery();

    return () => {
      active = false;
    };
  }, [produit?.modele, produit?.id_categorie]);

  const _catCheckSource = produit?.categorie || categorieInfo || {};
  const _catCheck = (
    _catCheckSource.segment || _catCheckSource.slug || _catCheckSource.nom || produit?.marque || ""
  ).toString().toLowerCase();
  const isGeovision = _catCheck.includes("geovision");

  const categorySlug = (produit?.categorie?.slug || categorieInfo?.slug || "");
  const geovisionLink = categorySlug ? `/geovision/categorie/${categorySlug}` : "/geovision";

  useEffect(() => {
    if (!produit) return;
    console.debug("ProduitDetail: categorie embed:", produit.categorie, "fetched:", categorieInfo, "_catCheck:", _catCheck, "isGeovision:", isGeovision);
  }, [produit, categorieInfo, _catCheck, isGeovision]);

  useEffect(() => {
    if (!produit?.id_produit) {
      setFavori(false);
      return;
    }

    const refreshFavoriteState = () => {
      setFavori(isFavorite(produit.id_produit));
    };

    refreshFavoriteState();
    return subscribeStoreUpdates(refreshFavoriteState);
  }, [produit?.id_produit]);

  const handlePanier = () => {
    if (!produit || produit.stock === 0) {
      return;
    }

    addToCart(produit, quantite);
    setAjouteAuPanier(true);
    setTimeout(() => setAjouteAuPanier(false), 2000);
  };

  const handleFavori = () => {
    if (!produit) {
      return;
    }

    const result = toggleFavorite(produit);
    setFavori(Boolean(result?.isFavorite));
  };

  const handlePaiementProduit = async () => {
    if (!produit || Number(produit.stock || 0) <= 0 || paiementLoading) {
      return;
    }
    setPaiementLoading(true);

    try {
      const response = await api.post("/produits/paiement", {
        items: [
          {
            id_produit: Number(produit.id_produit),
            quantite: Number(quantite || 1),
          },
        ],
      });

      const checkoutUrl = response?.data?.checkout_url;
      if (!checkoutUrl) {
        throw new Error("URL de paiement manquante.");
      }

      window.location.href = checkoutUrl;
    } catch (error) {
      if (error?.response?.status === 401) {
        navigate('/login', { state: { from: location.pathname } });
        return;
      }

      const backendMessage =
        error?.response?.data?.message ||
        "Impossible d'initialiser le paiement pour ce produit.";
      toastError(backendMessage);
      setPaiementLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="pd-page">
        <div className="pd-skeleton-wrap">
          <div className="pd-skeleton pd-skeleton--img" />
          <div className="pd-skeleton-info">
            <div className="pd-skeleton pd-skeleton--line" />
            <div className="pd-skeleton pd-skeleton--line pd-skeleton--short" />
            <div className="pd-skeleton pd-skeleton--line" />
            <div className="pd-skeleton pd-skeleton--btn" />
          </div>
        </div>
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="pd-page">
        <div className="pd-not-found">
          <div>
            <i className="fa-solid fa-box-open pd-empty-icon" aria-hidden="true"></i>
          </div>
          <h2>Produit introuvable</h2>
          <Link to={location.state?.from || "/produits"} className="pd-back-btn">← Retour boutique</Link>
        </div>
      </div>
    );
  }

  const localGallery = collectProductMedia(produit);
  const images = modelGallery.length > 0
    ? modelGallery
    : localGallery.length > 0
      ? localGallery
      : ["/images/default.webp"];

  const prixFinal   = produit.prix_promo ?? produit.prix;
  const reduction   = produit.prix_promo
    ? Math.round(((produit.prix - produit.prix_promo) / produit.prix) * 100)
    : null;
  const avisCount = Number(produit.nombre_avis || 0) || (Array.isArray(produit.commentaires) ? produit.commentaires.length : 0);
  const specsObject = toSpecificationsObject(produit.specifications);
  const specsEntries = Object.entries(specsObject);

  return (
    <div className="pd-page">

      {/* ── Fil d'Ariane ─────────────────────────── */}
      <nav className="pd-breadcrumb" aria-label="Fil d'Ariane">
        <ol className="pd-breadcrumb-inner">
          <li>
            <Link to="/">Accueil</Link>
          </li>
          <li>
            <span aria-hidden="true">›</span>
            <Link to="/produits">Boutique</Link>
          </li>
          {isGeovision && (
            <li>
              <span aria-hidden="true">›</span>
              <Link to={geovisionLink}>Geovision</Link>
            </li>
          )}
          {(produit.categorie || categorieInfo) && (
            <li>
              <span aria-hidden="true">›</span>
              <Link to={`/produits?id_categorie=${(produit.categorie?.id_categorie || categorieInfo?.id_categorie || produit.id_categorie)}`}>
                {(produit.categorie?.nom || categorieInfo?.nom)}
              </Link>
            </li>
          )}
          <li>
            <span aria-hidden="true">›</span>
            <span className="pd-breadcrumb-current" aria-current="page">{produit.titre}</span>
          </li>
        </ol>
      </nav>

      {/* ── Corps principal ───────────────────────── */}
      <div className="pd-container">
        <div className="pd-main-grid">

          {/* ── Galerie images ──────────────────── */}
          <div className="pd-gallery">
            {/* Image principale */}
            <div className="pd-img-main-wrapper">
              {reduction && (
                <span className="pd-badge-promo">-{reduction}%</span>
              )}
              {produit.est_nouveau && (
                <span className="pd-badge-nouveau">Nouveau</span>
              )}
              <img
                src={images[imageActive]}
                alt={produit.titre}
                className="pd-img-main"
              />
            </div>

            {/* Thumbnails removed */}
          </div>

          {/* ── Infos produit ────────────────────── */}
          <div className="pd-info">

            {/* Marque */}
            {produit.marque && (
              <span className="pd-marque">{produit.marque}</span>
            )}

            {/* Titre */}
            <h1 className="pd-titre">{produit.titre}</h1>

            {/* Référence */}
            {produit.reference && (
              <p className="pd-reference">Réf : {produit.reference}</p>
            )}

            {/* Note */}
            {produit.note_moyenne > 0 && (
              <div className="pd-note">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`pd-etoile ${i <= Math.round(produit.note_moyenne) ? "pd-etoile--pleine" : ""}`}>★</span>
                ))}
                <span>{produit.note_moyenne}/5</span>
                <span>({produit.nombre_avis} avis)</span>
              </div>
            )}

            {/* Prix */}
            <div className="pd-prix-bloc">
              <span className="pd-prix-final">
                {Number(prixFinal).toLocaleString("fr-FR")} FCFA
              </span>
              {produit.prix_promo && (
                <span className="pd-prix-barre">
                  {Number(produit.prix).toLocaleString("fr-FR")} FCFA
                </span>
              )}
              {produit.prix_promo && (
                <span className="pd-economie">
                  Économie : {Number(produit.prix - produit.prix_promo).toLocaleString("fr-FR")} FCFA
                </span>
              )}
            </div>

            {/* Stock */}
            <div className="pd-stock">
              {produit.stock === 0 ? (
                <span className="pd-stock--rupture">
                  <i className="fa-solid fa-circle-xmark pd-icon-inline" aria-hidden="true"></i>
                  Rupture de stock
                </span>
              ) : produit.stock <= 5 ? (
                <span className="pd-stock--alerte">
                  <i className="fa-solid fa-triangle-exclamation pd-icon-inline" aria-hidden="true"></i>
                  Plus que {produit.stock} en stock !
                </span>
              ) : (
                <span className="pd-stock--dispo">
                  <i className="fa-solid fa-circle-check pd-icon-inline" aria-hidden="true"></i>
                  En stock ({produit.stock} disponibles)
                </span>
              )}
            </div>

            {/* Garantie */}
            {produit.garantie && (
              <div className="pd-garantie">
                <i className="fa-solid fa-shield-halved pd-icon-inline" aria-hidden="true"></i>
                <span>Garantie : {produit.garantie}</span>
              </div>
            )}

            {/* Quantité + Panier */}
            <div className="pd-acheter">
              <div className="pd-quantite">
                <button onClick={() => setQuantite((q) => Math.max(1, q - 1))}>−</button>
                <span>{quantite}</span>
                <button onClick={() => setQuantite((q) => Math.min(produit.stock, q + 1))}>+</button>
              </div>

              <button
                className={`pd-btn-panier ${ajouteAuPanier ? "pd-btn-panier--ok" : ""}`}
                onClick={handlePanier}
                disabled={produit.stock === 0 || ajouteAuPanier}
              >
                {ajouteAuPanier ? (
                  <>
                    <i className="fa-solid fa-circle-check pd-icon-inline" aria-hidden="true"></i>
                    Ajouté au panier !
                  </>
                ) : (
                  <>
                    <i className="fa-solid fa-cart-shopping pd-icon-inline" aria-hidden="true"></i>
                    Ajouter au panier
                  </>
                )}
              </button>

              <button
                className="pd-btn-payer"
                onClick={handlePaiementProduit}
                disabled={produit.stock === 0 || paiementLoading}
              >
                <i className="fa-solid fa-credit-card pd-icon-inline" aria-hidden="true"></i>
                {paiementLoading ? "Redirection..." : "Payer maintenant"}
              </button>

              <button
                className={`pd-btn-favori ${favori ? "pd-btn-favori--actif" : ""}`}
                onClick={handleFavori}
                title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
                aria-label={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                <i className={`${favori ? "fa-solid" : "fa-regular"} fa-heart`} aria-hidden="true"></i>
              </button>
            </div>

            

            {/* Infos rapides */}
            <div className="pd-infos-rapides">
              <div className="pd-info-item">
                <i className="fa-solid fa-box-open pd-info-icon" aria-hidden="true"></i>
                <span>Livraison disponible</span>
              </div>
              <div className="pd-info-item">
                <i className="fa-solid fa-rotate-left pd-info-icon" aria-hidden="true"></i>
                <span>Retour sous 7 jours</span>
              </div>
              <div className="pd-info-item">
                <i className="fa-solid fa-credit-card pd-info-icon" aria-hidden="true"></i>
                <span>TMoney · Flooz · Visa</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Onglets ──────────────────────────────── */}
        <div className="pd-onglets">
          <div className="pd-onglets-nav" role="tablist" aria-label="Informations produit">
            {["description", "specifications", "avis"].map((o) => (
              <button
                key={o}
                type="button"
                role="tab"
                aria-selected={onglet === o}
                aria-controls={`pd-tab-panel-${o}`}
                id={`pd-tab-${o}`}
                className={`pd-onglet-btn ${onglet === o ? "pd-onglet-btn--actif" : ""}`}
                onClick={() => setOnglet(o)}
              >
                {o === "description" && (
                  <>
                    <i className="fa-regular fa-file-lines pd-tab-icon" aria-hidden="true"></i>
                    Description
                  </>
                )}
                {o === "specifications" && (
                  <>
                    <i className="fa-solid fa-sliders pd-tab-icon" aria-hidden="true"></i>
                    Spécifications
                  </>
                )}
                {o === "avis" && (
                  <>
                    <i className="fa-solid fa-star pd-tab-icon" aria-hidden="true"></i>
                    Avis ({avisCount})
                  </>
                )}
              </button>
            ))}
          </div>

          <div className="pd-onglet-contenu">
            {onglet === "description" && (
              <div className="pd-description" role="tabpanel" id="pd-tab-panel-description" aria-labelledby="pd-tab-description">
                {produit.description
                  ? <p>{produit.description}</p>
                  : <p className="pd-vide">Aucune description disponible.</p>
                }
              </div>
            )}

            {onglet === "specifications" && (
              <div className="pd-specs" role="tabpanel" id="pd-tab-panel-specifications" aria-labelledby="pd-tab-specifications">
                {specsEntries.length > 0 ? (
                  <table className="pd-specs-table">
                    <tbody>
                      {specsEntries.map(([k, v]) => (
                        <tr key={k}>
                          <td className="pd-specs-key">{k}</td>
                          <td className="pd-specs-val">{toReadableSpecValue(v)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="pd-vide">Aucune spécification disponible.</p>
                )}
              </div>
            )}

            {onglet === "avis" && (
              <div className="pd-avis" role="tabpanel" id="pd-tab-panel-avis" aria-labelledby="pd-tab-avis">
                <form
                  className="pd-avis-item"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setAvisMessage("");
                    setAvisError("");

                    const userId = getCurrentUserId();
                    if (!userId) {
                      setAvisError("Connectez-vous pour publier un avis.");
                      return;
                    }

                    if (!avisForm.note || avisForm.note < 1) {
                      setAvisError("Sélectionnez une note avec les étoiles.");
                      return;
                    }

                    if (String(avisForm.contenu || "").trim().length < 3) {
                      setAvisError("Votre avis doit contenir au moins 3 caractères.");
                      return;
                    }

                    setAvisSubmitting(true);
                    try {
                      await api.post("/commentaires", {
                        contenu: String(avisForm.contenu || "").trim(),
                        note: Number(avisForm.note),
                        commentable_type: "PRODUIT",
                        commentable_id: Number(produit.id_produit),
                        id_utilisateur: Number(userId),
                      });

                      const refreshed = await getProduit(id);
                      setProduit(refreshed.data?.data || produit);
                      setAvisForm({ note: 0, contenu: "" });
                      setHoverNote(0);
                      setAvisMessage("Avis publié avec succès.");
                    } catch (error) {
                      const backendMessage =
                        error?.response?.data?.message ||
                        error?.response?.data?.errors?.contenu?.[0] ||
                        error?.response?.data?.errors?.note?.[0] ||
                        "Impossible d'envoyer l'avis pour le moment.";
                      setAvisError(backendMessage);
                    } finally {
                      setAvisSubmitting(false);
                    }
                  }}
                >
                  <div className="pd-avis-header" style={{ marginBottom: "0.6rem" }}>
                    <span className="pd-avis-auteur">Laisser un avis</span>
                  </div>

                  <div className="pd-avis-note" aria-label="Sélection de la note">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverNote || avisForm.note);
                      return (
                        <button
                          key={`rate-${star}`}
                          type="button"
                          className="pd-note-btn"
                          aria-label={`${star} étoile${star > 1 ? "s" : ""}`}
                          onMouseEnter={() => setHoverNote(star)}
                          onMouseLeave={() => setHoverNote(0)}
                          onClick={() => setAvisForm((prev) => ({ ...prev, note: star }))}
                        >
                          <span className={`pd-etoile ${isActive ? "pd-etoile--pleine" : ""}`}>★</span>
                        </button>
                      );
                    })}
                  </div>

                  <textarea
                    className="pd-avis-input"
                    rows={4}
                    placeholder="Partagez votre retour sur ce produit..."
                    value={avisForm.contenu}
                    onChange={(event) => setAvisForm((prev) => ({ ...prev, contenu: event.target.value }))}
                    disabled={avisSubmitting}
                  />

                  <div className="pd-avis-actions">
                    <button type="submit" className="pd-btn-panier" disabled={avisSubmitting}>
                      {avisSubmitting ? "Envoi..." : "Publier mon avis"}
                    </button>
                  </div>

                  {avisError && <p className="pd-vide" style={{ color: "#b91c1c", marginTop: "0.6rem" }}>{avisError}</p>}
                  {avisMessage && <p style={{ color: "#15803d", marginTop: "0.6rem", fontSize: "0.92rem", fontWeight: 600 }}>{avisMessage}</p>}
                </form>

                {produit.commentaires?.length > 0 ? (
                  produit.commentaires.map((c, i) => (
                    <div key={i} className="pd-avis-item">
                      <div className="pd-avis-header">
                        <span className="pd-avis-auteur">{c.utilisateur?.nom || c.auteur || "Anonyme"}</span>
                        <span className="pd-avis-date">{new Date(c.created_at || c.date || Date.now()).toLocaleDateString("fr-FR")}</span>
                      </div>
                      {c.note && (
                        <div className="pd-avis-note">
                          {[1,2,3,4,5].map((i) => (
                            <span key={i} className={`pd-etoile ${i <= c.note ? "pd-etoile--pleine" : ""}`}>★</span>
                          ))}
                        </div>
                      )}
                      <p className="pd-avis-texte">{c.contenu}</p>
                    </div>
                  ))
                ) : (
                  <p className="pd-vide">Aucun avis pour ce produit.</p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Retour boutique */}
        <Link to={location.state?.from || "/produits"} className="pd-back-link">
          ← Retour à la boutique
        </Link>
      </div>
    </div>
  );
}
