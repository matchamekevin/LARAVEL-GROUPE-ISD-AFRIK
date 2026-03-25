import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation, useNavigate } from "react-router-dom";
import api from "../axios";
import { getProduit, getCategorie } from "../services/ProduitService";
import { addToCart, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import "../styles/produitdetail.css";

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
    getProduit(id)
      .then((res) => {
        setProduit(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Erreur chargement produit", err);
        setLoading(false);
      });
  }, [id]);

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
          <div>📦</div>
          <h2>Produit introuvable</h2>
          <Link to={location.state?.from || "/produits"} className="pd-back-btn">← Retour boutique</Link>
        </div>
      </div>
    );
  }

  const images = produit.images?.length
    ? produit.images.map((img) => img.url || img.path)
    : [produit.image_url || "/placeholder.webp"];

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
      <nav className="pd-breadcrumb">
        <div className="pd-breadcrumb-inner">
          <Link to="/">Accueil</Link>
          <span>›</span>
          <Link to="/produits">Boutique</Link>
          {isGeovision && (
            <>
              <span>›</span>
              <Link to={geovisionLink}>Geovision</Link>
            </>
          )}
          {(produit.categorie || categorieInfo) && (
            <>
              <span>›</span>
              <Link to={`/produits?id_categorie=${(produit.categorie?.id_categorie || categorieInfo?.id_categorie || produit.id_categorie)}`}>
                {(produit.categorie?.nom || categorieInfo?.nom)}
              </Link>
            </>
          )}
          <span>›</span>
          <span className="pd-breadcrumb-current">{produit.titre}</span>
        </div>
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

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="pd-thumbnails">
                {images.map((src, i) => (
                  <button
                    key={i}
                    className={`pd-thumb ${imageActive === i ? "pd-thumb--actif" : ""}`}
                    onClick={() => setImageActive(i)}
                  >
                    <img src={src} alt={`Vue ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
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
                <span className="pd-stock--rupture">❌ Rupture de stock</span>
              ) : produit.stock <= 5 ? (
                <span className="pd-stock--alerte">⚠️ Plus que {produit.stock} en stock !</span>
              ) : (
                <span className="pd-stock--dispo">✅ En stock ({produit.stock} disponibles)</span>
              )}
            </div>

            {/* Garantie */}
            {produit.garantie && (
              <div className="pd-garantie">🛡️ Garantie : {produit.garantie}</div>
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
                {ajouteAuPanier ? "✅ Ajouté au panier !" : "🛒 Ajouter au panier"}
              </button>

              <button
                className="pd-btn-payer"
                onClick={() => navigate('/paiement')}
                disabled={produit.stock === 0}
              >
                💳 Payer maintenant
              </button>

              <button
                className={`pd-btn-favori ${favori ? "pd-btn-favori--actif" : ""}`}
                onClick={handleFavori}
                title={favori ? "Retirer des favoris" : "Ajouter aux favoris"}
              >
                {favori ? "❤️" : "🤍"}
              </button>
            </div>

            {/* Infos rapides */}
            <div className="pd-infos-rapides">
              <div className="pd-info-item">📦 <span>Livraison disponible</span></div>
              <div className="pd-info-item">🔄 <span>Retour sous 7 jours</span></div>
              <div className="pd-info-item">💳 <span>TMoney · Flooz · Visa</span></div>
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
                {o === "description"   && "📝 Description"}
                {o === "specifications" && "⚙️ Spécifications"}
                {o === "avis"           && `⭐ Avis (${avisCount})`}
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
