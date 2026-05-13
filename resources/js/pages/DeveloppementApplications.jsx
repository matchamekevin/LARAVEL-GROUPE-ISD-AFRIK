import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/service-pages-new.css";

export default function DeveloppementApplications() {
  usePageMeta(
    "Développement d'applications | Groupe ISD AFRIK",
    "Conception de sites web, applications mobiles et solutions cloud sur mesure pour entreprises et institutions en Afrique."
  );

  return (
    <div className="service-page-modern">
      {/* Hero Section */}
      <section className="service-hero-modern">
        <h1>Développement d'Applications & Logiciels</h1>
        <p>Transformez vos idées en solutions numériques performantes, évolutives et sécurisées.</p>
      </section>

      {/* Main Content */}
      <div className="service-section">
        <div className="service-grid-2">
          <div className="service-text-content">
            <h2>L'ingénierie logicielle au service de votre croissance</h2>
            <p>
              Le Groupe ISD AFRIK conçoit des applications métier robustes, adaptées aux défis 
              spécifiques des entreprises et institutions en Afrique de l'Ouest. Nous ne nous 
              contentons pas de coder ; nous bâtissons des outils stratégiques qui optimisent 
              vos opérations quotidiennes.
            </p>
            <p>
              De l'audit de vos besoins à la mise en production, notre approche agile garantit 
              une livraison itérative, centrée sur l'utilisateur final et la valeur métier.
            </p>
          </div>
          <div className="service-image-placeholder" style={{ background: '#f8fafc', height: '300px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', border: '1px dashed #cbd5e1' }}>
             <i className="fas fa-code-branch fa-4x"></i>
          </div>
        </div>

        {/* Solutions Grid */}
        <div className="service-cards-grid">
          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-desktop"></i></div>
            <h3>Écosystèmes Web</h3>
            <p>Plateformes SaaS, sites e-commerce et portails institutionnels bâtis sur des architectures modernes.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Laravel & React Expertise</li>
              <li><i className="fas fa-check"></i> Architectures Cloud-Native</li>
              <li><i className="fas fa-check"></i> Haute Performance & Sécurité</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-mobile-alt"></i></div>
            <h3>Mobilité Totale</h3>
            <p>Applications iOS et Android natives ou hybrides pour rester connecté à vos clients et collaborateurs partout.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Flutter & React Native</li>
              <li><i className="fas fa-check"></i> UX/UI Centrée Utilisateur</li>
              <li><i className="fas fa-check"></i> Mode Hors-ligne Intelligent</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-cogs"></i></div>
            <h3>Logiciels Sur-Mesure</h3>
            <p>Parce que vos processus sont uniques, nous créons des ERP et outils de gestion qui s'adaptent à vous.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Automatisation de Workflows</li>
              <li><i className="fas fa-check"></i> Interconnexion API & Legacy</li>
              <li><i className="fas fa-check"></i> Tableaux de Bord Temps Réel</li>
            </ul>
          </article>
        </div>

        {/* CTA Banner */}
        <div className="service-cta-banner">
          <h2>Prêt à accélérer votre digitalisation ?</h2>
          <p>Discutons de votre architecture technique et de vos objectifs de développement.</p>
          <Link to="/contact" className="service-cta-btn">Lancer mon projet de développement</Link>
        </div>
      </div>
    </div>
  );
}
