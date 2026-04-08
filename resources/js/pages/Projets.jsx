import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";

export default function Projets() {
    const navigate = useNavigate();

    const etapes = [
        {
            title: "Cadrage",
            description: "Analyse du besoin, définition des objectifs et priorisation des fonctionnalités.",
        },
        {
            title: "Réalisation",
            description: "Développement, intégration et validation continue avec vos équipes métier.",
        },
        {
            title: "Déploiement",
            description: "Mise en production, formation des utilisateurs et support opérationnel.",
        },
    ];

    const domaines = [
        "Systèmes de gestion d'entreprise",
        "Plateformes digitales et applications métier",
        "Projets d'ingénierie informatique et industrielle",
        "Programmes de formation professionnelle",
    ];

    return (
        <div className="home projets-page">
            <section className="projets-hero">
                <div className="projets-hero-inner">
                    <div className="section-header">
                        <h2>Nos Projets</h2>
                        <p>
                            Chaque projet est construit avec une approche orientee impact : performance operationnelle,
                            appropriation utilisateur et perennite des resultats.
                        </p>
                    </div>
                    <div className="projets-hero-actions">
                        <button className="btn-primary" onClick={() => navigate("/contact")}>
                            Demarrer un projet
                        </button>
                        <button className="btn-secondary" onClick={() => navigate("/contact")}>
                            Demander un devis
                        </button>
                    </div>
                </div>
            </section>

            <section className="projets-steps">
                <div className="projets-steps-grid">
                    {etapes.map((etape, index) => (
                        <article key={index} className="projets-step-card">
                            <div className="projets-step-index">0{index + 1}</div>
                            <h3>{etape.title}</h3>
                            <p>{etape.description}</p>
                        </article>
                    ))}
                </div>
            </section>

            <section className="projets-domains">
                <div className="projets-domains-card">
                    <h3>Domaines d'intervention</h3>
                    <ul>
                        {domaines.map((domaine, index) => (
                            <li key={index}>
                                <span className="projets-domain-dot"></span>
                                <span>{domaine}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <div className="projets-domains-highlight">
                    <h4>Ce que vous obtenez</h4>
                    <p>
                        Une feuille de route claire, des livrables mesurables et un accompagnement continu
                        pour garantir l'adoption terrain.
                    </p>
                    <button className="btn-primary" onClick={() => navigate("/contact")}>
                        Lancer votre projet
                    </button>
                </div>
            </section>
        </div>
    );
}