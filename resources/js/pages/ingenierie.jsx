import React from "react";
import { Link } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/ingenierie-new.css";

// 12 Domaines de prestations
const PRESTATIONS_DOMAINES = [
  {
    id: 1,
    slug: "drone-solutions",
    title: "Solutions Drone",
    description: "Acquisition de données aériennes, cartographie, inspection industrielle et surveillance pour projets d'infrastructure.",
    image: "/images/prestations/drone.webp",
    icon: "🛸"
  },
  {
    id: 2,
    slug: "tpe-systemes",
    title: "Systèmes TPE",
    description: "Déploiement et intégration terminaux de paiement électronique, solutions monétiques et gestion de flux financiers.",
    image: "/images/prestations/tpe.webp",
    icon: "💳"
  },
  {
    id: 3,
    slug: "archivage-numerique",
    title: "Archivage Numérique",
    description: "Digitalisation, GED sécurisée, conservation légale et gestion intelligente du patrimoine documentaire.",
    image: "/images/prestations/archivage.webp",
    icon: "📂"
  },
  {
    id: 4,
    slug: "materiel-informatique",
    title: "Matériel Informatique",
    description: "Fourniture, déploiement et maintenance parc informatique entreprise, postes, serveurs et infrastructures virtuelles.",
    image: "/images/prestations/informatique.webp",
    icon: "💻"
  },
  {
    id: 5,
    slug: "reseau-infrastructure",
    title: "Infrastructure Réseau",
    description: "Conception câblage structuré, fibre optique, WiFi entreprise, routage et sécurité réseau périmétrique.",
    image: "/images/prestations/reseau.webp",
    icon: "🌐"
  },
  {
    id: 6,
    slug: "securite-incendie",
    title: "Sécurité Incendie",
    description: "Détection, alarme, extinction, systèmes de désenfumage et maintenance installations conformes normes internationales.",
    image: "/images/prestations/incendie.webp",
    icon: "🔥"
  },
  {
    id: 7,
    slug: "energie-solutions",
    title: "Solutions Énergie",
    description: "Alimentation continue, groupes électrogènes, énergies renouvelables, supervision et optimisation consommation.",
    image: "/images/prestations/energie.webp",
    icon: "⚡"
  },
  {
    id: 8,
    slug: "telecommunications",
    title: "Télécommunications",
    description: "VoIP, centrales téléphoniques, visioconférence, connectivité dédiée et solutions unifiées communication.",
    image: "/images/prestations/telecom.webp",
    icon: "📞"
  },
  {
    id: 9,
    slug: "cybersecurite",
    title: "Cybersécurité",
    description: "Audit vulnérabilités, protection endpoints, SIEM, réponse incident et formation équipes sécurité.",
    image: "/images/prestations/cybersecurite.webp",
    icon: "🛡️"
  },
  {
    id: 10,
    slug: "controle-acces",
    title: "Contrôle Accès",
    description: "Systèmes biométriques, badges, vidéosurveillance IP, gestion présence et sécurité physique sites.",
    image: "/images/prestations/acces.webp",
    icon: "🔐"
  },
  {
    id: 11,
    slug: "automatisation-industrielle",
    title: "Automatisation",
    description: "Automatismes industriels, PLC, supervision SCADA, instrumentation et pilotage procédés fabrication.",
    image: "/images/prestations/automatisation.webp",
    icon: "⚙️"
  },
  {
    id: 12,
    slug: "formation-transfer",
    title: "Formation & Transfert",
    description: "Monter en compétence équipes, transfert savoir-faire technique et documentation exploitation complète.",
    image: "/images/prestations/formation.webp",
    icon: "🎓"
  }
];

export default function Ingenierie() {
    usePageMeta(
        "Ingénierie informatique et industrielle | Groupe ISD AFRIK",
        "12 domaines d'expertise pour l'architecture SI, integration systemes et automatisation d'entreprise."
    );

    return (
        <div className="ingenierie-page ingenierie-modern"> 
            <section className="ingenierie-hero-modern">
                    <h1 className="ingenierie-hero-title">Nos 12 Domaines d'Expertise</h1>
                    <p className="ingenierie-hero-subtitle">
                        Ingénierie informatique et industrielle - Solutions complètes pour entreprises et projets d'infrastructure
                    </p>
                    <Link to="/contact" className="ingenierie-hero-cta">
                        Demander un devis →
                    </Link>
                </section> 

            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
                <div className="ingenierie-section-header mb-12 text-center">
                    <h2>Nos 12 Domaines de Prestations</h2>
                </div> 

                <div className="ingenierie-grid"> 
                    {PRESTATIONS_DOMAINES.map((domaine, index) => (
                            <article 
                            key={domaine.id} 
                            className="ingenierie-card"
                            style={{ animationDelay: `${0.05 * index}s` }}
                        >
                            <img 
                                src={domaine.image} 
                                alt={domaine.title}
                                loading="lazy"
                                className="ingenierie-card-image"
                                onError={(e) => {
                                    e.target.src = '/images/prestations/default.jpg';
                                }}
                            />
                            <div className="ingenierie-card-overlay"></div>
                            <div className="ingenierie-card-icon">{domaine.icon}</div>
                            <div className="ingenierie-card-content">
                                <h3 className="ingenierie-card-title">{domaine.title}</h3>
                                <p className="ingenierie-card-desc">{domaine.description}</p>
                                <Link 
                                    to={`/prestation/${domaine.slug}`}
                                    className="ingenierie-btn"
                                >
                                    Prestation →
                                </Link>
                            </div>
                        </article> 
                    ))}
                </div>
            </section>

            <section className="ingenierie-cta">
                    <h2 className="ingenierie-cta-title">Projet à réaliser ?</h2>
                    <p className="ingenierie-cta-text">
                        Nos experts analysent vos besoins et vous proposent la meilleure combinaison de prestation
                    </p>
                    <Link to="/contact" className="ingenierie-hero-cta">
                        Nous contacter
                    </Link>
                </section>
        </div>
    );
} 
