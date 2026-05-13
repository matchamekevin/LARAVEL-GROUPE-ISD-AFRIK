import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/actualites-new.css";

export default function Actualites() {
    usePageMeta(
        "Actualités | Groupe ISD AFRIK",
        "Suivez les actualités du Groupe ISD AFRIK : innovation, transformation digitale, sécurité électronique et formation professionnelle en Afrique."
    );

    const news = [
        {
            id: 1,
            icon: "🚀",
            date: "Mai 2026",
            title: "Accélération de la transformation digitale en Afrique de l'Ouest",
            text: "Le Groupe ISD AFRIK renforce son accompagnement stratégique pour aider les institutions à moderniser leurs processus critiques et à adopter des solutions cloud souveraines.",
        },
        {
            id: 2,
            icon: "🔒",
            date: "Avril 2026",
            title: "Nouvelle offre de Cybersécurité & Vidéosurveillance intelligente",
            text: "Lancement de nos solutions de supervision centralisée combinant IA et capteurs haute définition pour une protection périmétrale optimale des sites industriels.",
        },
        {
            id: 3,
            icon: "🎓",
            date: "Mars 2026",
            title: "Lancement du pôle Formation Drone & Pilotage Professionnel",
            text: "Ouverture des inscriptions pour nos nouveaux parcours certifiants dédiés aux métiers du drone : cartographie, inspection technique et agriculture de précision.",
        },
        {
            id: 4,
            icon: "💳",
            date: "Février 2026",
            title: "Modernisation des solutions de paiement TPE pour les PME",
            text: "Déploiement d'une nouvelle génération de terminaux de paiement électronique (TPE) mobiles, facilitant l'inclusion financière et la digitalisation des commerces.",
        }
    ];

    return (
        <div className="actualites-modern">
            {/* Hero Section */}
            <section className="actualites-hero-modern">
                <h1>Actualités & Insights</h1>
                <p>
                    Restez informé des dernières innovations technologiques, de nos projets d'impact 
                    et des tendances de la transformation digitale en Afrique.
                </p>
            </section>

            {/* News Grid */}
            <div className="actualites-section">
                <div className="actualites-grid-modern">
                    {news.map((item) => (
                        <article key={item.id} className="news-card-modern">
                            <div className="news-image-wrap">
                                <span className="news-date-badge">{item.date}</span>
                                <div className="news-icon-overlay">{item.icon}</div>
                            </div>
                            <div className="news-content-modern">
                                <h2>{item.title}</h2>
                                <p>{item.text}</p>
                                <Link to="/contact" className="news-read-more">
                                    En savoir plus <i className="fas fa-arrow-right"></i>
                                </Link>
                            </div>
                        </article>
                    ))}
                </div>

                {/* Newsletter / CTA */}
                <div className="actualites-cta-modern">
                    <h3>Besoin d'un accompagnement spécifique ?</h3>
                    <p>Nos experts sont à votre disposition pour analyser vos besoins et vous proposer des solutions innovantes.</p>
                    <Link to="/contact" className="actualites-btn">
                        <i className="fas fa-envelope"></i> Discuter avec un expert
                    </Link>
                </div>
            </div>
        </div>
    );
}
