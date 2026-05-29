import React from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import usePageMeta from "../hooks/usePageMeta";
import "../styles/solution-detail.css";

const SOLUTIONS_DATA = {
  classique: {
    id: "classique",
    title: "Solutions de Gestion Classique",
    subtitle: "Pilotez votre entreprise avec des logiciels fiables et performants",
    icon: "fas fa-laptop-code",
    color: "#3b82f6",
    gradient: "linear-gradient(135deg, #1e40af, #3b82f6)",
    heroDesc: "Automatisez votre gestion quotidienne, gagnez du temps et améliorez votre rentabilité avec nos solutions de gestion classique. Des logiciels robustes qui couvrent l'ensemble des besoins opérationnels de votre entreprise.",
    details: [
      {
        title: "Gestion Commerciale",
        desc: "Optimisez vos processus de vente, de la facturation au suivi des clients. Gérez vos devis, bons de commande, factures et avoirs en toute simplicité.",
        points: ["Devis et facturation automatisés", "Gestion des avoirs et remises", "Suivi des règlements clients", "Édition des états de vente"],
      },
      {
        title: "Gestion de Stock",
        desc: "Suivez vos inventaires en temps réel avec une traçabilité complète. Évitez les ruptures et les surstocks grâce à des alertes intelligentes.",
        points: ["Inventaire permanent et valorisé", "Alertes de seuil minimum", "Entrées/sorties avec traçabilité", "États de stock détaillés"],
      },
      {
        title: "Comptabilité",
        desc: "Une comptabilité rigoureuse et conforme aux normes OHADA/SYSCOA. Gérez votre plan comptable, journaux, balances et grands livres.",
        points: ["Plan comptable OHADA/SYSCOA", "Saisie des journaux (achats, ventes, banque, caisse)", "Balance comptable et grand livre", "Déclaration fiscale (TVA, BIC, etc.)"],
      },
      {
        title: "Immobilisations",
        desc: "Gérez l'intégralité de votre parc immobilier et équipements. Suivi des amortissements, cessions et inventaires physiques.",
        points: ["Fiche d'immobilisation détaillée", "Calcul automatique des amortissements", "Gestion des cessions et mises au rebut", "Inventaire physique"],
      },
      {
        title: "États Financiers",
        desc: "Générez automatiquement vos états financiers conformes aux normes : bilan, compte de résultat, annexes et tableau de trésorerie.",
        points: ["Bilan et compte de résultat automatisés", "Annexes légales", "Tableau de trésorerie", "Situation intermédiaire"],
      },
      {
        title: "Paie & RH",
        desc: "Simplifiez la gestion de votre personnel : paie automatisée, contrats, congés et déclarations sociales.",
        points: ["Calcul automatisé de la paie", "Gestion des contrats et congés", "Déclarations sociales (CNSS, etc.)", "Bulletins de paie électroniques"],
      },
    ],
    benefits: [
      "Gain de temps sur les tâches administratives",
      "Fiabilité des données financières",
      "Conformité comptable et fiscale assurée",
      "Tableaux de bord pour décisions éclairées",
      "Multi-utilisateurs et droits d'accès",
      "Support technique réactif",
    ],
  },
  metier: {
    id: "metier",
    title: "Solutions Métiers Sectorielles",
    subtitle: "Des logiciels conçus spécifiquement pour votre secteur d'activité",
    icon: "fas fa-industry",
    color: "#22c55e",
    gradient: "linear-gradient(135deg, #15803d, #22c55e)",
    heroDesc: "Chaque secteur a ses réalités et ses exigences. Nos solutions métiers répondent précisément aux besoins de votre domaine avec des fonctionnalités adaptées et une expertise sectorielle reconnue.",
    details: [
      {
        title: "Gestion Universitaire",
        desc: "Solution complète pour la gestion des établissements d'enseignement : inscriptions, scolarité, notes, examens et finances.",
        points: ["Gestion des inscriptions et réinscriptions", "Planning des cours et emplois du temps", "Gestion des notes, moyennes et bulletins", "Paiement des frais de scolarité"],
      },
      {
        title: "Gestion Hôtelière",
        desc: "Optimisez la gestion de votre hôtel, résidence ou auberge : réservations, check-in/out, facturation et housekeeping.",
        points: ["Réservations en ligne et physiques", "Check-in / Check-out rapide", "Facturation et encaissement", "Gestion du housekeeping et maintenance"],
      },
      {
        title: "Gestion Microfinance",
        desc: "Solution adaptée aux institutions de microfinance : épargne, crédit, suivi des remboursements et reporting réglementaire.",
        points: ["Gestion des comptes épargne et crédit", "Suivi des échéances et remboursements", "Taux d'intérêt et pénalités", "Reporting réglementaire"],
      },
      {
        title: "Gestion Pharmacie",
        desc: "Logiciel de gestion pharmaceutique complet : achats, ventes, gestion des stocks de médicaments et périssabilités.",
        points: ["Gestion des achats et fournisseurs", "Ventes au comptoir avec scanning", "Gestion des dates de péremption", "Suivi des ordonnances"],
      },
      {
        title: "Gestion Assurance IARD",
        desc: "Gérez vos polices d'assurance, sinistres, primes et courtage avec un outil adapté aux spécificités du marché africain.",
        points: ["Gestion des polices et avenants", "Suivi des sinistres", "Calcul des primes et commissions", "Reporting courtage"],
      },
      {
        title: "Gestion Immobilière",
        desc: "Solution pour promoteurs et agences immobilières : gestion des biens, locataires, baux et encaissement des loyers.",
        points: ["Gestion des biens et unités locatives", "Contrats de bail et reconduction", "Encaissement des loyers et quittances", "Suivi des travaux et entretien"],
      },
    ],
    benefits: [
      "Fonctionnalités spécifiques à votre métier",
      "Expertise sectorielle intégrée",
      "Adaptation aux normes locales",
      "Interfaçage avec d'autres outils",
      "Formation métier incluse",
      "Évolutif selon la croissance",
    ],
  },
  plateforme: {
    id: "plateforme",
    title: "Plateformes Innovantes ISD AFRIK",
    subtitle: "Nos propres solutions digitales nouvelle génération pour l'Afrique",
    icon: "fas fa-rocket",
    color: "#fb923c",
    gradient: "linear-gradient(135deg, #c2410c, #fb923c)",
    heroDesc: "Le GROUPE ISD AFRIK développe et opère ses propres plateformes digitales intelligentes pour accélérer la transformation numérique des entreprises et institutions africaines.",
    details: [
      {
        title: "Annuaire Digital Multisupport",
        desc: "Une plateforme de référencement et de mise en relation B2B/B2C. Intégration mapping, visibilité 360° et génération de leads qualifiés.",
        points: ["Référencement entreprises et professionnels", "Géo-localisation et mapping interactif", "Fiches d'établissements enrichies", "Génération de leads qualifiés"],
      },
      {
        title: "Réservation Hôtels & Appartements",
        desc: "Plateforme de réservation en ligne pour l'hébergement touristique et professionnel. Moteur de recherche, paiement sécurisé et gestion des disponibilités.",
        points: ["Moteur de recherche multi-critères", "Paiement en ligne sécurisé", "Gestion des disponibilités temps réel", "Dashboard pour les propriétaires"],
      },
      {
        title: "CRM & Marketing Automation",
        desc: "Solution complète de gestion de la relation client et d'automatisation marketing. Segmentez, ciblez et fidélisez vos clients efficacement.",
        points: ["Gestion des contacts et pipeline commercial", "Campagnes email et SMS automatisées", "Segmentation client avancée", "Analytics et reporting ROI"],
      },
      {
        title: "Plateformes de Paiement",
        desc: "Solutions de paiement en ligne adaptées au contexte africain : mobile money, cartes bancaires, wallets et intégration API.",
        points: ["Mobile Money (T-Money, Flooz, etc.)", "Cartes bancaires internationales", "API de paiement pour développeurs", "Tableau de bord des transactions"],
      },
      {
        title: "Solutions Mobiles Sur Mesure",
        desc: "Applications mobiles iOS et Android pour étendre votre activité sur mobile. De la conception au déploiement sur les stores.",
        points: ["Applications iOS et Android natives", "UI/UX design adapté au mobile", "Backend API scalable", "Publication et maintenance sur stores"],
      },
      {
        title: "Audit & Conseil Digital",
        desc: "Accompagnement stratégique pour votre transformation digitale. Audit de votre SI, conseil en architecture et feuille de route digitale.",
        points: ["Audit de votre système d'information", "Stratégie de transformation digitale", "Architecture technique et fonctionnelle", "Accompagnement au changement"],
      },
    ],
    benefits: [
      "Technologies de pointe",
      "Hébergement local ou cloud",
      "Interface moderne et intuitive",
      "Scalabilité et performances",
      "Support technique dédié",
      "Mises à jour continues",
    ],
  },
};

