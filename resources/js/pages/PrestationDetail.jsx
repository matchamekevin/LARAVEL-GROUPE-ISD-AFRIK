import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/prestation-detail.css";

const PRESTATIONS_DOMAINES = [
  {
    id: 1,
    slug: "drone-solutions",
    title: "Solutions Drone",
    description: "Acquisition de données aériennes, cartographie, inspection industrielle et surveillance pour projets d'infrastructure.",
    image: "/images/produits/drone.webp",
    icon: "🛸",
    details: "Nos solutions drone offrent une cartographie aérienne haute résolution et une inspection industrielle complète pour vos projets d'infrastructure. Nous garantissons une acquisition de données fiable et sécurisée."
  },
  {
    id: 2,
    slug: "tpe-systemes",
    title: "Systèmes TPE",
    description: "Déploiement et intégration terminaux de paiement électronique, solutions monétiques et gestion de flux financiers.",
    image: "/images/produits/tpe.webp",
    icon: "💳",
    details: "Déployez rapidement des terminaux de paiement électronique modernes. Notre expertise en solutions monétiques garantit une gestion sécurisée et efficace de vos flux financiers."
  },
  {
    id: 3,
    slug: "archivage-numerique",
    title: "Archivage Numérique",
    description: "Digitalisation, GED sécurisée, conservation légale et gestion intelligente du patrimoine documentaire.",
    image: "/images/produits/int.webp",
    icon: "📂",
    details: "Transformez votre patrimoine documentaire en actif numérique sécurisé. Nos solutions GED respectent les normes légales et garantissent la conservation long terme."
  },
  {
    id: 4,
    slug: "materiel-informatique",
    title: "Matériel Informatique",
    description: "Fourniture, déploiement et maintenance parc informatique entreprise, postes, serveurs et infrastructures virtuelles.",
    image: "/images/produits/drone1.webp",
    icon: "💻",
    details: "Équipez votre entreprise avec du matériel informatique performant et fiable. Nous gérons le déploiement complet et la maintenance continue de votre infrastructure."
  },
  {
    id: 5,
    slug: "reseau-infrastructure",
    title: "Infrastructure Réseau",
    description: "Conception câblage structuré, fibre optique, WiFi entreprise, routage et sécurité réseau périmétrique.",
    image: "/images/produits/proj.webp",
    icon: "🌐",
    details: "Bâtissez une infrastructure réseau robuste avec câblage structuré et fibre optique. Notre expertise couvre WiFi entreprise, routage avancé et sécurité périmétrique."
  },
  {
    id: 6,
    slug: "securite-incendie",
    title: "Sécurité Incendie",
    description: "Détection, alarme, extinction, systèmes de désenfumage et maintenance installations conformes normes internationales.",
    image: "/images/produits/ond.webp",
    icon: "🔥",
    details: "Protégez vos installations avec des systèmes de sécurité incendie conformes aux normes internationales. Détection, alarme, extinction et désenfumage intégrés."
  },
  {
    id: 7,
    slug: "energie-solutions",
    title: "Solutions Énergie",
    description: "Alimentation continue, groupes électrogènes, énergies renouvelables, supervision et optimisation consommation.",
    image: "/images/produits/tpe1.webp",
    icon: "⚡",
    details: "Assurez la continuité énergétique de vos opérations avec groupes électrogènes et onduleurs. Nous intégrons aussi les énergies renouvelables et l'optimisation de consommation."
  },
  {
    id: 8,
    slug: "telecommunications",
    title: "Télécommunications",
    description: "VoIP, centrales téléphoniques, visioconférence, connectivité dédiée et solutions unifiées communication.",
    image: "/images/produits/tpe2.webp",
    icon: "📞",
    details: "Modernisez votre communication avec VoIP, centrales téléphoniques IP et visioconférence. Solutions unifiées pour connectivité dédiée et collaboration efficace."
  },
  {
    id: 9,
    slug: "cybersecurite",
    title: "Cybersécurité",
    description: "Audit vulnérabilités, protection endpoints, SIEM, réponse incident et formation équipes sécurité.",
    image: "/images/produits/drone1.webp",
    icon: "🛡️",
    details: "Protégez votre infrastructure contre les cyber-menaces. Audit complet, protection endpoints, SIEM avancé et plan de réponse incident documenté."
  },
  {
    id: 10,
    slug: "controle-acces",
    title: "Contrôle Accès",
    description: "Systèmes biométriques, badges, vidéosurveillance IP, gestion présence et sécurité physique sites.",
    image: "/images/produits/proj.webp",
    icon: "🔐",
    details: "Sécurisez vos locaux avec contrôle d'accès biométrique, badges et vidéosurveillance IP. Gestion centralisée de la présence et de la sécurité physique."
  },
  {
    id: 11,
    slug: "automatisation-industrielle",
    title: "Automatisation",
    description: "Automatismes industriels, PLC, supervision SCADA, instrumentation et pilotage procédés fabrication.",
    image: "/images/produits/int.webp",
    icon: "⚙️",
    details: "Optimisez vos procédés de fabrication avec automatisation industrielle avancée. PLC programmables, SCADA pour supervision et instrumentation complète."
  },
  {
    id: 12,
    slug: "formation-transfer",
    title: "Formation & Transfert",
    description: "Monter en compétence équipes, transfert savoir-faire technique et documentation exploitation complète.",
    image: "/images/produits/ond.webp",
    icon: "🎓",
    details: "Montez en compétence vos équipes avec nos formations techniques spécialisées. Transfert de savoir-faire et documentation d'exploitation complète fournis."
  }
];

