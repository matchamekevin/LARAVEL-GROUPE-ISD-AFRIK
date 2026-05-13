import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/service-pages-new.css";

export default function Btp() {
  usePageMeta(
    "BTP & Industrie | Groupe ISD AFRIK",
    "Solutions technologiques pour le BTP et l'industrie : pilotage de chantiers, digitalisation et infrastructures durables en Afrique."
  );

  return (
    <div className="service-page-modern">
      <section className="service-hero-modern">
        <h1>Bâtiment & Travaux Publics (BTP)</h1>
        <p>Bâtissons le futur avec des infrastructures intelligentes, durables et sécurisées.</p>
      </section>

      <div className="service-section">
        <div className="service-grid-2">
          <div className="service-text-content">
            <h2>L'innovation technologique au cœur du chantier</h2>
            <p>
              Le Groupe ISD AFRIK accompagne les acteurs de la construction dans la digitalisation 
              de leurs processus métier. De la planification à la réception des ouvrages, nous 
              intégrons des outils de suivi technique pour garantir le respect des délais et des budgets.
            </p>
            <p>
              Notre expertise couvre à la fois la réalisation physique de projets d'infrastructure 
              et le déploiement de solutions de monitoring (IoT, capteurs) pour une gestion 
              prédictive des actifs.
            </p>
          </div>
          <div className="service-image-placeholder" style={{ background: '#f8fafc', height: '300px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', border: '1px dashed #cbd5e1' }}>
             <i className="fas fa-hard-hat fa-4x"></i>
          </div>
        </div>

        <div className="service-cards-grid">
          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-drafting-compass"></i></div>
            <h3>Études & Planification</h3>
            <p>Conception technique, calcul de structures et planification stratégique pour optimiser chaque phase de vos projets.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Études de Faisabilité</li>
              <li><i className="fas fa-check"></i> Modélisation 2D/3D</li>
              <li><i className="fas fa-check"></i> Optimisation des Coûts</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-tools"></i></div>
            <h3>Construction & Infrastructures</h3>
            <p>Réalisation de bâtiments industriels, tertiaires et résidentiels avec une exigence de qualité supérieure.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Gros Œuvre & Second Œuvre</li>
              <li><i className="fas fa-check"></i> Voiries & Réseaux Divers (VRD)</li>
              <li><i className="fas fa-check"></i> Management de Chantier</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-network-wired"></i></div>
            <h3>Digitalisation & IoT</h3>
            <p>Intégration de capteurs connectés pour le suivi en temps réel de la santé des structures et la sécurité des travailleurs.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Monitoring de Structures</li>
              <li><i className="fas fa-check"></i> Vidéosurveillance Intelligente</li>
              <li><i className="fas fa-check"></i> GMAO Intégrée</li>
            </ul>
          </article>
        </div>

        <div className="service-cta-banner">
          <h2>Un projet d'envergure à réaliser ?</h2>
          <p>Associez notre rigueur d'ingénierie à votre vision architecturale.</p>
          <Link to="/contact" className="service-cta-btn">Parler de mon projet BTP</Link>
        </div>
      </div>
    </div>
  );
}