export default function SolutionDetail() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const solution = SOLUTIONS_DATA[slug];

  usePageMeta(
    solution ? `${solution.title} | Groupe ISD AFRIK` : "Solution non trouvée",
    solution ? solution.subtitle : "Page non disponible"
  );

  if (!solution) {
    return (
      <div className="sd-page sd-modern">
        <section className="sd-hero" style={{ background: "linear-gradient(135deg, #172243, #1a2847)" }}>
          <div className="sd-hero-content">
            <h1 className="sd-hero-title">Solution non trouvée</h1>
            <p className="sd-hero-subtitle">Cette solution n'existe pas ou a été déplacée.</p>
            <Link to="/solutions" className="sd-btn sd-btn--primary">← Retour aux solutions</Link>
          </div>
        </section>
      </div>
    );
  }

  const otherSolutions = Object.values(SOLUTIONS_DATA).filter(s => s.id !== slug);

  return (
    <div className="sd-page sd-modern">
      <section className="sd-hero" style={{ background: solution.gradient }}>
        <div className="sd-hero-content">
          <div className="sd-hero-icon">
            <i className={solution.icon}></i>
          </div>
          <h1 className="sd-hero-title">{solution.title}</h1>
          <p className="sd-hero-subtitle">{solution.heroDesc}</p>
          <div className="sd-hero-actions">
            <button onClick={() => navigate("/contact")} className="sd-btn sd-btn--primary">
              Demander une démonstration
            </button>
            <Link to="/solutions" className="sd-btn sd-btn--outline">
              ← Toutes les solutions
            </Link>
          </div>
        </div>
      </section>

      <section className="sd-details">
        <div className="sd-container">
          <div className="sd-section-title">
            <h2>Fonctionnalités détaillées</h2>
            <p>Tout ce que notre solution vous offre pour optimiser votre gestion.</p>
          </div>
          <div className="sd-details-grid">
            {solution.details.map((item, i) => (
              <article key={i} className="sd-detail-card">
                <div className="sd-detail-num">0{i + 1}</div>
                <h3>{item.title}</h3>
                <p>{item.desc}</p>
                <ul className="sd-detail-list">
                  {item.points.map((pt, j) => (
                    <li key={j}><i className="fas fa-check-circle"></i> {pt}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="sd-benefits">
        <div className="sd-container">
          <div className="sd-section-title">
            <h2>Pourquoi choisir cette solution ?</h2>
            <p>Des avantages concrets pour votre entreprise.</p>
          </div>
          <div className="sd-benefits-grid">
            {solution.benefits.map((b, i) => (
              <div key={i} className="sd-benefit-item">
                <i className="fas fa-check-circle" style={{ color: solution.color }}></i>
                <span>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="sd-cta" style={{ background: solution.gradient }}>
        <div className="sd-container sd-cta-content">
          <h2>Prêt à adopter {solution.title} ?</h2>
          <p>Contactez nos experts pour une démonstration personnalisée et un devis gratuit.</p>
          <div className="sd-cta-actions">
            <button onClick={() => navigate("/contact")} className="sd-btn sd-btn--white">
              Prendre rendez-vous
            </button>
            <a href="tel:+22870738319" className="sd-btn sd-btn--ghost">
              <i className="fas fa-phone"></i> +228 70 73 83 19
            </a>
          </div>
        </div>
      </section>

      <section className="sd-other">
        <div className="sd-container">
          <div className="sd-section-title">
            <h2>Autres solutions</h2>
            <p>Découvrez nos autres univers de solutions de gestion.</p>
          </div>
          <div className="sd-other-grid">
            {otherSolutions.map(s => (
              <Link key={s.id} to={`/solutions/${s.id}`} className="sd-other-card">
                <div className="sd-other-icon" style={{ color: s.color, background: `${s.color}15` }}>
                  <i className={s.icon}></i>
                </div>
                <h3>{s.title}</h3>
                <p>{s.subtitle}</p>
                <span className="sd-other-link">Voir les détails →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
