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
            // Petit délai pour éviter le flash si l'API est trop rapide (optionnel mais aide au ressenti)
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
                    // On laisse un petit temps pour que React process le state avant de masquer le loader
                    setTimeout(() => {
                        if (mounted) setIsLoading(false);
                    }, 100);
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

    return (
        <div className="ingenierie-page ingenierie-modern"> 
            <section className="ingenierie-hero-modern">
                <h1 className="ingenierie-hero-title">Nos Domaines d&apos;Expertise</h1>
                <p className="ingenierie-hero-subtitle">
                    Ingenierie informatique et industrielle - Solutions completes pour entreprises et projets d&apos;infrastructure
                </p>
</section>

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                {isLoading ? (
                    <div className="ingenierie-grid">
                        {[1, 2, 3, 4, 5, 6].map((n) => (
                            <div key={n} className="ingenierie-card skeleton-card">
                                <div className="ingenierie-card-image skeleton-image"></div>
                                <div className="ingenierie-card-content">
                                    <div className="skeleton-title"></div>
                                    <div className="skeleton-desc"></div>
                                    <div className="skeleton-desc"></div>
                                    <div className="skeleton-btn"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="ingenierie-grid"> 
                        {domaines.length ? domaines.map((domaine) => (
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
                                        className="ingenierie-card-image"
                                        style={{
                                            opacity: imageLoaded[domaine.slug] ? 1 : 0,
                                            transition: "opacity 0.4s ease-in-out"
                                        }}
                                        onLoad={() => handleImageLoad(domaine.slug)}
                                        onError={() => {
                                            setImageHidden((prev) => ({ ...prev, [domaine.slug]: true }));
                                        }}
                                    />
                                ) : (
                                    <div className="ingenierie-card-image ingenierie-card-image--empty" aria-hidden="true"></div>
                                )}
                                <div className="ingenierie-card-overlay"></div>
                                <div className="ingenierie-card-content">
                                    <h3 className="ingenierie-card-title">{domaine.title}</h3>
                                    <p className="ingenierie-card-desc">{domaine.description}</p>
                                    <div className="ingenierie-card-actions">
                                        <Link 
                                            to={`/prestation/${domaine.slug}`}
                                            className="ingenierie-btn"
                                        >
                                            Prestations →
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
                )}
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
