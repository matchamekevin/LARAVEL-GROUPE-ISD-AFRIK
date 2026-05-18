import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/formation.css';
import { getApiBase } from '../utils/apiBase';

// Icônes SVG
const GraduationCapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
    <path d="M6 12v5c3 3 9 3 12 0v-5"/>
  </svg>
);

const UsersIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);

const BuildingIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
    <path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/>
  </svg>
);

const ArrowRightIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="5" y1="12" x2="19" y2="12"/>
    <polyline points="12 5 19 12 12 19"/>
  </svg>
);

const BookOpenIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/>
    <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>
  </svg>
);

const TrophyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/>
    <path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/>
    <path d="M4 22h16"/>
    <path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/>
    <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/>
    <path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/>
  </svg>
);

const TargetIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <circle cx="12" cy="12" r="6"/>
    <circle cx="12" cy="12" r="2"/>
  </svg>
);

const ZapIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
  </svg>
);

const CheckCircleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
    <polyline points="22 4 12 14.01 9 11.01"/>
  </svg>
);

const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10"/>
    <polyline points="12 6 12 12 16 14"/>
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
  </svg>
);

const AwardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="8" r="7"/>
    <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
  </svg>
);

const SparklesIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M12 3v18M3 12h18M5.6 5.6l12.8 12.8M5.6 18.4L18.4 5.6"/>
  </svg>
);

