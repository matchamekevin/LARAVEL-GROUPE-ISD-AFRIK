import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/projets-new.css";

const PROJETS = [
  { title: "Plateforme ISD Portal", category: "Digital", description: "Solution complète de gestion d'entreprise incluant la facturation, le CRM et le suivi des stocks.", image: "/images/solutions/im1.webp", url: "https://portal.isdafrik.com", slug: "isd-portal", longDesc: "ISD Portal est une plateforme tout-en-un qui centralise la gestion de votre entreprise : facturation automatisée, CRM intégré, suivi des stocks en temps réel, rapports financiers et tableau de bord personnalisable. Conçue pour les PME africaines, elle s'adapte à vos processus métier." },
  { title: "SafeCity Surveillance", category: "Sécurité", description: "Déploiement d'un réseau de vidéosurveillance IP haute définition pour une zone industrielle.", image: "/images/solutions/im2.webp", url: "https://security.isdafrik.com", slug: "safecity-surveillance", longDesc: "SafeCity est un système de vidéosurveillance IP nouvelle génération. Caméras HD, analyse vidéo intelligente, stockage cloud sécurisé et supervision 24h/24. Solution déployée pour les zones industrielles, les centres commerciaux et les administrations publiques." },
  { title: "AfrikPay", category: "Fintech", description: "Passerelle de paiement sécurisée pour le commerce électronique local et international.", image: "/images/solutions/im3.webp", url: "https://pay.isdafrik.com", slug: "afrikpay", longDesc: "AfrikPay est une passerelle de paiement qui permet aux entreprises d'accepter les paiements en ligne en toute sécurité. Supporte TMoney, Flooz, Visa, Mastercard et mobile money. Interface API RESTful pour une intégration facile avec votre site e-commerce." },
  { title: "EduAfrik Management", category: "Éducation", description: "Système de gestion universitaire (ERP) pour le suivi des étudiants et de la scolarité.", image: "/images/solutions/im4.webp", url: "https://edu.isdafrik.com", slug: "eduafrik-management", longDesc: "EduAfrik est un ERP universitaire complet : gestion des inscriptions, des notes, des emplois du temps, de la scolarité et des frais. Portail étudiant, espace enseignant et tableau de bord direction. Solution déployée dans plusieurs universités africaines." },
  { title: "AgroDrone Mapping", category: "Agriculture", description: "Service de cartographie par drone pour l'optimisation des rendements agricoles.", image: "/images/prestations/default.jpg", url: "https://drones.isdafrik.com", slug: "agrodrone-mapping", longDesc: "AgroDrone Mapping utilise des drones professionnels pour la cartographie agricole : analyse NDVI des cultures, détection des stress hydriques, estimation des rendements et création d'orthophotos. Optimisez vos rendements avec des données précises." },
  { title: "HotelSync Pro", category: "Hôtellerie", description: "Logiciel de gestion hôtelière avec moteur de réservation en temps réel.", image: "/images/prestations/default.jpg", url: "https://hotels.isdafrik.com", slug: "hotelsync-pro", longDesc: "HotelSync Pro est un logiciel de gestion hôtelière complet : module de réservation, gestion des chambres, check-in/check-out, facturation, reporting et intégration avec les OTA. Moteur de réservation en temps réel pour votre site web." },
  { title: "BTP Connect", category: "Industrie", description: "Suivi technique et monitoring de chantiers via des capteurs IoT connectés.", image: "/images/prestations/default.jpg", url: "https://btp.isdafrik.com", slug: "btp-connect", longDesc: "BTP Connect est une solution IoT pour le suivi de chantiers : capteurs de vibration, température, humidité et localisation. Tableau de bord en temps réel, alertes automatiques et rapports d'avancement. Optimisez la gestion de vos projets BTP." },
  { title: "ArchiveSafe GED", category: "Archivage", description: "Plateforme de gestion électronique de documents (GED) hautement sécurisée.", image: "/images/prestations/default.jpg", url: "https://archive.isdafrik.com", slug: "archivesafe-ged", longDesc: "ArchiveSafe GED est une plateforme de gestion électronique de documents avec chiffrement de bout en bout. Indexation automatique, recherche plein texte, gestion des versions, signatures électroniques et conformité RGPD. Solution cloud ou on-premise." },
];

export default function ProjetPresentation() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const projet = PROJETS.find((p) => p.slug === slug);

  usePageMeta(
    projet ? `${projet.title} | Groupe ISD AFRIK` : "Projet | Groupe ISD AFRIK",
    projet?.longDesc || "Présentation de nos projets"
  );

  if (!projet) {
    return (
      <div className="projets-page projets-modern">
        <section className="projets-hero-modern" style={{ padding: "60px 20px" }}>
          <h1 className="projets-hero-title">Projet introuvable</h1>
          <p className="projets-hero-subtitle">Le projet que vous recherchez n'existe pas.</p>
          <button onClick={() => navigate("/projets")} className="projet-link-btn" style={{ marginTop: 20 }}>
            ← Retour aux projets
          </button>
        </section>
      </div>
    );
  }

  return (
    <div className="projets-page projets-modern">
      <section className="projets-hero-modern" style={{ padding: "60px 20px 80px" }}>
        <div className="projets-hero-chip">{projet.category}</div>
        <h1 className="projets-hero-title">{projet.title}</h1>
      </section>

      <section className="projets-section" style={{ paddingTop: 0 }}>
        <div className="projet-pres-container">
          <div className="projet-pres-image">
            <img src={projet.image} alt={projet.title} />
          </div>
          <div className="projet-pres-content">
            <h2>À propos de ce projet</h2>
            <p className="projet-pres-desc">{projet.longDesc}</p>
            <div className="projet-pres-meta">
              <div className="projet-pres-meta-item">
                <strong>Catégorie</strong>
                <span>{projet.category}</span>
              </div>
            </div>
            <div className="projet-pres-actions">
              <button onClick={() => navigate("/projets")} className="projet-link-btn projet-link-btn--ghost">
                ← Tous les projets
              </button>
              <a href={projet.url} target="_blank" rel="noopener noreferrer" className="projet-link-btn">
                Visiter le site <i className="fas fa-external-link-alt"></i>
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
