import React from "react";
import { Link } from "react-router-dom";
import "../styles/application.css";
import usePageMeta from "../hooks/usePageMeta";

export default function DeveloppementApplications() {
  usePageMeta(
    "Developpement d'applications | Groupe ISD AFRIK",
    "Conception de sites web, applications mobiles et solutions cloud sur mesure pour entreprises et institutions."
  );

  return (
    <div className="service-page premium-page">
      {/* Hero Section */}
      <section className="service-hero">
        <div className="service-hero-content">
          <h1>Développement d'Applications</h1>
          <p>Sites web, applications mobiles et solutions cloud pour accelerer votre transformation digitale</p>
        </div>
      </section>

      {/* Contenu principal */}
      <div className="service-container">
        
        {/* Introduction */}
        <section className="service-intro">
          <h2>Notre Expertise en Développement</h2>
          <p>
            Le Groupe ISD AFRIK conçoit des applications metier robustes et evolutives,
            adaptees aux besoins des entreprises et institutions en Afrique de l'Ouest.
          </p>
        </section>

        {/* Nos solutions */}
        <section className="service-solutions">
          <h2>Nos Solutions</h2>
          <div className="solutions-grid">
            
            <div className="solution-card">
              <div className="solution-icon">
                <i className="fas fa-desktop"></i>
              </div>
              <h3>Applications Web</h3>
              <p>Développement de plateformes web robustes et évolutives avec les dernières technologies (Laravel, React, Vue.js)</p>
              <ul>
                <li>Sites e-commerce</li>
                <li>Plateformes SaaS</li>
                <li>Portails d'entreprise</li>
                <li>Applications métier</li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="solution-icon">
                <i className="fas fa-mobile-alt"></i>
              </div>
              <h3>Applications Mobiles</h3>
              <p>Création d'applications natives et hybrides pour iOS et Android</p>
              <ul>
                <li>Applications natives (Swift, Kotlin)</li>
                <li>Applications hybrides (React Native, Flutter)</li>
                <li>Progressive Web Apps (PWA)</li>
                <li>Maintenance et évolution</li>
              </ul>
            </div>

            <div className="solution-card">
              <div className="solution-icon">
                <i className="fas fa-cogs"></i>
              </div>
              <h3>Logiciels Métier</h3>
              <p>Solutions sur mesure adaptées à votre secteur d'activité</p>
              <ul>
                <li>ERP personnalisés</li>
                <li>Systèmes de gestion</li>
                <li>Outils de reporting</li>
                <li>Automatisation de processus</li>
              </ul>
            </div>

          </div>
        </section>

        {/* Technologies */}
        <section className="service-technologies">
          <h2>Technologies Maîtrisées</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <i className="fab fa-laravel"></i>
              <span>Laravel</span>
            </div>
            <div className="tech-item">
              <i className="fab fa-react"></i>
              <span>React</span>
            </div>
            <div className="tech-item">
              <i className="fab fa-node-js"></i>
              <span>Node.js</span>
            </div>
            <div className="tech-item">
              <i className="fab fa-python"></i>
              <span>Python</span>
            </div>
            <div className="tech-item">
              <i className="fab fa-android"></i>
              <span>Android</span>
            </div>
            <div className="tech-item">
              <i className="fab fa-apple"></i>
              <span>iOS</span>
            </div>
          </div>
        </section>

        {/* Processus */}
        <section className="service-process">
          <h2>Notre Méthodologie</h2>
          <div className="process-steps">
            <div className="process-step">
              <div className="step-number">1</div>
              <h3>Analyse des besoins</h3>
              <p>Étude approfondie de vos besoins et de votre environnement</p>
            </div>
            <div className="process-step">
              <div className="step-number">2</div>
              <h3>Conception</h3>
              <p>Design UX/UI et architecture technique</p>
            </div>
            <div className="process-step">
              <div className="step-number">3</div>
              <h3>Développement</h3>
              <p>Développement agile avec livraisons itératives</p>
            </div>
            <div className="process-step">
              <div className="step-number">4</div>
              <h3>Tests & Déploiement</h3>
              <p>Tests rigoureux et mise en production</p>
            </div>
            <div className="process-step">
              <div className="step-number">5</div>
              <h3>Maintenance</h3>
              <p>Support et évolutions continues</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="service-cta">
          <h2>Prêt à démarrer votre projet ?</h2>
          <p>Contactez-nous pour discuter de vos besoins et obtenir un devis personnalisé</p>
          <Link to="/contact" className="cta-button">
            <i className="fas fa-envelope"></i> Nous contacter
          </Link>
        </section>

      </div>
    </div>
  );
}