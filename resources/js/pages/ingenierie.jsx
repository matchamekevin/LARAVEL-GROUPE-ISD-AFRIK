import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../../css/ingenierie.css";

export default function Ingenierie() {
    usePageMeta(
        "Ingenierie informatique et industrielle | Groupe ISD AFRIK",
        "Architecture SI, integration systemes et automatisation pour renforcer la performance et la securite des entreprises."
    );

    const piliers = [
        {
            title: "Architecture et urbanisation SI",
            text: "Conception de systemes evolutifs, securises et alignes avec les objectifs des entreprises et institutions.",
            image: "/images/solutions/im3.webp"
        },
        {
            title: "Developpement applicatif",
            text: "Applications web, mobile et API metier sur mesure avec des standards eleves de qualite logicielle.",
            image: "/images/solutions/im2.webp"
        },
        {
            title: "Integration de systemes",
            text: "Connexion ERP, CRM, outils metier et services tiers pour fluidifier les operations et les flux de donnees.",
            image: "/images/solutions/im1.webp"
        }
    ];

    const livrables = [
        "Document d'architecture cible",
        "Plan de migration et gestion des risques",
        "Schema de securisation des infrastructures",
        "Tableaux de bord de supervision",
        "Documentation technique et transfert de competence"
    ];

    const famillesProduits = [
        { label: "Drone", slug: "drone" },
        { label: "TPE", slug: "tpe" },
        { label: "Archivage numérique", slug: "archivage-numerique" },
        { label: "Matériel informatique", slug: "materiel-informatique" },
        { label: "Réseau informatique", slug: "reseau-informatique" },
        { label: "Incendie", slug: "incendie" },
        { label: "Énergie", slug: "energie" },
        { label: "Télécommunications", slug: "telecommunications" },
        { label: "Sécurité informatique et base de données", slug: "securite-informatique-base-de-donnees" },
    ];

    return (
        <div className="ingenierie-page">
            <section className="ingenierie-hero">
                <div className="ingenierie-hero-content">
                    <h1>Ingénierie informatique et industrielle</h1>
                    <p>
                        Le Groupe ISD AFRIK accompagne les organisations dans la conception, l'industrialisation
                        et l'optimisation des systèmes d'information avec une approche orientée performance,
                        sécurité et durabilité.
                    </p>
                </div>
            </section>

            <div className="ingenierie-content">
                <section className="ingenierie-pillars">
                    <h2 className="pillars-title">Nos piliers d'expertise</h2>
                    <div className="pillars-grid">
                        {piliers.map((item) => (
                            <article key={item.title} className="pillar-card">
                                <img src={item.image} alt={item.title} className="pillar-image" />
                                <div className="pillar-content">
                                    <h3 className="pillar-title">{item.title}</h3>
                                    <p className="pillar-description">{item.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ingenierie-deliverables">
                    <h2 className="deliverables-title">Ce que vous obtenez</h2>
                    <ul className="deliverables-list">
                        {livrables.map((item) => (
                            <li key={item} className="deliverable-item">
                                {item}
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="ingenierie-deliverables">
                    <h2 className="deliverables-title">Familles produits prises en charge</h2>
                    <ul className="deliverables-list">
                        {famillesProduits.map((item) => (
                            <li key={item.slug} className="deliverable-item">
                                <Link to={`/produits?categories=${item.slug}`}>{item.label}</Link>
                            </li>
                        ))}
                    </ul>
                </section>

                <section className="ingenierie-metrics">
                    <div className="metric-card">
                        <div className="metric-value">15+</div>
                        <p className="metric-name">Années d'expérience</p>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">500+</div>
                        <p className="metric-name">Projets réussis</p>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">1000+</div>
                        <p className="metric-name">Clients satisfaits</p>
                    </div>
                    <div className="metric-card">
                        <div className="metric-value">99.8%</div>
                        <p className="metric-name">TAux de succès</p>
                    </div>
                </section>

                <section className="ingenierie-cta">
                    <h2>Prêt à lancer votre projet?</h2>
                    <p>
                        Contactez nos experts pour discuter de vos besoins et des solutions adaptées à votre organisation.
                    </p>
                    <div className="ingenierie-cta-buttons">
                        <Link
                            to="/contact"
                            className="ingenierie-cta-btn cta-btn-primary"
                        >
                            Lancer un projet
                        </Link>
                        <Link
                            to="/details/sectors/ingenierie-informatique-industrielle"
                            className="ingenierie-cta-btn cta-btn-secondary"
                        >
                            Voir la fiche détaillée
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}