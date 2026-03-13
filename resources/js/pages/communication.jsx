import React from "react";
import { Link } from "react-router-dom";
import "../styles/communication.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Communication() {
  usePageMeta(
    "Communication et publicite | Groupe ISD AFRIK",
    "Strategies de communication, marketing digital et campagnes performantes pour renforcer votre visibilite."
  );

  return (
    <div className="service-page communication-page premium-page">
      <section className="service-hero">
        <div className="service-hero-content">
          <h1>Communication & Publicité</h1>
          <p>Des strategies de communication performantes pour renforcer votre presence et votre impact</p>
        </div>
      </section>

      <div className="service-container">
        <section className="service-intro">
          <h2>Notre Expertise</h2>
          <p>
            Nous concevons des dispositifs de communication adaptes a votre marche,
            vos objectifs commerciaux et votre image de marque.
          </p>
        </section>

        <section className="service-solutions">
          <h2>Nos Solutions</h2>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-bullhorn"></i></div>
              <h3>Marketing Digital</h3>
              <p>Campagnes ciblées sur les réseaux sociaux et moteurs de recherche.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-paint-brush"></i></div>
              <h3>Design Graphique</h3>
              <p>Création de visuels impactants pour vos supports de communication.</p>
            </div>
          </div>
        </section>

        <section className="service-cta">
          <h2>Prêt à booster votre image ?</h2>
          <p>Contactez-nous pour une stratégie sur mesure.</p>
          <Link to="/contact" className="cta-button">
            <i className="fas fa-envelope"></i> Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}
