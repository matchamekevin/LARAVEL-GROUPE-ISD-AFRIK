import React, { useEffect, useRef, useState } from "react";
import { Link, useParams, useLocation, useNavigate } from "react-router-dom";
import api from "../axios";
import Loader from "../components/Loader";
import { getCategorie, getProduit, getProduits } from "../services/ProduitService";
import { useLivePolling } from "../hooks/useLivePolling";
import { addToCart, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import { notifyMutation } from "../utils/mutationBus";
import { toastError, toastSuccess } from "../utils/toast";
import "../styles/produitdetail.css";

function normalizeMediaUrl(value) {
  const trimmed = String(value || "").trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("/")) return trimmed;
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
      if (seen.has(candidate)) return false;
      seen.add(candidate);
      return true;
    });
}

function collectGalleryFromProducts(products) {
  const gallery = [];
  const seen = new Set();
  (Array.isArray(products) ? products : []).forEach((product) => {
    collectProductMedia(product).forEach((candidate) => {
      if (seen.has(candidate)) return;
      seen.add(candidate);
      gallery.push(candidate);
    });
  });
  return gallery;
}

function toReadableSpecValue(value) {
  if (value === null || value === undefined || value === "") return "-";
  if (Array.isArray(value)) {
    const flat = value.map((item) => toReadableSpecValue(item)).filter((item) => item !== "-");
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
  if (!specifications) return {};
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
  const [produit,         setProduit]         = useState(null);
  const [loading,         setLoading]         = useState(true);
  const [imageActive,     setImageActive]     = useState(0);
  const [quantite,        setQuantite]        = useState(1);
  const [ajouteAuPanier,  setAjouteAuPanier]  = useState(false);
  const [favori,          setFavori]          = useState(false);
  const [onglet,          setOnglet]          = useState("description");
  const [categorieInfo,   setCategorieInfo]   = useState(null);
  const [avisForm,        setAvisForm]        = useState({ note: 0, contenu: "" });
  const [hoverNote,       setHoverNote]       = useState(0);
  const [avisSubmitting,  setAvisSubmitting]  = useState(false);
  const [modelGallery,    setModelGallery]    = useState([]);
  const [paiementLoading, setPaiementLoading] = useState(false);
  const [refreshToken,    setRefreshToken]    = useState(0);
  const resumeHandledRef = useRef(false);

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

  // ✅ Récupérer les données utilisateur depuis localStorage
  const getCurrentUser = () => {
    try {
      const stored = localStorage.getItem("user");
      if (!stored) return {};
      return JSON.parse(stored) || {};
    } catch {
      return {};
    }
  };

  useEffect(() => {
    setLoading(true);
    setOnglet("description");
    setImageActive(0);
    setModelGallery([]);
    getProduit(id)
      .then((res) => { setProduit(res.data.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id, refreshToken]);

  const backgroundLoadProduit = async () => {
    try {
      const res = await getProduit(id);
      setProduit(res.data.data);
    } catch {}
  };

  useLivePolling(() => backgroundLoadProduit(), {
    intervalMs: 3000,
    enabled: Boolean(id) && !avisSubmitting && !paiementLoading,
  });

  useEffect(() => {
    let active = true;
    if (produit && !produit.categorie && produit.id_categorie) {
      getCategorie(produit.id_categorie)
        .then((r) => { if (!active) return; setCategorieInfo(r.data?.data || r.data || null); })
        .catch(() => { if (active) setCategorieInfo(null); });
    }
    return () => { active = false; };
  }, [produit]);

  useEffect(() => {
    let active = true;
    const loadModelGallery = async () => {
      if (!produit?.modele) { setModelGallery([]); return; }
      const baseParams = { modele: produit.modele, par_page: 50, tri: "recent" };
      if (produit.id_categorie) baseParams.id_categorie = produit.id_categorie;
      try {
        const response = await getProduits(baseParams);
        if (!active) return;
        const items = Array.isArray(response.data?.data) ? response.data.data : [];
        const categoryGallery = collectGalleryFromProducts(items);
        if (categoryGallery.length > 0) { setModelGallery(categoryGallery); return; }
        const fallbackResponse = await getProduits({ modele: produit.modele, par_page: 50, tri: "recent" });
        if (!active) return;
        setModelGallery(collectGalleryFromProducts(Array.isArray(fallbackResponse.data?.data) ? fallbackResponse.data.data : []));
      } catch { if (active) setModelGallery([]); }
    };
    loadModelGallery();
    return () => { active = false; };
  }, [produit?.modele, produit?.id_categorie]);

  const _catCheckSource = produit?.categorie || categorieInfo || {};
  const _catCheck = (_catCheckSource.segment || _catCheckSource.slug || _catCheckSource.nom || produit?.marque || "").toString().toLowerCase();
  const isGeovision = _catCheck.includes("geovision");
  const categorySlug = (produit?.categorie?.slug || categorieInfo?.slug || "");
  const geovisionLink = categorySlug ? `/geovision/categorie/${categorySlug}` : "/geovision";

  useEffect(() => {
    if (!produit?.id_produit) { setFavori(false); return; }
    const refreshFavoriteState = () => setFavori(isFavorite(produit.id_produit));
    refreshFavoriteState();
    return subscribeStoreUpdates(refreshFavoriteState);
  }, [produit?.id_produit]);

  const handlePanier = () => {
    if (!produit || produit.stock === 0) return;
    addToCart(produit, quantite);
    setAjouteAuPanier(true);
    setTimeout(() => setAjouteAuPanier(false), 2000);
  };

  const handleFavori = () => {
    if (!produit) return;
    const result = toggleFavorite(produit);
    setFavori(Boolean(result?.isFavorite));
  };

  // ✅ CORRIGÉ — handlePaiementProduit envoie les bons champs
  const handlePaiementProduit = async (forcedQuantity = null) => {
    if (!produit || Number(produit.stock || 0) <= 0 || paiementLoading) return;
    const quantityToPay = Math.max(1, Number(forcedQuantity || quantite || 1));

    if (!localStorage.getItem("token")) {
      navigate('/login', {
        state: {
          from: `${location.pathname}${location.search || ""}`,
          post_login_intent: "pay_product",
          post_login_payload: {
            id_produit: Number(produit.id_produit),
            quantite: quantityToPay,
          },
        },
      });
      return;
    }

    setPaiementLoading(true);

    try {
      // Récupérer les données utilisateur depuis localStorage
      const user = getCurrentUser();

      const response = await api.post("/produits/paiement", {
        id_produit:       Number(produit.id_produit),
        quantite:         quantityToPay,
        nom_livraison:    user.nom       || "Client",
        prenom_livraison: user.prenom    || "ISD",
        email:            user.email     || "",
        telephone:        user.telephone || "00000000",
        adresse:          user.adresse   || "Lomé, Togo",
      });

      const checkoutUrl = response?.data?.checkout_url;
      if (!checkoutUrl) throw new Error("URL de paiement manquante.");

      window.location.href = checkoutUrl;

    } catch (error) {
      if (error?.response?.status === 401) {
        setPaiementLoading(false);
        navigate('/login', {
          state: {
            from: `${location.pathname}${location.search || ""}`,
            post_login_intent: "pay_product",
            post_login_payload: {
              id_produit: Number(produit.id_produit),
              quantite: quantityToPay,
            },
          },
        });
        return;
      }
      const msg = error?.response?.data?.message || "Impossible d'initialiser le paiement pour ce produit.";
      toastError(msg);
      setPaiementLoading(false);
    }
  };

  useEffect(() => {
    const intent = location.state?.post_login_intent;
    const payload = location.state?.post_login_payload;
    const hasToken = Boolean(localStorage.getItem("token"));

    if (!hasToken || !produit?.id_produit || paiementLoading || resumeHandledRef.current) {
      return;
    }

    if (intent !== "pay_product") {
      return;
    }

    const targetProductId = Number(payload?.id_produit || 0);
    if (targetProductId && targetProductId !== Number(produit.id_produit)) {
      return;
    }

    resumeHandledRef.current = true;
    const quantityToPay = Math.max(1, Number(payload?.quantite || quantite || 1));
    setQuantite(quantityToPay);
    handlePaiementProduit(quantityToPay);
  }, [location.state, paiementLoading, produit?.id_produit]);

  if (loading) {
    return (
      <div className="pd-page">
        <Loader variant="skeleton" type="detail" />
      </div>
    );
  }

  if (!produit) {
    return (
      <div className="pd-page">
        <div className="pd-not-found">
          <div><i className="fa-solid fa-box-open pd-empty-icon" aria-hidden="true"></i></div>
          <h2>Produit introuvable</h2>
          <button type="button" className="pd-back-btn" onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/produits");
            }
          }}>← Retour boutique</button>
        </div>
      </div>
    );
  }

  const localGallery = collectProductMedia(produit);
  const images = modelGallery.length > 0 ? modelGallery : localGallery.length > 0 ? localGallery : ["/images/produits/proj.webp"];
  const prixFinal = produit.prix_promo ?? produit.prix;
  const reduction = produit.prix_promo ? Math.round(((produit.prix - produit.prix_promo) / produit.prix) * 100) : null;
  const avisCount = Number(produit.nombre_avis || 0) || (Array.isArray(produit.commentaires) ? produit.commentaires.length : 0);
  const specsObject = toSpecificationsObject(produit.specifications);
  const specsEntries = Object.entries(specsObject);

  const slugifyCategory = (cat) => String(cat?.slug || cat?.nom || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9-]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");

  const catNode = produit.categorie || categorieInfo || null;
  const catParent = catNode?.parent || null;
  const catGrandParent = catParent?.parent || null;

  return (
    <div className="pd-page">

      <nav className="pd-breadcrumb" aria-label="Fil d'Ariane">
        <Link to="/" className="pd-breadcrumb-link">Accueil</Link>
        <span className="pd-breadcrumb-sep">/</span>
        <button type="button" className="pd-breadcrumb-link-btn" onClick={() => navigate("/produits")}>
          Produits
        </button>
        {catGrandParent && (
          <>
            <span className="pd-breadcrumb-sep">/</span>
            <Link to={`/produits?categories=${slugifyCategory(catGrandParent)}`} className="pd-breadcrumb-link">{catGrandParent.nom}</Link>
          </>
        )}
        {catParent && (!catGrandParent || catParent.slug !== catGrandParent.slug) && (
          <>
            <span className="pd-breadcrumb-sep">/</span>
            <Link to={`/produits?categories=${slugifyCategory(catGrandParent || catParent)}&sous_categorie_id=${catParent.id_categorie || catParent.id}`} className="pd-breadcrumb-link">{catParent.nom}</Link>
          </>
        )}
        {catNode && (!catParent || catNode.slug !== catParent.slug) && (
          <>
            <span className="pd-breadcrumb-sep">/</span>
            <Link to={`/produits?categories=${slugifyCategory(catParent || catNode)}&sous_categorie_id=${catNode.id_categorie || catNode.id}`} className="pd-breadcrumb-link">{catNode.nom}</Link>
          </>
        )}
        <span className="pd-breadcrumb-sep">/</span>
        <span className="pd-breadcrumb-current">{produit.titre}</span>
      </nav>

      {/* ── Corps principal ───────────────────────── */}
      <div className="pd-container">
        <div className="pd-main-grid">

          {/* ── Galerie images ──────────────────── */}
          <div className="pd-gallery">
            <div className="pd-img-main-wrapper">
              {reduction && <span className="pd-badge-promo">-{reduction}%</span>}
              {produit.est_nouveau && <span className="pd-badge-nouveau">Nouveau</span>}
              <img src={images[imageActive]} alt={produit.titre} className="pd-img-main" onError={(e) => { const img = e.currentTarget; if (img && !img.dataset.fallback) { img.dataset.fallback = "1"; img.src = "/images/produits/proj.webp"; } }} />
            </div>
          </div>

          {/* ── Infos produit ────────────────────── */}
          <div className="pd-info">
            {produit.marque && <span className="pd-marque">{produit.marque}</span>}
            <h1 className="pd-titre">{produit.titre}</h1>
            {produit.reference && <p className="pd-reference">Réf : {produit.reference}</p>}

            {produit.note_moyenne > 0 && (
              <div className="pd-note">
                {[1, 2, 3, 4, 5].map((i) => (
                  <span key={i} className={`pd-etoile ${i <= Math.round(produit.note_moyenne) ? "pd-etoile--pleine" : ""}`}>★</span>
                ))}
                <span>{produit.note_moyenne}/5</span>
                <span>({produit.nombre_avis} avis)</span>
              </div>
            )}

            <div className="pd-prix-bloc">
              <span className="pd-prix-final">{Number(prixFinal).toLocaleString("fr-FR")} FCFA</span>
              {produit.prix_promo && <span className="pd-prix-barre">{Number(produit.prix).toLocaleString("fr-FR")} FCFA</span>}
              {produit.prix_promo && (
                <span className="pd-economie">Économie : {Number(produit.prix - produit.prix_promo).toLocaleString("fr-FR")} FCFA</span>
              )}
            </div>

            <div className="pd-stock">
              {produit.stock === 0 ? (
                <span className="pd-stock--rupture"><i className="fa-solid fa-circle-xmark pd-icon-inline" aria-hidden="true"></i>Rupture de stock</span>
              ) : produit.stock <= 5 ? (
                <span className="pd-stock--alerte"><i className="fa-solid fa-triangle-exclamation pd-icon-inline" aria-hidden="true"></i>Plus que {produit.stock} en stock !</span>
              ) : (
                <span className="pd-stock--dispo"><i className="fa-solid fa-circle-check pd-icon-inline" aria-hidden="true"></i>En stock ({produit.stock} disponibles)</span>
              )}
            </div>

            {produit.garantie && (
              <div className="pd-garantie">
                <i className="fa-solid fa-shield-halved pd-icon-inline" aria-hidden="true"></i>
                <span>Garantie : {produit.garantie}</span>
              </div>
            )}

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
                title={ajouteAuPanier ? "Ajouté au panier !" : "Ajouter au panier"}
                aria-label={ajouteAuPanier ? "Ajouté au panier !" : "Ajouter au panier"}
              >
                {ajouteAuPanier ? (
                  <i className="fa-solid fa-circle-check pd-icon-inline" aria-hidden="true"></i>
                ) : (
                  <i className="fa-solid fa-cart-shopping pd-icon-inline" aria-hidden="true"></i>
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

            <div className="pd-infos-rapides">
              <div className="pd-info-item"><i className="fa-solid fa-box-open pd-info-icon" aria-hidden="true"></i><span>Livraison disponible</span></div>
              <div className="pd-info-item"><i className="fa-solid fa-rotate-left pd-info-icon" aria-hidden="true"></i><span>Retour sous 7 jours</span></div>
              <div className="pd-info-item"><i className="fa-solid fa-credit-card pd-info-icon" aria-hidden="true"></i><span>TMoney · Flooz · Visa</span></div>
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
                className={`pd-onglet-btn ${onglet === o ? "pd-onglet-btn--actif" : ""}`}
                onClick={() => setOnglet(o)}
              >
                {o === "description" && <><i className="fa-regular fa-file-lines pd-tab-icon" aria-hidden="true"></i>Description</>}
                {o === "specifications" && <><i className="fa-solid fa-sliders pd-tab-icon" aria-hidden="true"></i>Spécifications</>}
                {o === "avis" && <><i className="fa-solid fa-star pd-tab-icon" aria-hidden="true"></i>Avis ({avisCount})</>}
              </button>
            ))}
          </div>

          <div className="pd-onglet-contenu">
            {onglet === "description" && (
              <div className="pd-description">
                {produit.description ? <p>{produit.description}</p> : <p className="pd-vide">Aucune description disponible.</p>}
              </div>
            )}

            {onglet === "specifications" && (
              <div className="pd-specs">
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
              <div className="pd-avis">
                <form
                  className="pd-avis-item"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    const userId = getCurrentUserId();
                    if (!userId) { toastError("Connectez-vous pour publier un avis."); return; }
                    if (!avisForm.note || avisForm.note < 1) { toastError("Sélectionnez une note avec les étoiles."); return; }
                    if (String(avisForm.contenu || "").trim().length < 3) { toastError("Votre avis doit contenir au moins 3 caractères."); return; }
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
                      notifyMutation();
                      toastSuccess("Avis publié avec succès.");
                    } catch (error) {
                      const backendMessage = error?.response?.data?.message || "Impossible d'envoyer l'avis pour le moment.";
                      toastError(backendMessage);
                    } finally {
                      setAvisSubmitting(false);
                    }
                  }}
                >
                  <div className="pd-avis-header" style={{ marginBottom: "0.6rem" }}>
                    <span className="pd-avis-auteur">Laisser un avis</span>
                  </div>

                  <div className="pd-avis-note">
                    {[1, 2, 3, 4, 5].map((star) => {
                      const isActive = star <= (hoverNote || avisForm.note);
                      return (
                        <button
                          key={`rate-${star}`}
                          type="button"
                          className="pd-note-btn"
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
                    <button type="submit" className="pd-btn-avis" disabled={avisSubmitting}>
                      {avisSubmitting ? "Envoi..." : "Publier mon avis"}
                    </button>
                  </div>

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

        <button
          type="button"
          className="pd-back-link pd-back-btn"
          onClick={() => {
            if (window.history.length > 1) {
              navigate(-1);
            } else {
              navigate("/produits");
            }
          }}
        >
          ← Retour
        </button>
      </div>
    </div>
  );
}
