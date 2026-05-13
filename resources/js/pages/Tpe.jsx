import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/service-pages-new.css";

export default function Tpe() {
  usePageMeta(
    "Fourniture de TPE | Groupe ISD AFRIK",
    "Terminaux de paiement électronique (TPE) fiables, installation, paramétrage et support pour commerces et institutions."
  );

  return (
    <div className="service-page-modern">
      <section className="service-hero-modern">
        <h1>Solutions de Paiement & Terminaux (TPE)</h1>
        <p>Sécurisez vos encaissements et facilitez l'expérience d'achat de vos clients.</p>
      </section>

      <div className="service-section">
        <div className="service-grid-2">
          <div className="service-text-content">
            <h2>Modernisez vos points de vente</h2>
            <p>
              Le Groupe ISD AFRIK fournit des solutions TPE de dernière génération, adaptées 
              aux contraintes de connectivité et de mobilité du marché africain. Que vous soyez 
              un commerce de proximité ou une grande institution, nous avons la solution.
            </p>
            <p>
              Notre offre inclut la fourniture du matériel, mais aussi le paramétrage bancaire, 
              la formation de vos équipes et une assistance technique réactive.
            </p>
          </div>
          <div className="service-image-placeholder" style={{ background: '#f8fafc', height: '300px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', border: '1px dashed #cbd5e1' }}>
             <i className="fas fa-credit-card fa-4x"></i>
          </div>
        </div>

        <div className="service-cards-grid">
          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-microchip"></i></div>
            <h3>Terminaux Mobiles (Android)</h3>
            <p>TPE intelligents sous Android permettant une gestion fluide des paiements et une interconnexion avec vos logiciels.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Connexion 4G & Wi-Fi</li>
              <li><i className="fas fa-check"></i> Écran Tactile & Reçu Digital</li>
              <li><i className="fas fa-check"></i> Autonomie Prolongée</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-lock"></i></div>
            <h3>Sécurité & Conformité</h3>
            <p>Toutes nos solutions respectent les standards internationaux de sécurité (PCI-DSS) pour garantir l'intégrité des transactions.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Chiffrement de Bout en Bout</li>
              <li><i className="fas fa-check"></i> Anti-Fraude Intégré</li>
              <li><i className="fas fa-check"></i> Certification EMV</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><i className="fas fa-tools"></i></div>
            <h3>Service & Maintenance</h3>
            <p>Un support technique dédié pour minimiser les temps d'arrêt de vos systèmes d'encaissement.</p>
            <ul className="service-card-list">
              <li><i className="fas fa-check"></i> Installation sur site</li>
              <li><i className="fas fa-check"></i> Paramétrage Passerelles</li>
              <li><i className="fas fa-check"></i> Maintenance Préventive</li>
            </ul>
          </article>
        </div>

        <div className="service-cta-banner">
          <h2>Besoin d'équiper votre réseau de vente ?</h2>
          <p>Demandez une étude personnalisée de vos besoins en terminaux de paiement.</p>
          <Link to="/contact" className="service-cta-btn">Consulter nos offres TPE</Link>
        </div>
      </div>
    </div>
  );
}
