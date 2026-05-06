import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { getCategories } from "../services/ProduitService";
import { INGENIERIE_DEFAULT_DOMAINES, resolveIngenierieDomaines } from "../data/ingenierieDomains";
import "../styles/ingenierie-new.css";

export default function Ingenierie() {
    const [domaines, setDomaines] = useState(INGENIERIE_DEFAULT_DOMAINES);

    usePageMeta(
        "Ingénierie informatique et industrielle | Groupe ISD AFRIK",
        "Domaines d'expertise pour l'architecture SI, la securite, les reseaux et les infrastructures d'entreprise."
    );

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

    return (
        <div className="ingenierie-page ingenierie-modern"> 
            <section className="ingenierie-hero-modern">
                    <h1 className="ingenierie-hero-title">Nos Domaines d&apos;Expertise</h1>
                    <p className="ingenierie-hero-subtitle">
                        Ingenierie informatique et industrielle - Solutions completes pour entreprises et projets d&apos;infrastructure
                    </p>
                    <Link to="/contact" className="ingenierie-hero-cta ingenierie-hero-cta--devis">
                        Demander un devis →
                    </Link>
                </section> 

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="ingenierie-grid"> 
                    {domaines.map((domaine) => (
                            <article 
                            key={domaine.slug} 
                            className="ingenierie-card"
                        >
                            <img 
                                src={domaine.image} 
                                alt={domaine.title}
                                loading="lazy"
                                className="ingenierie-card-image"
                                onError={(e) => {
                                    e.target.src = '/images/prestations/default.jpg';
                                }}
                            />
                            <div className="ingenierie-card-overlay"></div>
                            <div className="ingenierie-card-content">
                                <h3 className="ingenierie-card-title">{domaine.title}</h3>
                                <p className="ingenierie-card-desc">{domaine.description}</p>
                                <Link 
                                    to={`/prestation/${domaine.slug}`}
                                    className="ingenierie-btn"
                                >
                                    Prestation →
                                </Link>
                            </div>
                        </article> 
                    ))}
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
