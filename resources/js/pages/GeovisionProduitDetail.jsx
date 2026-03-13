import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  geovisionTypes,
  getGeovisionProductById,
  getGeovisionRelatedProducts,
} from "../data/geovisionCatalog";
import "../styles/geovision-product-detail.css";

export default function GeovisionProduitDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const produit = getGeovisionProductById(id);
  const [activeImage, setActiveImage] = useState(0);
  const [isPaying, setIsPaying] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile-money");

  useEffect(() => {
    setActiveImage(0);
    setIsPaying(false);
    setPaymentStatus(null);
    setPaymentReference("");
  }, [id]);

  const handleSimulatedPayment = () => {
    if (!produit || isPaying) return;

    setIsPaying(true);
    setPaymentStatus(null);

    window.setTimeout(() => {
      const reference = `GV-${produit.id}-${Date.now().toString().slice(-6)}`;
      setPaymentReference(reference);
      setPaymentStatus("success");
      setIsPaying(false);
    }, 1400);
  };

  if (!produit) {
    return (
      <div className="gpd-page">
        <div className="gpd-shell gpd-empty-state">
          <p className="gpd-kicker">Catalogue Geovision</p>
          <h1>Produit introuvable</h1>
          <p>Ce produit n'est pas disponible dans le catalogue Geovision actuel.</p>
          <div className="gpd-empty-actions">
            <Link to="/geovision" className="gpd-btn gpd-btn--primary">Retour au catalogue</Link>
            <Link to="/contact" className="gpd-btn gpd-btn--ghost">Contacter un expert</Link>
          </div>
        </div>
      </div>
    );
  }

  const category = geovisionTypes.find((item) => item.title.toLowerCase() === produit.type) || null;
  const relatedProducts = getGeovisionRelatedProducts(produit);
  const images = produit.images?.length ? produit.images : [produit.image];

  return (
    <div className="gpd-page">
      <div className="gpd-shell">
        <nav className="gpd-breadcrumb" aria-label="Fil d'Ariane">
          <Link to="/">Accueil</Link>
          <span>/</span>
          <Link to="/geovision">Geovision</Link>
          <span>/</span>
          <span>{produit.nom}</span>
        </nav>

        <section className="gpd-hero">
          <div className="gpd-gallery-panel">
            <div className="gpd-main-image-wrap">
              <img src={images[activeImage]} alt={produit.nom} className="gpd-main-image" />
              <span className="gpd-badge">{produit.badge}</span>
            </div>

            {images.length > 1 && (
              <div className="gpd-thumbs">
                {images.map((src, index) => (
                  <button
                    key={`${produit.id}-${index}`}
                    type="button"
                    className={`gpd-thumb ${index === activeImage ? "is-active" : ""}`}
                    onClick={() => setActiveImage(index)}
                  >
                    <img src={src} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="gpd-content">
            <p className="gpd-kicker">{produit.brand}</p>
            <h1>{produit.nom}</h1>
            <p className="gpd-category">{category?.title || produit.type}</p>
            <p className="gpd-description">{produit.description}</p>

            <div className="gpd-price-row">
              <span className="gpd-price">{produit.priceLabel}</span>
              <span className="gpd-availability">{produit.availability}</span>
            </div>

            <div className="gpd-payment-box">
              <div className="gpd-payment-head">
                <strong>Paiement</strong>
                <span>Simulation locale en attendant l'intégration backend.</span>
              </div>

              <div className="gpd-payment-methods" role="radiogroup" aria-label="Mode de paiement simulé">
                <button
                  type="button"
                  className={`gpd-method ${paymentMethod === "mobile-money" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("mobile-money")}
                >
                  Mobile Money
                </button>
                <button
                  type="button"
                  className={`gpd-method ${paymentMethod === "carte" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("carte")}
                >
                  Carte bancaire
                </button>
                <button
                  type="button"
                  className={`gpd-method ${paymentMethod === "virement" ? "is-active" : ""}`}
                  onClick={() => setPaymentMethod("virement")}
                >
                  Virement
                </button>
              </div>

              <div className="gpd-payment-summary">
                <div>
                  <span>Montant à payer</span>
                  <strong>{produit.priceLabel}</strong>
                </div>
                <div>
                  <span>Mode sélectionné</span>
                  <strong>{paymentMethod === "mobile-money" ? "Mobile Money" : paymentMethod === "carte" ? "Carte bancaire" : "Virement"}</strong>
                </div>
              </div>

              {paymentStatus === "success" && (
                <div className="gpd-payment-feedback gpd-payment-feedback--success">
                  <strong>Paiement simulé validé</strong>
                  <span>Référence: {paymentReference}</span>
                </div>
              )}
            </div>

            <div className="gpd-highlights">
              <div className="gpd-highlight-card">
                <strong>Déploiement</strong>
                <span>{produit.deployment}</span>
              </div>
              <div className="gpd-highlight-card">
                <strong>Délai projet</strong>
                <span>{produit.leadTime}</span>
              </div>
              <div className="gpd-highlight-card">
                <strong>Usage recommandé</strong>
                <span>{produit.summary}</span>
              </div>
            </div>

            <div className="gpd-actions">
              <button type="button" className="gpd-btn gpd-btn--primary" onClick={handleSimulatedPayment} disabled={isPaying}>
                {isPaying ? "Paiement en cours..." : "Payer maintenant"}
              </button>
              <button type="button" className="gpd-btn gpd-btn--ghost" onClick={() => navigate("/contact", { state: { subject: produit.nom } })}>
                Contacter un expert
              </button>
              <Link to="/geovision" className="gpd-btn gpd-btn--ghost">Retour au catalogue</Link>
            </div>
          </div>
        </section>

        <section className="gpd-section">
          <div className="gpd-section-head">
            <h2>Caractéristiques techniques</h2>
            <p>Configuration indicative pour l'étude et l'intégration du matériel.</p>
          </div>
          <div className="gpd-spec-grid">
            {produit.specs.map((spec) => (
              <article key={`${produit.id}-${spec.label}`} className="gpd-spec-card">
                <p>{spec.label}</p>
                <strong>{spec.value}</strong>
              </article>
            ))}
          </div>
        </section>

        {relatedProducts.length > 0 && (
          <section className="gpd-section">
            <div className="gpd-section-head">
              <h2>Produits similaires</h2>
              <p>Autres références de la même famille Geovision.</p>
            </div>
            <div className="gpd-related-grid">
              {relatedProducts.map((item) => (
                <article key={item.id} className="gpd-related-card">
                  <img src={item.image} alt={item.nom} className="gpd-related-image" />
                  <div className="gpd-related-body">
                    <span>{item.type}</span>
                    <h3>{item.nom}</h3>
                    <p>{item.description}</p>
                    <Link to={`/geovision/produit/${item.id}`} className="gpd-related-link">Voir le produit</Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}