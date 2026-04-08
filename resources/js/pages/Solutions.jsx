import React from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import { ENGINEERING_DELIVERY_STEPS, ENGINEERING_FAMILIES } from "../data/engineeringCatalog";
import "../styles/marketing-premium.css";
import "../../css/solutions.css";


export default function Solutions() {
    usePageMeta(
        "Solutions / Produits | Groupe ISD AFRIK",
        "Solutions de gestion d'entreprise, securite electronique et outils numeriques pour la transformation digitale en Afrique."
    );
    const navigate = useNavigate();

    const solutions = [
        {
            title: "Pole Ingenierie transactionnelle",
            description: "Prestations autour des familles Drone et TPE pour la mise en place de solutions terrain avec typologies et modeles adaptes.",
            image: "/images/solutions/im1.webp",
            points: ["Cadrage metier", "Selection type/modele", "Mise en service et formation"],
            link: "/produits?categories=drone,tpe"
        },
        {
            title: "Pole Infrastructures techniques",
            description: "Conception, fourniture et deploiement des equipements d'archivage, materiel informatique, reseau, incendie, energie et telecommunications.",
            image: "/images/solutions/im2.webp",
            points: ["Ingenierie de conception", "Integration sur site", "Maintenance preventive"],
            link: "/produits?categories=archivage-numerique,materiel-informatique,reseau-informatique,incendie,energie,telecommunications"
        },
        {
            title: "Pole Cybersecurite et donnees",
            description: "Protection des infrastructures et des bases de donnees avec des offres declinables par type et modele.",
            image: "/images/solutions/im3.webp",
            points: ["Audit securite", "Durcissement des plateformes", "Sauvegarde et continuite"],
            link: "/produits?categories=securite-informatique-base-de-donnees"
        }
    ];

    const famillesResume = ENGINEERING_FAMILIES.map((item) => ({
        label: item.label,
        slug: item.slug,
        details: item.types.slice(0, 3),
    }));

    const stats = [
        { label: "Poles d expertise", value: solutions.length },
        { label: "Etapes delivery", value: ENGINEERING_DELIVERY_STEPS.length },
        { label: "Familles couvertes", value: ENGINEERING_FAMILIES.length },
    ];

    return (
        <div className="solutions-page premium-page">
            <div className="solutions-shell">
                <section className="solutions-hero premium-hero">
                    <span className="premium-chip">Solutions metier</span>
                    <h1 className="premium-title">Prestations associees au catalogue produits</h1>
                    <p className="premium-subtitle">
                        Les pages Solutions et Ingenierie cadrent les familles de produits,
                        les types et les modeles a deployer selon vos contraintes metier.
                    </p>

                    <div className="solutions-hero-actions">
                        <button
                            type="button"
                            className="solutions-btn solutions-btn-primary"
                            onClick={() => navigate("/contact")}
                        >
                            Parler a un expert
                        </button>
                        <button
                            type="button"
                            className="solutions-btn solutions-btn-secondary"
                            onClick={() => navigate("/produits")}
                        >
                            Explorer le catalogue
                        </button>
                    </div>

                    <div className="solutions-stats-grid">
                        {stats.map((item) => (
                            <article key={item.label} className="solutions-stat-card">
                                <strong>{item.value}</strong>
                                <span>{item.label}</span>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="solutions-delivery premium-card">
                    <div className="solutions-section-head">
                        <p className="solutions-kicker">Methodologie</p>
                        <h2>Cycle de delivery de nos prestations</h2>
                    </div>

                    <div className="solutions-delivery-grid">
                        {ENGINEERING_DELIVERY_STEPS.map((step, index) => (
                            <article key={step} className="solutions-step-item">
                                <span className="solutions-step-index">0{index + 1}</span>
                                <p>{step}</p>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="solutions-poles">
                    <div className="solutions-section-head">
                        <p className="solutions-kicker">Nos poles</p>
                        <h2>3 axes d intervention pour vos projets</h2>
                    </div>

                    <div className="solutions-poles-grid">
                        {solutions.map((item) => (
                            <article key={item.title} className="solutions-pole-card premium-card">
                                <div className="solutions-pole-media">
                                    <img src={item.image} alt={item.title} />
                                </div>
                                <div className="solutions-pole-body">
                                    <h3>{item.title}</h3>
                                    <p>{item.description}</p>

                                    <ul className="solutions-points-list">
                                        {item.points.map((point) => (
                                            <li key={point}>{point}</li>
                                        ))}
                                    </ul>

                                    <button
                                        type="button"
                                        className="solutions-inline-btn"
                                        onClick={() => navigate(item.link)}
                                    >
                                        Voir les produits relies
                                    </button>
                                </div>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="solutions-families premium-card">
                    <div className="solutions-section-head">
                        <p className="solutions-kicker">Couverture</p>
                        <h2>Familles couvertes par nos prestations</h2>
                    </div>

                    <div className="solutions-family-grid">
                        {famillesResume.map((famille) => (
                            <article key={famille.slug} className="solutions-family-card">
                                <div className="solutions-family-top">
                                    <h3>{famille.label}</h3>
                                    <button
                                        type="button"
                                        className="solutions-inline-link"
                                        onClick={() => navigate(`/produits?categories=${famille.slug}`)}
                                    >
                                        Voir
                                    </button>
                                </div>

                                <ul className="solutions-family-list">
                                    {famille.details.map((item) => (
                                        <li key={`${famille.slug}-${item}`}>{item}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </section>

                <section className="solutions-cta premium-card">
                    <div className="solutions-cta-copy">
                        <p className="solutions-kicker">Accompagnement</p>
                        <h2>Construisons la bonne architecture pour votre organisation</h2>
                        <p>
                            Nous vous aidons a selectionner les bonnes familles, les bons types
                            et les bons modeles pour un deploiement maitrise.
                        </p>
                    </div>

                    <div className="solutions-cta-actions">
                        <button
                            type="button"
                            className="solutions-btn solutions-btn-primary"
                            onClick={() => navigate("/contact")}
                        >
                            Demander une demonstration
                        </button>
                        <button
                            type="button"
                            className="solutions-btn solutions-btn-secondary"
                            onClick={() => navigate("/inscription")}
                        >
                            Demander un accompagnement
                        </button>
                    </div>
                </section>
            </div>
        </div>
    );
}