import React from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../../css/services.css";

export default function Services() {
  usePageMeta(
    "Services technologiques | Groupe ISD AFRIK",
    "Nos solutions technologiques pour entreprises: developpement, communication, TPE, drones, BTP, ingenierie et digitalisation."
  );
  const navigate = useNavigate();

  const services = [
    {
      title: "Développement d'applications",
      description: "Sites web, applications mobiles et solutions cloud pour digitaliser vos operations.",
      link: "/services/developpement",
    },
    {
      title: "Communication digitale",
      description: "Communication et publicite pour renforcer votre visibilite et vos performances commerciales.",
      link: "/services/communication",
    },
    {
      title: "Solutions TPE/PME",
      description: "Fourniture de TPE et solutions de gestion pour securiser les transactions.",
      link: "/services/tpe",
    },
    {
      title: "Services drones",
      description: "Fourniture de drones et formation en pilotage professionnel.",
      link: "/services/drones",
    },
    {
      title: "Services BTP",
      description: "Solutions techniques pour le batiment et l'industrie avec accompagnement terrain.",
      link: "/services/btp",
    },
    {
      title: "Ingenierie informatique et industrielle",
      description: "Architecture SI, integration systemes et automatisation des processus metiers.",
      link: "/ingenierie",
    },
    {
      title: "Solutions de gestion d'entreprise",
      description: "ERP, CRM, BI et workflows adaptes aux entreprises et institutions.",
      link: "/solutions",
    },
  ];

  return (
    <div className="services-page">
      <section className="services-hero">
        <h1>Nos solutions technologiques pour les entreprises</h1>
        <p>
          Le Groupe ISD AFRIK propose une gamme complete de services technologiques pour les entreprises,
          institutions publiques et organisations en Afrique de l'Ouest. De l'analyse des besoins à la 
          maintenance, nous coordonnons les expertises pour livrer des solutions fiables et performantes.
        </p>
      </section>

      <div className="services-grid">
        {services.map((service, index) => (
          <article key={index} className="service-card">
            <div className="service-card-icon">
              {index === 0 && "💻"}
              {index === 1 && "📱"}
              {index === 2 && "💳"}
              {index === 3 && "🚁"}
              {index === 4 && "🏗️"}
              {index === 5 && "⚙️"}
              {index === 6 && "📊"}
            </div>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
            <a href={service.link} className="service-card-link">En savoir plus</a>
          </article>
        ))}
      </div>

      <section className="services-cta">
        <h2>Un interlocuteur unique pour tous vos besoins technologiques</h2>
        <p>
          De l'analyse des besoins a la maintenance, nous coordonnons les expertises techniques pour livrer
          des solutions fiables, performantes et adaptees a vos contraintes metiers.
        </p>
        <button
          type="button"
          onClick={() => navigate("/contact")}
          className="services-cta-btn"
        >
          Demander un accompagnement
        </button>
      </section>
    </div>
  );
}