export default function PrestationDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  
  const prestation = PRESTATIONS_DOMAINES.find(p => p.slug === slug);

  usePageMeta(
    prestation ? `${prestation.title} | Groupe ISD AFRIK` : "Prestation non trouvée",
    prestation ? prestation.description : "Prestation non disponible"
  );

  if (!prestation) {
    return (
      <div className="prestation-not-found">
        <div className="prestation-not-found-content">
          <h1>Prestation non trouvée</h1>
          <p>Désolé, nous n'avons pas trouvé cette prestation.</p>
          <Link to="/ingenierie" className="prestation-back-btn">
            ← Retour aux prestations
          </Link>
        </div>
      </div>
    );
  }

  const currentIndex = PRESTATIONS_DOMAINES.findIndex(p => p.slug === slug);
  const prevPrestation = currentIndex > 0 ? PRESTATIONS_DOMAINES[currentIndex - 1] : null;
  const nextPrestation = currentIndex < PRESTATIONS_DOMAINES.length - 1 ? PRESTATIONS_DOMAINES[currentIndex + 1] : null;

  return (
    <div className="prestation-detail-page">
      <button className="prestation-back-btn" onClick={() => navigate(-1)}>
        ← Retour
      </button>

      <section className="prestation-hero">
        <img 
          src={prestation.image} 
          alt={prestation.title}
          className="prestation-hero-image"
          onError={(e) => {
            e.target.src = '/images/produits/drone.webp';
          }}
        />
        <div className="prestation-hero-overlay"></div>
        <div className="prestation-hero-content">
          <div className="prestation-hero-icon">{prestation.icon}</div>
          <h1 className="prestation-hero-title">{prestation.title}</h1>
        </div>
      </section>

      <section className="prestation-content">
        <div className="prestation-container">
          <div className="prestation-description">
            <h2>À propos de cette prestation</h2>
            <p className="prestation-intro">{prestation.description}</p>
            <p className="prestation-details">{prestation.details}</p>
          </div>

          <div className="prestation-services">
            <h2>Nos services incluent</h2>
            <ul className="prestation-services-list">
              <li>Audit et diagnostic complet</li>
              <li>Conception et planification stratégique</li>
              <li>Implémentation et déploiement</li>
              <li>Formation et support utilisateurs</li>
              <li>Maintenance et support continu</li>
              <li>Optimisation et évolution</li>
            </ul>
          </div>

          <div className="prestation-contact-cta">
            <h3>Intéressé par cette prestation ?</h3>
            <Link to="/contact" className="prestation-contact-btn">
              Demander un devis →
            </Link>
          </div>
        </div>
      </section>

      <section className="prestation-navigation">
        <div className="prestation-container">
          <div className="prestation-nav-grid">
            {prevPrestation && (
              <Link to={`/prestation/${prevPrestation.slug}`} className="prestation-nav-card prestation-nav-prev">
                <span className="prestation-nav-arrow">← Précédent</span>
                <span className="prestation-nav-title">{prevPrestation.title}</span>
              </Link>
            )}
            <div></div>
            {nextPrestation && (
              <Link to={`/prestation/${nextPrestation.slug}`} className="prestation-nav-card prestation-nav-next">
                <span className="prestation-nav-arrow">Suivant →</span>
                <span className="prestation-nav-title">{nextPrestation.title}</span>
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
