import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/actualites.css";

export default function Actualites() {
    usePageMeta(
        "Actualites | Groupe ISD AFRIK",
        "Les actualites du Groupe ISD AFRIK: innovation, transformation digitale, securite electronique et formation."
    );

    const news = [
        {
            id: 1,
            icon: "🚀",
            title: "Transformation digitale en Afrique de l'Ouest",
            text: "ISD AFRIK accompagne les entreprises dans la modernisation de leurs operations et l'optimisation de leur performance.",
        },
        {
            id: 2,
            icon: "🔒",
            title: "Renforcement de l'offre securite electronique",
            text: "Nouvelles solutions de videosurveillance, controle d'acces et outils de supervision pour les organisations.",
        },
        {
            id: 3,
            icon: "📚",
            title: "Programmes de formation professionnelle",
            text: "Lancement de nouveaux parcours en gestion, securite electronique et outils numeriques pour les professionnels.",
        },
    ];

    return (
        <div className="actualites-page">
            <section className="actualites-hero">
                <h1>Actualités</h1>
                <p>
                    Suivez les nouvelles du Groupe ISD AFRIK sur nos solutions technologiques,
                    nos initiatives de formation et nos actions de transformation digitale.
                </p>
            </section>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="actualites-grid">
                    {news.map((item) => (
                        <article key={item.id} className="actualite-card">
                            <div className="actualite-badge">{item.icon}</div>
                            <h2>{item.title}</h2>
                            <p>{item.text}</p>
                            <a href="#" className="actualite-link">En savoir plus</a>
                        </article>
                    ))}
                </div>

                <div className="actualites-cta">
                    <Link
                        to="/contact"
                        className="cta-button"
                    >
                        <i className="fas fa-envelope"></i>
                        Nous contacter
                    </Link>
                </div>
            </div>
        </div>
    );
}