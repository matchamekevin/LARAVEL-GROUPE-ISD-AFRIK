import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { ENGINEERING_DELIVERY_STEPS, ENGINEERING_FAMILIES } from "../data/engineeringCatalog";
import "../styles/marketing-premium.css";
import "../../css/ingenierie.css";

export default function Ingenierie() {
    usePageMeta(
        "Ingeierie informatique et industrielle | Groupe ISD AFRIK",
        "Architecture SI, integration systemes et automatisation pour renforcer la performance et la securite des entreprises."
    );

    const piliers = [
        {
            title: "Cadrage de la prestation",
            text: "Analyse metier et technique pour identifier les familles de produits, les types et les modeles adaptes.",
            image: "/images/solutions/im3.webp"
        },
        {
            title: "Integration et deploiement",
            text: "Mise en oeuvre sur site des equipements d'ingenierie : drone, TPE, reseau, incendie, energie, telecoms et plus.",
            image: "/images/solutions/im2.webp"
        },
        {
            title: "Support et evolution",
            text: "Suivi operationnel, maintenance et renouvellement par gamme, type et modele pour maintenir la performance.",
            image: "/images/solutions/im1.webp"
        }
    ];

    const livrables = [
        "Matrice familles / types / modeles",
        "Plan de deploiement et gestion des risques",
        "Documentation d'exploitation par equipement",
        "Rapport de tests et mise en conformite",
        "Formation et transfert de competence"
    ];

    const chiffres = [
        { value: "15+", label: "Annees d'experience" },
        { value: "500+", label: "Projets reussis" },
        { value: "1000+", label: "Clients satisfaits" },
        { value: "99.8%", label: "Taux de succes" }
    ];

    const engagements = [
        "Audit de l'existant et recommandations sur mesure",
        "Pilotage de projet avec approche terrain et suivi des delais",
        "Integration multi-equipements et interoperabilite",
        "Formation des equipes et accompagnement post-livraison"
    ];

    return (
        <div className="ingenierie-page premium-page">
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 sm:pt-14 mb-12 sm:mb-16 ingenierie-hero-shell">
                <div className="ingenierie-hero premium-hero">
                    <div className="ingenierie-hero-grid">
                        <div className="ingenierie-hero-copy">
                            <span className="premium-chip">Prestation Ingenierie</span>
                            <h1 className="premium-title">Ingenierie informatique et industrielle</h1>
                            <p className="premium-subtitle">
                                Nous concevons, integrons et faisons evoluer des environnements techniques
                                fiables pour les entreprises, institutions et projets industriels en Afrique
                                de l'Ouest.
                            </p>

                            <div className="ingenierie-hero-actions">
                                <Link to="/contact" className="ingenierie-primary-btn">
                                    Demarrer un projet
                                </Link>
                                <Link to="/produits" className="ingenierie-secondary-btn">
                                    Voir le catalogue
                                </Link>
                            </div>
                        </div>

                        <div className="ingenierie-hero-panel">
                            <h2>Domaines couverts</h2>
                            <p>
                                Drone, TPE, archivage numerique, materiel informatique, reseau,
                                incendie, energie, telecommunications et securite informatique.
                            </p>

                            <div className="ingenierie-hero-steps">
                                {ENGINEERING_DELIVERY_STEPS.map((step, index) => (
                                    <div
                                        key={step}
                                        className="ingenierie-hero-step"
                                        style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                                    >
                                        <span className="ingenierie-step-index">0{index + 1}</span>
                                        <span>{step}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex flex-col gap-12 sm:gap-16 ingenierie-sections-stack">
                <section className="ingenierie-overview-grid">
                    <article className="premium-card ingenierie-highlight-card">
                        <span className="ingenierie-section-kicker">Positionnement</span>
                        <h2>Une expertise de bout en bout</h2>
                        <p>
                            De l'analyse initiale au maintien en conditions operationnelles,
                            nous securisons chaque etape de votre transformation technique.
                        </p>
                    </article>

                    <article className="premium-card ingenierie-highlight-card">
                        <span className="ingenierie-section-kicker">Approche</span>
                        <h2>Des solutions adaptees au terrain</h2>
                        <p>
                            Chaque prestation prend en compte vos contraintes metiers, votre niveau
                            de maturite et la realite de vos infrastructures existantes.
                        </p>
                    </article>

                    <article className="premium-card ingenierie-highlight-card">
                        <span className="ingenierie-section-kicker">Impact</span>
                        <h2>Performance, securite et continuite</h2>
                        <p>
                            Nos architectures visent la fiabilite des operations, la maitrise des risques
                            et l'evolutivite de vos equipements.
                        </p>
                    </article>
                </section>

                <section className="premium-card ingenierie-section-shell">
                    <div className="ingenierie-section-header">
                        <span className="ingenierie-section-kicker">Expertise</span>
                        <h2>Nos piliers d'intervention</h2>
                        <p>
                            Une demarche structuree pour transformer un besoin technique en solution
                            operationnelle durable.
                        </p>
                    </div>

                    <div className="ingenierie-pillars-grid">
                        {piliers.map((item, index) => (
                            <article
                                key={item.title}
                                className="pillar-card"
                                style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                            >
                                <img src={item.image} alt={item.title} className="pillar-image" />
                                <div className="pillar-content">
                                    <h3 className="pillar-title">{item.title}</h3>
                                    <p className="pillar-description">{item.text}</p>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ingenierie-two-columns">
                    <article className="premium-card ingenierie-section-shell">
                        <div className="ingenierie-section-header">
                            <span className="ingenierie-section-kicker">Livrables</span>
                            <h2>Ce que vous obtenez</h2>
                        </div>

                        <ul className="ingenierie-deliverables-grid">
                            {livrables.map((item, index) => (
                                <li
                                    key={item}
                                    className="deliverable-item"
                                    style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                                >
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </article>

                    <article className="premium-card ingenierie-section-shell">
                        <div className="ingenierie-section-header">
                            <span className="ingenierie-section-kicker">Engagements</span>
                            <h2>Notre methode projet</h2>
                        </div>

                        <ul className="ingenierie-engagement-list">
                            {engagements.map((item) => (
                                <li key={item} className="ingenierie-engagement-item">
                                    <span className="ingenierie-engagement-bullet" />
                                    <span>{item}</span>
                                </li>
                            ))}
                        </ul>
                    </article>
                </section>

                <section className="premium-card ingenierie-section-shell">
                    <div className="ingenierie-section-header">
                        <span className="ingenierie-section-kicker">Catalogue</span>
                        <h2>Familles, types et modeles couverts</h2>
                        <p>
                            Explorez les differentes categories d'equipements et accedez directement
                            aux produits associes.
                        </p>
                    </div>

                    <div className="ingenierie-family-grid">
                        {ENGINEERING_FAMILIES.map((item) => (
                            <article key={item.slug} className="ingenierie-family-card">
                                <div className="ingenierie-family-top">
                                    <h3>{item.label}</h3>
                                    <Link
                                        to={`/produits?categories=${item.slug}`}
                                        className="ingenierie-family-link"
                                    >
                                        Produits
                                    </Link>
                                </div>

                                <p className="ingenierie-family-description">{item.description}</p>

                                <ul className="ingenierie-family-types">
                                    {item.types.map((type) => (
                                        <li key={`${item.slug}-${type}`} className="ingenierie-family-type">
                                            {type}
                                        </li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="ingenierie-metrics">
                    {chiffres.map((item, index) => (
                        <article
                            key={item.label}
                            className="metric-card"
                            style={{ animationDelay: `${0.1 * (index + 1)}s` }}
                        >
                            <div className="metric-value">{item.value}</div>
                            <p className="metric-name">{item.label}</p>
                        </article>
                    ))}
                </section>

                <section className="ingenierie-cta">
                    <div className="ingenierie-cta-copy">
                        <span className="ingenierie-section-kicker ingenierie-section-kicker--light">
                            Accompagnement
                        </span>
                        <h2>Pret a lancer votre projet d'ingenierie ?</h2>
                        <p>
                            Contactez nos experts pour definir la bonne combinaison famille,
                            type et modele selon votre organisation, vos contraintes
                            techniques et vos objectifs de croissance.
                        </p>
                    </div>

                    <div className="ingenierie-cta-buttons">
                        <Link to="/contact" className="ingenierie-primary-btn">
                            Lancer un projet
                        </Link>
                        <Link to="/produits" className="ingenierie-secondary-btn ingenierie-secondary-btn--light">
                            Voir le catalogue Ingenierie
                        </Link>
                    </div>
                </section>
            </div>
        </div>
    );
}
