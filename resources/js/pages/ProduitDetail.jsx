import React, { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router-dom";
import { getProduit, getCategorie } from "../services/ProduitService";
import "../styles/produitdetail.css";

export default function ProduitDetail() {
  const { id } = useParams();
  const location = useLocation();
  const [produit,       setProduit]       = useState(null);
  const [loading,       setLoading]       = useState(true);
  const [imageActive,   setImageActive]   = useState(0);
  const [quantite,      setQuantite]      = useState(1);
  const [ajouteAuPanier, setAjouteAuPanier] = useState(false);
  const [favori,        setFavori]        = useState(false);
  const [onglet,        setOnglet]        = useState("description");
  const [categorieInfo, setCategorieInfo] = useState(null);

  useEffect(() => {
    setLoading(true);
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

  const categoryId = (produit?.categorie?.id_categorie || categorieInfo?.id_categorie || produit?.id_categorie);
  const geovisionLink = categoryId ? `/geovision/categorie/${categoryId}/produits/${produit?.id_produit || produit?.id}` : "/geovision";

  useEffect(() => {
    if (!produit) return;
    console.debug("ProduitDetail: categorie embed:", produit.categorie, "fetched:", categorieInfo, "_catCheck:", _catCheck, "isGeovision:", isGeovision);
  }, [produit, categorieInfo, _catCheck, isGeovision]);

  const handlePanier = () => {
    setAjouteAuPanier(true);
    // TODO: dispatch vers contexte panier avec quantite
    setTimeout(() => setAjouteAuPanier(false), 2000);
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
    : [produit.image_url || "/placeholder.png"];

  const prixFinal   = produit.prix_promo ?? produit.prix;
  const reduction   = produit.prix_promo
    ? Math.round(((produit.prix - produit.prix_promo) / produit.prix) * 100)
    : null;

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
                className={`pd-btn-favori ${favori ? "pd-btn-favori--actif" : ""}`}
                onClick={() => setFavori((f) => !f)}
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
          <div className="pd-onglets-nav">
            {["description", "specifications", "avis"].map((o) => (
              <button
                key={o}
                className={`pd-onglet-btn ${onglet === o ? "pd-onglet-btn--actif" : ""}`}
                onClick={() => setOnglet(o)}
              >
                {o === "description"   && "📝 Description"}
                {o === "specifications" && "⚙️ Spécifications"}
                {o === "avis"           && `⭐ Avis (${produit.nombre_avis})`}
              </button>
            ))}
          </div>

          <div className="pd-onglet-contenu">
            {onglet === "description" && (
              <div className="pd-description">
                {produit.description
                  ? <p>{produit.description}</p>
                  : <p className="pd-vide">Aucune description disponible.</p>
                }
              </div>
            )}

            {onglet === "specifications" && (
              <div className="pd-specs">
                {produit.specifications && Object.keys(produit.specifications).length > 0 ? (
                  <table className="pd-specs-table">
                    <tbody>
                      {Object.entries(produit.specifications).map(([k, v]) => (
                        <tr key={k}>
                          <td className="pd-specs-key">{k}</td>
                          <td className="pd-specs-val">{v}</td>
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
                {produit.commentaires?.length > 0 ? (
                  produit.commentaires.map((c, i) => (
                    <div key={i} className="pd-avis-item">
                      <div className="pd-avis-header">
                        <span className="pd-avis-auteur">{c.auteur || "Anonyme"}</span>
                        <span className="pd-avis-date">{new Date(c.created_at).toLocaleDateString("fr-FR")}</span>
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