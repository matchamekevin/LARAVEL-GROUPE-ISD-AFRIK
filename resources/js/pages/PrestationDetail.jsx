import React, { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getCategories } from "../services/ProduitService";
import { INGENIERIE_DEFAULT_DOMAINES, resolveIngenierieDomaines } from "../data/ingenierieDomains";
import "../styles/prestation-detail.css";

export default function PrestationDetail() {
  const { slug } = useParams();
  const [domaines, setDomaines] = useState(INGENIERIE_DEFAULT_DOMAINES);

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
              <ul className="prestation-services-list">
                {prestation.services.map((service) => (
                  <li key={service}>{service}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="prestation-info-grid">
            {!!prestation.deliverables?.length && (
              <article className="prestation-info-card">
                <h3>Livrables projet</h3>
                <ul>
                  {prestation.deliverables.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )}

            {!!prestation.technologies?.length && (
              <article className="prestation-info-card">
                <h3>Technologies et environnements</h3>
                <ul>
                  {prestation.technologies.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            )}
          </div>

          <div className="prestation-contact-cta">
            <h3>Interesse par cette prestation ?</h3>
            <Link to="/contact" className="prestation-contact-btn">
              Demander un devis →
            </Link>
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

