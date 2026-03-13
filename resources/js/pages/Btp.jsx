import React from "react";
import { Link } from "react-router-dom";
import "../styles/btp.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Btp() {
  usePageMeta(
    "BTP et Industrie | Groupe ISD AFRIK",
    "Solutions technologiques pour BTP et industrie: pilotage, securisation et digitalisation des operations terrain."
  );

  return (
    <div className="service-page btp-page premium-page">
      {/* Hero Section */}
      <section className="service-hero">
        <div className="service-hero-content">
          <h1>Bâtiment & Travaux Publics</h1>
          <p>Des solutions robustes pour digitaliser, securiser et piloter vos projets BTP et industriels</p>
        </div>
      </section>

      <div className="service-container">
        {/* Introduction */}
        <section className="service-intro">
          <h2>Notre Expertise</h2>
          <p>
            Nous accompagnons les entreprises et institutions dans la réalisation de projets
            de construction et d'infrastructure, avec une approche orientee qualite,
            securite et respect des delais.
          </p>
        </section>

        {/* Solutions */}
        <section className="service-solutions">
          <h2>Nos Solutions</h2>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-building"></i></div>
              <h3>Gestion de Projets</h3>
              <p>Suivi et coordination des chantiers pour assurer la réussite.</p>
              <ul>
                <li>Planification</li>
                <li>Supervision</li>
                <li>Contrôle qualité</li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-hard-hat"></i></div>
              <h3>Construction</h3>
              <p>Réalisation de bâtiments et infrastructures durables.</p>
              <ul>
                <li>Bâtiments résidentiels</li>
                <li>Bâtiments industriels</li>
                <li>Travaux publics</li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-tools"></i></div>
              <h3>Maintenance</h3>
              <p>Rénovation et optimisation énergétique des ouvrages existants.</p>
              <ul>
                <li>Rénovation</li>
                <li>Réparations</li>
                <li>Optimisation énergétique</li>
              </ul>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="service-cta">
          <h2>Construisons ensemble vos projets</h2>
          <p>Contactez-nous pour bénéficier de notre expertise en BTP.</p>
          <Link to="/contact" className="cta-button">
            <i className="fas fa-envelope"></i> Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}
