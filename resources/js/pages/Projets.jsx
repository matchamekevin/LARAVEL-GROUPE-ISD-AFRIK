import React from "react";
import { useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/projets-new.css";

export default function Projets() {
    usePageMeta(
        "Nos Réalisations | Groupe ISD AFRIK",
        "Découvrez les projets emblématiques réalisés par le GROUPE ISD AFRIK : plateformes digitales, sécurité et ingénierie."
    );
    const navigate = useNavigate();

    const projets = [
        {
            title: "Plateforme ISD Portal",
            category: "Digital",
            description: "Solution complète de gestion d'entreprise incluant la facturation, le CRM et le suivi des stocks.",
            image: "/images/solutions/im1.webp",
            url: "https://portal.isdafrik.com"
        },
        {
            title: "SafeCity Surveillance",
            category: "Sécurité",
            description: "Déploiement d'un réseau de vidéosurveillance IP haute définition pour une zone industrielle.",
            image: "/images/solutions/im2.webp",
            url: "https://security.isdafrik.com"
        },
        {
            title: "AfrikPay",
            category: "Fintech",
            description: "Passerelle de paiement sécurisée pour le commerce électronique local et international.",
            image: "/images/solutions/im3.webp",
            url: "https://pay.isdafrik.com"
        },
        {
            title: "EduAfrik Management",
            category: "Éducation",
            description: "Système de gestion universitaire (ERP) pour le suivi des étudiants et de la scolarité.",
            image: "/images/solutions/im4.webp",
            url: "https://edu.isdafrik.com"
        },
        {
            title: "AgroDrone Mapping",
            category: "Agriculture",
            description: "Service de cartographie par drone pour l'optimisation des rendements agricoles.",
            image: "/images/prestations/default.jpg",
            url: "https://drones.isdafrik.com"
        },
        {
            title: "HotelSync Pro",
            category: "Hôtellerie",
            description: "Logiciel de gestion hôtelière avec moteur de réservation en temps réel.",
            image: "/images/prestations/default.jpg",
            url: "https://hotels.isdafrik.com"
        },
        {
            title: "BTP Connect",
            category: "Industrie",
            description: "Suivi technique et monitoring de chantiers via des capteurs IoT connectés.",
            image: "/images/prestations/default.jpg",
            url: "https://btp.isdafrik.com"
        },
        {
            title: "ArchiveSafe GED",
            category: "Archivage",
            description: "Plateforme de gestion électronique de documents (GED) hautement sécurisée.",
            image: "/images/prestations/default.jpg",
            url: "https://archive.isdafrik.com"
        }
    ];

    return (
        <div className="projets-page projets-modern">
            {/* Hero Section */}
            <section className="projets-hero-modern">
                <div className="projets-hero-chip">Réalisations</div>
                <h1 className="projets-hero-title">Nos Projets Emblématiques</h1>
                <p className="projets-hero-subtitle">
                    Découvrez comment le GROUPE ISD AFRIK transforme les défis technologiques en succès opérationnels 
                    à travers le continent africain.
                </p>
            </section>

            {/* Projects Grid Section */}
            <section className="projets-section">
                <div className="projets-grid">
                    {projets.map((projet, index) => (
                        <article key={index} className="projet-card">
                            <div className="projet-image-wrap">
                                <img src={projet.image} alt={projet.title} className="projet-image" />
                                <span className="projet-category-badge">{projet.category}</span>
                            </div>
                            <div className="projet-content">
                                <h3 className="projet-title">{projet.title}</h3>
                                <p className="projet-desc">{projet.description}</p>
                                <a 
                                    href={projet.url} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="projet-link-btn"
                                >
                                    Visiter le site <i className="fas fa-external-link-alt"></i>
                                </a>
                            </div>
                        </article>
                    ))}
                </div>
            </section>
        </div>
    );
}
