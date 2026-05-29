import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getCategories } from "../services/ProduitService";
import { resolveIngenierieDomaines } from "../data/ingenierieDomains";
import "../styles/ingenierie-new.css";

const sanitizeImageUrl = (value) => {
    const source = String(value || "").trim();
    if (!source) return "";
    if (source.startsWith("http://") || source.startsWith("https://") || source.startsWith("/")) return source;
    if (source.startsWith("storage/") || source.startsWith("images/")) return `/${source}`;
    return "";
};

const normalizeCategoryPayload = (response) => {
    const body = response?.data ?? response;
    if (Array.isArray(body)) return body;
    if (Array.isArray(body?.data)) return body.data;
    if (Array.isArray(body?.categories)) return body.categories;
    return [];
};

const sanitizeDomaines = (list = []) =>
    list.map((domaine) => ({
        ...domaine,
        image: sanitizeImageUrl(domaine.image),
    }));

export default function Ingenierie() {
    const [domaines, setDomaines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [imageLoaded, setImageLoaded] = useState({});
    const [imageHidden, setImageHidden] = useState({});

    usePageMeta(
        "Ingénierie informatique et industrielle | Groupe ISD AFRIK",
        "Domaines d'expertise pour l'architecture SI, la securite, les reseaux et les infrastructures d'entreprise."
    );

    useEffect(() => {
        let mounted = true;

        const loadDomaines = async () => {
            try {
                const response = await getCategories({
                    segment: "ingenierie-page",
                    tree: 1,
                    _t: Date.now(),
                });
                const categories = normalizeCategoryPayload(response);
                const resolved = resolveIngenierieDomaines(categories, {
                    fallbackToDefaults: true,
                    includeBaseImageFallback: true,
                });

                if (!mounted) return;

                if (Array.isArray(resolved) && resolved.length) {
                    setDomaines(sanitizeDomaines(resolved));
                    setImageLoaded({});
                    setImageHidden({});
                } else {
                    setDomaines([]);
                }
            } catch (_error) {
                if (mounted) {
                    const fallback = resolveIngenierieDomaines([], {
                        fallbackToDefaults: true,
                        includeBaseImageFallback: true,
                    });
                    setDomaines(sanitizeDomaines(fallback));
                }
            } finally {
                if (mounted) {
                    setIsLoading(false);
                }
            }
        };

        loadDomaines();

        return () => {
            mounted = false;
        };
    }, []);

    const handleImageLoad = (slug) => {
        setImageLoaded(prev => ({ ...prev, [slug]: true }));
    };

    const handleImageError = (e, slug) => {
        if (!e.target.dataset?.retried) {
            e.target.dataset.retried = '1';
            const orig = e.target.dataset?.original || e.target.getAttribute('src') || '';
            if (orig.startsWith('/')) {
                e.target.src = window?.location?.origin + orig;
                return;
            }
        }
        setImageHidden((prev) => ({ ...prev, [slug]: true }));
    };

    return (
        <div className="ingenierie-page ingenierie-modern"> 
            <section className="ingenierie-hero-modern">
                <h1 className="ingenierie-hero-title">Nos Domaines d&apos;Expertise</h1>
                <p className="ingenierie-hero-subtitle">
                    Ingenierie informatique et industrielle - Solutions completes pour entreprises et projets d&apos;infrastructure
                </p>
</section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="ingenierie-grid"> 
                    {isLoading ? (
                        Array.from({ length: 4 }).map((_, i) => (
                            <article key={i} className="ingenierie-card">
                                <div className="ingenierie-card-image ingenierie-skeleton-img" />
                                <div className="ingenierie-card-overlay" />
                                <div className="ingenierie-card-content">
                                    <div className="ingenierie-skeleton-line ingenierie-skeleton-title" />
                                    <div className="ingenierie-skeleton-line ingenierie-skeleton-desc" />
                                    <div className="ingenierie-skeleton-line ingenierie-skeleton-desc-short" />
                                    <div className="ingenierie-card-actions">
                                        <div className="ingenierie-skeleton-btn" />
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : domaines.length ? domaines.map((domaine) => (
                        <article 
                            key={domaine.slug} 
                            id={`domaine-${domaine.slug}`}
                            className="ingenierie-card"
                        >
                            {domaine.image && !imageHidden[domaine.slug] ? (
                                <img
                                    src={domaine.image}
                                    alt={domaine.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="ingenierie-card-image"
                                    data-original={domaine.image}
                                    style={{
                                        opacity: imageLoaded[domaine.slug] ? 1 : 0,
                                        transition: "opacity 0.4s ease-in-out"
                                    }}
                                    onLoad={() => handleImageLoad(domaine.slug)}
                                    onError={(e) => handleImageError(e, domaine.slug)}
                                />
                            ) : (
                                <div className="ingenierie-card-image ingenierie-card-image--empty" aria-hidden="true"></div>
                            )}
                            <div className="ingenierie-card-overlay"></div>
                            <div className="ingenierie-card-content">
                                <h3 className="ingenierie-card-title">{domaine.title}</h3>
                                <p className="ingenierie-card-desc">{domaine.description}</p>

                                {domaine.services?.length > 0 && (
                                  <div className="ingenierie-card-tags">
                                    {domaine.services.slice(0, 3).map((svc) => (
                                      <span key={svc} className="ingenierie-tag">{svc}</span>
                                    ))}
                                    {domaine.services.length > 3 && (
                                      <span className="ingenierie-tag ingenierie-tag-more">+{domaine.services.length - 3}</span>
                                    )}
                                  </div>
                                )}

                                <div className="ingenierie-card-actions">
                                    <Link 
                                        to={`/prestation/${domaine.slug}`}
                                        className="ingenierie-btn"
                                    >
                                        {domaine.services?.length || domaine.technologies?.length || domaine.deliverables?.length
                                          ? "Voir les prestations →"
                                          : "Prestations →"}
                                    </Link>
                                </div>
                            </div>
                        </article> 
                    )) : (
                        <p className="ingenierie-card-desc">
                            {domaines.length ? "Aucun domaine ne correspond à votre sélection." : "Aucun domaine disponible pour le moment."}
                        </p>
                    )}
                </div>
            </section>
            <section className="ingenierie-cta">
                <h2 className="ingenierie-cta-title">Projet à réaliser ?</h2>
                <p className="ingenierie-cta-text">
                    Nos experts analysent vos besoins et vous proposent la meilleure combinaison de prestation
                </p>
                <Link to="/contact" className="ingenierie-hero-cta">
                    Nous contacter
                </Link>
            </section>
        </div>
    );
} 
