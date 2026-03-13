import React from "react";
import { useNavigate } from "react-router-dom";
import "../../css/expertise.css";

export default function Expertise() {
  const navigate = useNavigate();

  const domaines = [
    {
      title: "Architecture & développement",
      description: "Conception d'applications web et métiers robustes, évolutives et sécurisées.",
    },
    {
      title: "Intégration de solutions",
      description: "Mise en place d'ERP, CRM et outils de pilotage adaptés à vos processus internes.",
    },
    {
      title: "Infrastructure & performance",
      description: "Optimisation des environnements, supervision et amélioration continue des performances.",
    },
  ];

  const methodologie = [
    "Analyse des besoins et cadrage fonctionnel",
    "Conception technique orientée résultat",
    "Déploiement progressif et transfert de compétences",
    "Suivi qualité et accompagnement post-projet",
  ];

  return (
    <div className="expertise-page">
      <section className="expertise-hero">
        <h1>Expertise et savoir-faire</h1>
        <p>
          ISD AFRIK mobilise une équipe pluridisciplinaire pour transformer vos enjeux opérationnels
          en solutions concrètes, mesurables et durables.
        </p>
      </section>

      <div className="expertise-content">
        <section className="expertise-domains">
          <h2 className="expertise-domains-title">Nos domaines d'expertise</h2>
          <div className="domains-grid">
            {domaines.map((item, index) => (
              <article key={index} className="domain-card">
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="expertise-methodology">
          <h2>Notre méthodologie</h2>
          <ul className="methodology-list">
            {methodologie.map((etape, index) => (
              <li key={index} className="methodology-item">{etape}</li>
            ))}
          </ul>
        </section>

        <section className="expertise-cta">
          <h2>Besoin d'un diagnostic de votre projet?</h2>
          <p>Nos experts sont prêts à évaluer votre situation et proposer une stratégie adaptée.</p>
          <button
            type="button"
            onClick={() => navigate("/contact")}
            className="expertise-cta-btn"
          >
            Parler à un expert
          </button>
        </section>
      </div>
    </div>
  );
}