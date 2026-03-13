import React from "react";
import { Link } from "react-router-dom";
import "../styles/drones.css";
import usePageMeta from "../hooks/usePageMeta";

export default function Drones() {
  usePageMeta(
    "Drones: fourniture et formation | Groupe ISD AFRIK",
    "Fourniture de drones professionnels, formation au pilotage et accompagnement technique en Afrique de l'Ouest."
  );

  return (
    <div className="service-page drones-page premium-page">
      <section className="service-hero">
        <div className="service-hero-content">
          <h1>Fourniture et formation sur drones</h1>
          <p>Equipements professionnels et formation complete en pilotage de drones</p>
        </div>
      </section>

      <div className="service-container">
        <section className="service-intro">
          <h2>Notre Expertise</h2>
          <p>
            Le Groupe ISD AFRIK accompagne les particuliers, entreprises et institutions dans
            le choix des drones, la formation des pilotes et la mise en exploitation.
          </p>
        </section>

        <section className="service-solutions">
          <h2>Nos Formations</h2>
          <div className="solutions-grid">
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-helicopter"></i></div>
              <h3>Initiation</h3>
              <p>Découverte et pilotage de base.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-graduation-cap"></i></div>
              <h3>Formation Avancée</h3>
              <p>Techniques de vol et certification.</p>
            </div>
            <div className="solution-card">
              <div className="solution-icon"><i className="fas fa-tools"></i></div>
              <h3>Maintenance</h3>
              <p>Entretien et optimisation des drones.</p>
            </div>
          </div>
        </section>

        <section className="service-cta">
          <h2>Envie de voler ?</h2>
          <p>Inscrivez-vous à nos formations drones.</p>
          <Link to="/contact" className="cta-button">
            <i className="fas fa-envelope"></i> Nous contacter
          </Link>
        </section>
      </div>
    </div>
  );
}