const Formations = () => {
  const navigate = useNavigate();
  const [categoryImages, setCategoryImages] = useState({});

  // Charger les images de catégories depuis l'API
  useEffect(() => {
    const fetchCategoryImages = async () => {
      try {
        const backendBase = getApiBase();
        const response = await fetch(`${backendBase}/api/formations/categories/images`);
        const images = await response.json();

        // Organiser les images par imageable_id
        const imagesMap = {};
        // si l'API retourne des chemins relatifs (p.ex. '/uploads/...'),
        // préfixer avec l'URL backend (configurable via env) pour éviter
        // des requêtes inconsistantes en dev.
        images.forEach(img => {
          let url = img.url;
          if (url && url.startsWith('/')) {
            url = backendBase + url;
          } else if (url && /^https?:\/\//i.test(url)) {
            try {
              const parsed = new URL(url);
              url = backendBase + parsed.pathname;
            } catch (_) {
              // keep original URL if parsing fails
            }
          }
          if (img.imageable_id === 1) imagesMap.etudiant = url;
          if (img.imageable_id === 2) imagesMap.particulier = url;
          if (img.imageable_id === 3) imagesMap.entreprise = url;
        });

        setCategoryImages(imagesMap);
      } catch (error) {
        console.error('Erreur chargement images catégories:', error);
      }
    };

    fetchCategoryImages();
  }, []);

  const categories = [
    {
      key: "etudiant",
      label: "Étudiants",
      icon: GraduationCapIcon,
      image: categoryImages.etudiant || "/images/home/recu/hero-13.webp",
      alt: "Formations pour étudiants",
      description: "Préparez votre avenir professionnel avec des formations certifiantes reconnues et valorisées par les entreprises du monde entier",
      highlights: [
        "Certifications internationales reconnues",
        "Stages pratiques en entreprise inclus",
        "Accès illimité aux ressources 24/7",
        "Aide à l'insertion professionnelle"
      ],
      stats: { courses: "50+", success: "96%" }
    },
    {
      key: "particulier",
      label: "Particuliers",
      icon: UsersIcon,
      image: categoryImages.particulier || "/images/home/recu/hero-13.webp",
      alt: "Formations pour particuliers",
      description: "Développez vos compétences professionnelles et personnelles à votre rythme avec un accompagnement sur mesure et adapté",
      highlights: [
        "Horaires ultra-flexibles adaptés à votre emploi du temps",
        "Apprentissage 100% pratique et opérationnel",
        "Certification professionnelle à la clé"
      ],
      stats: { courses: "40+", success: "94%" }
    },
    {
      key: "entreprise",
      label: "Entreprises",
      icon: BuildingIcon,
      image: categoryImages.entreprise || "/images/home/recu/hero-13.webp",
      alt: "Formations pour entreprises",
      description: "Boostez la performance et la productivité de vos équipes avec des solutions de formation innovantes, sur mesure et adaptées à vos enjeux",
      highlights: [
        "Formations intra-entreprise personnalisées",
        "Programmes 100% adaptés à vos besoins spécifiques",
        "Certification collective de vos collaborateurs"
      ],
      stats: { courses: "60+", success: "98%" }
    }
  ];

  const features = [
    { icon: TargetIcon, title: "Objectifs clairs", desc: "Parcours définis pour réussir" },
    { icon: TrophyIcon, title: "Certifications", desc: "Diplômes reconnus mondialement" },
    { icon: ZapIcon, title: "80% Pratique", desc: "Apprentissage par l'action" },
    { icon: BookOpenIcon, title: "Contenus actuels", desc: "Mis à jour régulièrement" }
  ];

  const stats = [
    { icon: BookOpenIcon, value: "150+", label: "Formations disponibles" },
    { icon: UsersIcon, value: "5000+", label: "Apprenants formés" },
    { icon: AwardIcon, value: "95%", label: "Taux de réussite" },
    { icon: StarIcon, value: "4.8/5", label: "Satisfaction clients" }
  ];

  const handleNavigate = (categoryKey) => {
    navigate(`/formations/${categoryKey}`);
  };

  return (
    <div className="formations-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-pattern"></div>
          <div className="hero-dots"></div>
          <div className="hero-glow"></div>
          <div className="hero-glow-secondary"></div>
        </div>

        <div className="hero-content">
          <div className="hero-badge">
            <SparklesIcon />
            <span>Plus de 5000 apprenants formés avec succès depuis 2014</span>
          </div>

          <h1 className="hero-title">
            <span className="title-main">Nos Formations</span>
            <span className="title-accent">Professionnelles</span>
          </h1>

          <p className="hero-subtitle">
            Investissez dans votre avenir avec des formations de qualité supérieure, 
            conçues par des experts et adaptées à vos besoins et objectifs professionnels
          </p>

          <div className="hero-features">
            {features.map((feature, idx) => {
              const Icon = feature.icon;
              return (
                <div key={idx} className="hero-feature-card">
                  <div className="feature-icon-wrapper">
                    <div className="feature-icon">
                      <Icon />
                    </div>
                  </div>
                  <h3>{feature.title}</h3>
                  <p>{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="hero-wave">
          <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="#0f1829"/>
          </svg>
        </div>
      </section>

      {/* Categories Section */}
      <section className="categories-section">
        <div className="section-header">
          <div className="section-badge">Nos Parcours de Formation</div>
          <h2 className="section-title">
            Choisissez Votre <span className="text-highlight">Parcours Idéal</span>
          </h2>
          <div className="title-underline"></div>
          <p className="section-subtitle">
            Des formations adaptées à chaque profil pour développer vos compétences et atteindre vos objectifs professionnels
          </p>
        </div>

        <div className="categories-grid">
          {categories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div
                key={category.key}
                className="category-card"
                onClick={() => handleNavigate(category.key)}
              >
                <div className="card-image-container">
                  <img src={category.image} alt={category.alt} className="card-image" />
                  <div className="card-overlay"></div>
                </div>

                <div className="card-icon-badge">
                  <Icon />
                </div>

                <div className="card-count-badge">
                  <span className="badge-number">{category.stats.courses}</span>
                  <span className="badge-text">formations</span>
                </div>

                <div className="card-content">
                  <h3 className="card-title">{category.label}</h3>
                  <p className="card-description">{category.description}</p>

                  <div className="card-stat-single">
                    <div className="stat-icon">
                      <TrophyIcon />
                    </div>
                    <div>
                      <div className="stat-value">{category.stats.success}</div>
                      <div className="stat-label">Taux de réussite</div>
                    </div>
                  </div>

                  <div className="card-highlights">
                    {category.highlights.map((highlight, i) => (
                      <div key={i} className="highlight-item">
                        <div className="highlight-icon">
                          <CheckCircleIcon />
                        </div>
                        <span>{highlight}</span>
                      </div>
                    ))}
                  </div>

                  <button className="card-button">
                    <span>Découvrir toutes les formations</span>
                    <div className="button-icon">
                      <ArrowRightIcon />
                    </div>
                  </button>
                </div>

                <div className="card-glow"></div>
                <div className="card-shine"></div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-background">
          <div className="stats-pattern"></div>
        </div>
        <div className="stats-content">
          <h2 className="stats-title">
            Groupe ISD AFRIK en <span className="text-highlight">Chiffres</span>
          </h2>
          <div className="stats-grid">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="stat-card">
                  <div className="stat-card-icon">
                    <Icon />
                  </div>
                  <div className="stat-card-value">{stat.value}</div>
                  <div className="stat-card-label">{stat.label}</div>
                  <div className="stat-card-decoration"></div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-background">
          <div className="cta-pattern"></div>
          <div className="cta-glow"></div>
        </div>
        <div className="cta-content">
          <div className="cta-icon">
            <SparklesIcon />
          </div>
          <h2 className="cta-title">Besoin d'un Conseil Personnalisé ?</h2>
          <p className="cta-subtitle">
            Notre équipe d'experts est à votre disposition pour vous accompagner dans le choix 
            de votre formation idéale et répondre à toutes vos questions
          </p>
          <button className="cta-button" onClick={() => navigate('/contact')}>
            <span>Contactez-nous maintenant</span>
            <div className="cta-button-icon">
              <ArrowRightIcon />
            </div>
          </button>
          <p className="cta-info">Réponse sous 24h • Devis gratuit • Sans engagement</p>
        </div>
      </section>
    </div>
  );
};

export default Formations;