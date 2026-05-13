import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/service-pages-new.css";

export default function Communication() {
  usePageMeta(
    "Communication & Publicité | Groupe ISD AFRIK",
    "Stratégies de communication, marketing digital et branding pour renforcer votre visibilité et votre impact en Afrique."
  );

  return (
    <div className="service-page-modern">
      <section className="service-hero-modern">
        <h1>Communication & Stratégie Publicitaire</h1>
        <p>Bâtissez une image de marque forte et touchez votre audience avec précision.</p>
      </section>

      <div className="service-section">
        <div className="service-grid-2">
          <div className="service-text-content">
            <h2>Faire rayonner votre expertise</h2>
            <p>
              Dans un marché africain en pleine mutation, la visibilité ne suffit plus ; il faut 
              de la pertinence. Le Groupe ISD AFRIK conçoit des dispositifs de communication 
              transversaux qui allient créativité, technologie et analyse de données.
            </p>
            <p>
              Nous vous accompagnons dans la définition de votre identité visuelle et dans 
              le déploiement de campagnes publicitaires qui génèrent un engagement réel.
            </p>
          </div>
          <div className="service-image-placeholder" style={{ background: '#f8fafc', height: '300px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', border: '1px dashed #cbd5e1' }}>
             <i className="fas fa-bullhorn fa-4x"></i>
          </div>
        </div>

        <div className="service-cards-grid">
          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-chart-line"></i></div>
            <h3>Marketing Digital</h3>
            <p>Campagnes ciblées sur Google Ads, réseaux sociaux et SEO pour maximiser votre retour sur investissement.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Social Media Management</li>
              <li><i className="fas fa-check"></i> Référencement Naturel & Payant</li>
              <li><i className="fas fa-check"></i> Analyse d'Audience</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-pen-nib"></i></div>
            <h3>Branding & Design</h3>
            <p>Création d'identités visuelles percutantes (logos, chartes graphiques) et de supports de communication print/web.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Conception de Logos</li>
              <li><i className="fas fa-check"></i> Chartes Graphiques</li>
              <li><i className="fas fa-check"></i> Design UX/UI</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-video"></i></div>
            <h3>Production de Contenu</h3>
            <p>Vidéo, photographie et rédaction stratégique pour raconter votre histoire de manière authentique.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Storytelling de Marque</li>
              <li><i className="fas fa-check"></i> Vidéos Institutionnelles</li>
              <li><i className="fas fa-check"></i> Copywriting SEO</li>
            </ul>
          </article>
        </div>

        <div className="service-cta-banner">
          <h2>Envie de booster votre visibilité ?</h2>
          <p>Confiez votre image à des experts de la communication stratégique en Afrique.</p>
          <Link to="/contact" className="service-cta-btn">Parler à un expert communication</Link>
        </div>
      </div>
    </div>
  );
}
