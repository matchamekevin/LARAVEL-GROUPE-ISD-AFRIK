import React from "react";
import { Link, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/solutions-new.css";

export default function Solutions() {
    usePageMeta(
        "Solutions & Accompagnement | Groupe ISD AFRIK",
        "Solutions de gestion performantes et accompagnement expert pour la transformation digitale des entreprises en Afrique."
    );
    const navigate = useNavigate();

    const univers = [
        {
            id: "classique",
            title: "Solutions de Gestion Classique",
            icon: "fas fa-laptop-code",
            desc: "Pilotez votre entreprise avec efficacité. Des logiciels fiables pour automatiser votre gestion quotidienne, gagner du temps et améliorer votre rentabilité.",
            items: ["Gestion Commerciale", "Gestion de Stock", "Comptabilité", "Immobilisations", "États Financiers", "Paie & RH"],
            link: "/produits?segment=general"
        },
        {
            id: "metier",
            title: "Solutions Métiers Sectorielles",
            icon: "fas fa-industry",
            desc: "Des logiciels conçus pour votre activité. Chaque secteur a ses réalités. Nos solutions métiers répondent précisément aux besoins de votre domaine.",
            items: ["Gestion Universitaire", "Gestion Hôtelière", "Gestion Microfinance", "Gestion Pharmacie", "Gestion Assurance IARD", "Gestion Immobilière"],
            link: "/produits?segment=metier"
        },
        {
            id: "plateforme",
            title: "Plateformes Innovantes ISD AFRIK",
            icon: "fas fa-rocket",
            desc: "Nos propres plateformes digitales nouvelle génération. Le GROUPE ISD AFRIK développe également des plateformes intelligentes pour accompagner la transformation digitale africaine.",
            items: ["Annuaire digital multisupport", "Réservation hôtels & appartements", "CRM & Marketing Automation", "Plateformes de paiement", "Solutions mobiles sur mesure", "Audit & Conseil Digital"],
            link: "/geovision"
        }
    ];

    const interventions = [
        {
            title: "Audit Logiciel & Diagnostic Organisationnel",
            desc: "Analyse de vos processus internes, outils existants, besoins métiers et axes d'amélioration. Nous identifions les pertes de temps et les risques de gestion.",
            checks: ["Analyse des processus", "Identification des doublons", "Évaluation des risques", "Recommandations ciblées"]
        },
        {
            title: "Configuration & Paramétrage des Solutions",
            desc: "Chaque entreprise est unique. Nous adaptons les logiciels à votre réalité terrain : plan comptable, workflows et droits d'accès.",
            checks: ["Plan comptable sur mesure", "Workflow de validation", "Gestion des habilitations", "États de gestion personnalisés"]
        },
        {
            title: "Formation du Personnel",
            desc: "Le meilleur logiciel sans utilisateurs formés reste inutile. Nous assurons des formations pratiques pour vos équipes comptables, RH et managers.",
            checks: ["Formations pratiques", "Transfert de compétences", "Supports de cours", "Évaluation des acquis"]
        },
        {
            title: "Assistance & Support Continu",
            desc: "Nous restons à vos côtés après le déploiement. Support technique, mises à jour et optimisation continue de vos outils.",
            checks: ["Support technique N1/N2/N3", "Mises à jour régulières", "Assistance utilisateurs", "Conseils d'évolution"]
        }
    ];

    const whyUs = [
        "Expertise locale & internationale",
        "Accompagnement personnalisé",
        "Installation & Paramétrage",
        "Formation des équipes",
        "Assistance technique rapide",
        "Solutions évolutives et sécurisées",
        "Données fiables & Décisions rapides",
        "Gain de productivité mesurable"
    ];

    return (
        <div className="solutions-page solutions-modern">
            {/* Hero Section */}
            <section className="solutions-hero-modern">
                <div className="solutions-hero-chip">Transformation Digitale</div>
                <h1 className="solutions-hero-title">
                    Des Solutions de Gestion Performantes, Portées par un Accompagnement Expert
                </h1>
                <p className="solutions-hero-subtitle">
                    Le GROUPE ISD AFRIK accompagne les entreprises, institutions et organisations avec des solutions 
                    logicielles performantes, modernes et adaptées aux réalités africaines. Nous vous aidons à 
                    déployer et rentabiliser vos outils de gestion.
                </p>

                <div className="solutions-hero-actions">
                    <button onClick={() => navigate("/contact")} className="solutions-hero-cta solutions-hero-cta--primary">
                        Demander une Démonstration
                    </button>
                    <button onClick={() => navigate("/contact")} className="solutions-hero-cta solutions-hero-cta--secondary">
                        Nous Contacter
                    </button>
                    <a href="/brochure-isd-afrik.pdf" className="solutions-hero-cta solutions-hero-cta--outline" target="_blank" rel="noopener noreferrer">
                        Télécharger la Brochure
                    </a>
                </div>
            </section>

            {/* Univers Section */}
            <section className="solutions-univers">
                <div className="solutions-section-title">
                    <h2>Nos 3 Univers de Solutions</h2>
                    <p>Accélérez votre performance avec des solutions de gestion intelligentes et adaptées.</p>
                </div>

                <div className="solutions-univers-grid">
                    {univers.map((u) => (
                        <article key={u.id} className={`univers-card univers-card--${u.id}`}>
                            <div className="univers-icon-wrap">
                                <i className={u.icon}></i>
                            </div>
                            <h3>{u.title}</h3>
                            <p className="univers-desc">{u.desc}</p>
                            
                            <ul className="univers-list">
                                {u.items.map((item, idx) => (
                                    <li key={idx}><i className="fas fa-check-circle"></i> {item}</li>
                                ))}
                            </ul>

                            <Link to={u.link} className="univers-cta">
                                Découvrir ces solutions
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            {/* Interventions Section */}
            <section className="solutions-interventions">
                <div className="interventions-container">
                    <div className="solutions-section-title">
                        <h2>Nos Domaines d'Intervention</h2>
                        <p>Nous ne livrons pas qu'un logiciel, nous livrons un résultat opérationnel concret.</p>
                    </div>

                    <div className="interventions-grid">
                        {interventions.map((item, index) => (
                            <article key={index} className="intervention-item">
                                <div className="intervention-num">0{index + 1}</div>
                                <h4>{item.title}</h4>
                                <p>{item.desc}</p>
                                <ul className="intervention-sublist">
                                    {item.checks.map((check, idx) => (
                                        <li key={idx}><i className="fas fa-arrow-right"></i> {check}</li>
                                    ))}
                                </ul>
                            </article>
                        ))}
                    </div>
                </div>
            </section>

            {/* Why Us Section */}
            <section className="solutions-why">
                <div className="why-intro">
                    <h2>Pourquoi choisir ISD AFRIK ?</h2>
                    <p>Nous ne vendons pas des logiciels, nous accompagnons votre croissance.</p>
                </div>

                <div className="why-grid">
                    {whyUs.map((point, index) => (
                        <div key={index} className="why-item">
                            <i className="fas fa-check-circle"></i>
                            <span>{point}</span>
                        </div>
                    ))}
                </div>
            </section>

            {/* Final CTA Section */}
            <section className="solutions-cta-final">
                <div className="cta-final-content">
                    <h2>Prêt à transformer votre entreprise ?</h2>
                    <div className="cta-quote">
                        "Un logiciel seul ne transforme pas une entreprise. Un bon accompagnement, oui."
                    </div>

                    <div className="cta-final-points">
                        <div className="cta-final-point"><i className="fas fa-circle"></i> Audit gratuit</div>
                        <div className="cta-final-point"><i className="fas fa-circle"></i> Démonstration</div>
                        <div className="cta-final-point"><i className="fas fa-circle"></i> Conseils experts</div>
                    </div>

                    <button onClick={() => navigate("/contact")} className="cta-btn-large">
                        Prendre rendez-vous
                    </button>

                    <div className="cta-contact-info">
                        <a href="tel:+22870738319"><i className="fas fa-phone"></i> +228 70 73 83 19</a>
                        <a href="mailto:info@groupeisdafrik.com"><i className="fas fa-envelope"></i> info@groupeisdafrik.com</a>
                    </div>
                </div>
            </section>
        </div>
    );
}
