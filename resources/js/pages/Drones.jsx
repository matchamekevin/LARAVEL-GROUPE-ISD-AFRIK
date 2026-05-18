import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/service-pages-new.css";

export default function Drones() {
  usePageMeta(
    "Drones : Fourniture & Formation | Groupe ISD AFRIK",
    "Expertise drone en Afrique : vente d'équipements professionnels, formation certifiante et services techniques de haute précision."
  );

  return (
    <div className="service-page-modern">
      <section className="service-hero-modern">
        <h1>Solutions Drone Professionnelles</h1>
        <p>Prenez de la hauteur avec nos technologies de pointe et nos formations expertes.</p>
      </section>

      <div className="service-section">
        <div className="service-grid-2">
          <div className="service-text-content">
            <h2>L'excellence aérienne au service de l'industrie</h2>
            <p>
              Le Groupe ISD AFRIK est un pionnier dans l'intégration de solutions drones en Afrique 
              de l'Ouest. Nous accompagnons les secteurs de l'agriculture, du BTP, et de la sécurité 
              avec des outils de captation et d'analyse de données aériennes.
            </p>
            <p>
              Plus qu'un simple fournisseur, nous sommes un centre de formation certifié qui 
              garantit le transfert de compétences pour une exploitation sécurisée et efficace 
              des systèmes automatisés.
            </p>
          </div>
          <div className="service-image-placeholder" style={{ background: '#f8fafc', height: '300px', borderRadius: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b', fontSize: '1.2rem', border: '1px dashed #cbd5e1' }}>
             <span className="material-icons" style={{fontSize:48}}>helicopter</span>
          </div>
        </div>

        <div className="service-cards-grid">
          <article className="service-card-item">
            <div className="service-card-icon"><span className="material-icons" style={{fontSize:36}}>shopping_cart</span></div>
            <h3>Vente d'Équipements</h3>
            <p>Drones multirotors et ailes fixes pour la cartographie, l'inspection thermique et la surveillance longue portée.</p>
            <ul className="service-card-list">
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Partenariats Grandes Marques</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Capteurs Haute Résolution</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Accessoires & Pièces Détachées</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><span className="material-icons" style={{fontSize:36}}>school</span></div>
            <h3>Formation & Certification</h3>
            <p>Programmes pratiques pour former vos équipes à un usage opérationnel, réglementaire et sécurisé des drones.</p>
            <ul className="service-card-list">
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Pilotage de Base & Avancé</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Photogrammétrie & SIG</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Maintenance de Premier Niveau</li>
            </ul>
          </article>

          <article className="service-card-item">
            <div className="service-card-icon"><span className="material-icons" style={{fontSize:36}}>query_stats</span></div>
            <h3>Services Techniques</h3>
            <p>Acquisition, traitement et valorisation de données aériennes pour des décisions plus rapides et plus fiables.</p>
            <ul className="service-card-list">
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Modélisation 3D (BIM)</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Agriculture de Précision</li>
              <li><span className="material-icons" style={{fontSize:16,verticalAlign:'middle',marginRight:6}}>check</span> Inspection de Structures</li>
            </ul>
          </article>
        </div>

        <div className="service-cta-banner">
          <h2>Prêt à intégrer le drone dans vos opérations ?</h2>
          <p>Contactez nos experts pour définir la solution la plus adaptée à vos contraintes terrain.</p>
          <Link to="/contact" className="service-cta-btn">Demander un devis drone</Link>
        </div>
      </div>
    </div>
  );
}
