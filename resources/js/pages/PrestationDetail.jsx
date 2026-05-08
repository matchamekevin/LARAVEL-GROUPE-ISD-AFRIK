import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getCategories } from "../services/ProduitService";
import { INGENIERIE_DEFAULT_DOMAINES, resolveIngenierieDomaines } from "../data/ingenierieDomains";
import AdminToast, { useAdminToast } from "../admin/components/AdminToast";
import "../styles/prestation-detail.css";

export default function PrestationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { showToast } = useAdminToast();
  const [domaines, setDomaines] = useState(INGENIERIE_DEFAULT_DOMAINES);
  const [selectedServices, setSelectedServices] = useState(new Set());
  const [selectedTechnologies, setSelectedTechnologies] = useState(new Set());
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadDomaines = async () => {
      try {
        const response = await getCategories({ segment: "ingenierie-page", tree: 1 });
        const resolved = resolveIngenierieDomaines(response?.data || []);
        if (mounted && Array.isArray(resolved) && resolved.length) {
          setDomaines(resolved);
        }
      } catch (_error) {
        // fallback data already loaded
      }
    };

    loadDomaines();

    return () => {
      mounted = false;
    };
  }, []);

  const prestation = useMemo(() => domaines.find((item) => item.slug === slug), [domaines, slug]);

  usePageMeta(
    prestation ? `${prestation.title} | Groupe ISD AFRIK` : "Prestation non trouvee",
    prestation ? prestation.description : "Prestation non disponible"
  );

  const toggleService = (service) => {
    const updated = new Set(selectedServices);
    if (updated.has(service)) {
      updated.delete(service);
    } else {
      updated.add(service);
    }
    setSelectedServices(updated);
  };

  const toggleTechnology = (tech) => {
    const updated = new Set(selectedTechnologies);
    if (updated.has(tech)) {
      updated.delete(tech);
    } else {
      updated.add(tech);
    }
    setSelectedTechnologies(updated);
  };

  const handleDevisSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedServices.size === 0 && selectedTechnologies.size === 0) {
      showToast("Selectionnez au moins un service ou une technologie", "error");
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/devis-prestation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prestation_slug: prestation.slug,
          prestation_name: prestation.title,
          services: Array.from(selectedServices),
          technologies: Array.from(selectedTechnologies),
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Erreur lors de l'envoi du devis");
      }

      showToast("Devis envoyé avec succès! Vous pouvez aussi remplir le formulaire de contact.", "success");
      setSelectedServices(new Set());
      setSelectedTechnologies(new Set());
      
      // Redirect to contact form after 2 seconds
      setTimeout(() => navigate("/contact"), 2000);
    } catch (error) {
      showToast(error.message || "Erreur lors de l'envoi du devis", "error");
    } finally {
      setSubmitting(false);
    }
  }

  if (!prestation) {
    return (
      <div className="prestation-not-found">
        <div className="prestation-not-found-content">
          <h1>Prestation non trouvee</h1>
          <p>Desole, nous n&apos;avons pas trouve cette prestation.</p>
          <Link to="/ingenierie" className="prestation-back-btn">
            ← Retour aux prestations
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = domaines.findIndex((item) => item.slug === slug);
  const prevPrestation = currentIndex > 0 ? domaines[currentIndex - 1] : null;
  const nextPrestation = currentIndex < domaines.length - 1 ? domaines[currentIndex + 1] : null;

  return (
    <div className="prestation-detail-page">
      <Link to="/ingenierie" className="prestation-back-btn">
        ← Ingenierie
      </Link>

      <section className="prestation-hero">
        <img
          src={prestation.image}
          alt={prestation.title}
          className="prestation-hero-image"
          onError={(event) => {
            event.target.src = "/images/prestations/default.jpg";
          }}
        />
        <div className="prestation-hero-overlay"></div>
        <div className="prestation-hero-content">
          <h1 className="prestation-hero-title">{prestation.title}</h1>
        </div>
      </section>

      <section className="prestation-content">
        <div className="prestation-container">
          <div className="prestation-description">
            <h2>A propos de cette prestation</h2>
            <p className="prestation-intro">{prestation.description}</p>
            <p className="prestation-details">{prestation.details}</p>
          </div>

          {!!prestation.services?.length && (
            <div className="prestation-services">
              <h2>Services inclus</h2>
              <form className="prestation-services-selector">
                {prestation.services.map((service) => (
                  <label key={service} className="prestation-service-checkbox">
                    <input
                      type="checkbox"
                      checked={selectedServices.has(service)}
                      onChange={() => toggleService(service)}
                    />
                    <span>{service}</span>
                  </label>
                ))}
              </form>
            </div>
          )}

          {!!prestation.technologies?.length && (
            <div className="prestation-info-grid">
              <article className="prestation-info-card">
                <h3>Technologies et environnements</h3>
                <form className="prestation-technologies-selector">
                  {prestation.technologies.map((tech) => (
                    <label key={tech} className="prestation-tech-checkbox">
                      <input
                        type="checkbox"
                        checked={selectedTechnologies.has(tech)}
                        onChange={() => toggleTechnology(tech)}
                      />
                      <span>{tech}</span>
                    </label>
                  ))}
                </form>
              </article>
            </div>
          )}

          <div className="prestation-contact-cta">
            <h3>Interesse par cette prestation ?</h3>
            <form onSubmit={handleDevisSubmit} className="prestation-devis-form">
              <button
                type="submit"
                className="prestation-contact-btn"
                disabled={submitting || (selectedServices.size === 0 && selectedTechnologies.size === 0)}
              >
                {submitting ? "Envoi en cours..." : "Demander un devis →"}
              </button>
            </form>
          </div>
        </div>
      </section>

      <section className="prestation-navigation">
        <div className="prestation-container">
          <div className="prestation-nav-grid">
            {prevPrestation && (
              <Link to={`/prestation/${prevPrestation.slug}`} className="prestation-nav-card prestation-nav-prev">
                <span className="prestation-nav-arrow">← Precedent</span>
                <span className="prestation-nav-title">{prevPrestation.title}</span>
              </Link>
            )}
            <div></div>
            {nextPrestation && (
              <Link to={`/prestation/${nextPrestation.slug}`} className="prestation-nav-card prestation-nav-next">
                <span className="prestation-nav-arrow">Suivant →</span>
                <span className="prestation-nav-title">{nextPrestation.title}</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

