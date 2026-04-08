import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/home.css";
import "../styles/why-cards-grid.css";
import "../styles/offers-cards.css";
import "../styles/geovision-categories.css";
import { getCategories, getProduits } from "../services/ProduitService";
import { getHomeMarketingCards } from "../services/HomeMarketingService";
import { getHomeTestimonials } from "../services/HomeTestimonialsService";
import { getHomeCollaborators } from "../services/HomeCollaboratorsService";
import { getHomePartners } from "../services/HomePartnersService";
import ProduitCard from "../components/ProduitCard";
import usePageMeta from "../hooks/usePageMeta";
import { pickDisplayMediaUrl } from "../utils/mediaUrl";
import {
  HOME_MARKETING_SECTIONS,
  mapFeaturedProductCard,
  mapOfferCard,
  mapPromotionCard,
  openMarketingTarget,
} from "../utils/homeMarketingCards";

export default function Home() {
  usePageMeta(
    "Groupe ISD AFRIK | Solutions technologiques en Afrique de l'Ouest",
    "Expert en solutions technologiques, securite electronique, logiciels professionnels et transformation digitale en Afrique de l'Ouest."
  );
  const navigate = useNavigate();

  function getFallbackCollaborators() {
    return [
      { img: "/images/collaborateur/col1.webp", name: "DEV 1" },
      { img: "/images/collaborateur/col2.webp", name: "DEV 2", objectPosition: 'center 0%' },
      { img: "/images/collaborateur/col3.webp", name: "DEV 3" },
      { img: "/images/collaborateur/col4.webp", name: "DEV 4" },
    ];
  }

  function getFallbackTestimonials() {
    return [
      {
        name: "Plateforme Industrielle d’Adétikopé (PIA)",
        role: "Direction Générale",
        text: "Nous avons choisi ISD AFRIK pour accompagner notre développement industriel. Leur expertise digitale nous a permis de fluidifier nos processus et de renforcer notre compétitivité.",
        rating: 5,
        avatar: "/images/avis/pia.webp",
        company: "PIA"
      },
      {
        name: "CANAL+",
        role: "Direction Technique",
        text: "ISD AFRIK est un partenaire fiable qui comprend nos enjeux. Grâce à leurs solutions, nous avons amélioré l’expérience de nos abonnés et optimisé nos opérations internes.",
        rating: 5,
        avatar: "/images/avis/canal.webp",
        company: "CANAL+"
      },
      {
        name: "Hôtel Sarakawa",
        role: "Direction Hôtelière",
        text: "Avec ISD AFRIK, nous avons modernisé notre gestion et renforcé la satisfaction de nos clients. Leur accompagnement est un vrai atout pour l’hôtellerie.",
        rating: 4,
        avatar: "/images/avis/sarakawa.webp",
        company: "Hôtel Sarakawa"
      },
      {
        name: "ASKY Airlines",
        role: "Direction des Opérations",
        text: "ISD AFRIK nous aide à digitaliser nos processus et à offrir un meilleur service à nos passagers. Leur expertise est un levier stratégique pour notre croissance panafricaine.",
        rating: 5,
        avatar: "/images/avis/asky.webp",
        company: "ASKY"
      },
      {
        name: "ORYX Energies",
        role: "Direction Commerciale",
        text: "Nous faisons confiance à ISD AFRIK pour la gestion de nos données et la digitalisation de nos services. Leur professionnalisme nous accompagne dans notre expansion.",
        rating: 5,
        avatar: "/images/avis/oryx.webp",
        company: "ORYX Energies"
      },
      {
        name: "SUNU Bank",
        role: "Direction Générale",
        text: "ISD AFRIK est un partenaire stratégique qui nous apporte des solutions fiables et sécurisées. Leur expertise renforce notre efficacité et la confiance de nos clients.",
        rating: 5,
        avatar: "/images/avis/sunu.webp",
        company: "SUNU Bank"
      }
    ];
  }

  function getFallbackPartners() {
    return [
      { img: "/images/partenaire/pat1.webp", name: "vvavesoft" },
      { img: "/images/partenaire/pat2.webp", name: "asterbox" },
      { img: "/images/partenaire/pat3.webp", name: "gynod" },
      { img: "/images/partenaire/pat4.webp", name: "dip afrique" },
      { img: "/images/partenaire/pat5.webp", name: "dylog" },
      { img: "/images/partenaire/pat6.webp", name: "lacsoft" },
      { img: "/images/partenaire/pat7.webp", name: "orchestra" },
      { img: "/images/partenaire/pat8.webp", name: "sage" },
      { img: "/images/partenaire/pat9.webp", name: "sensoft" },
      { img: "/images/partenaire/pat10.webp", name: "show box" },
    ];
  }
  
  const heroSlides = [
    { src: "/images/home/hero-1.webp", alt: "Ingénierie et innovation ISD AFRIK" },
    { src: "/images/home/hero-2.webp", alt: "Solutions sur mesure pour entreprises" },
    { src: "/images/home/hero-3.webp", alt: "Formation et accompagnement" },
    { src: "/images/home/hero-4.webp", alt: "Technologies avancées" },
    { src: "/images/home/hero-5.webp", alt: "Nos produits" },
    { src: "/images/home/hero-6.webp", alt: "Solutions digitales" },
    { src: "/images/home/hero-7.webp", alt: "Innovation continue" },
    { src: "/images/home/hero-8.webp", alt: "Expertise professionnelle" },
  ];
  const heroTexts = [
    { title: "Expertise et savoir-faire technologique", subtitle: "Des experts qualifiés et une parfaite maîtrise du marché africain." },
    { title: "Solutions technologiques sur mesure", subtitle: "Des solutions adaptées à vos objectifs, votre secteur et vos contraintes." },
    { title: "Large gamme de produits et services", subtitle: "Sécurité électronique, logiciels professionnels et accompagnement digital." },
    { title: "Présence régionale en Afrique de l'Ouest", subtitle: "Bénin, Togo, Niger, Côte d'Ivoire et Burkina Faso pour plus de proximité." },
    { title: "Engagement fort dans la formation", subtitle: "Des parcours pratiques pour développer les compétences technologiques." },
    { title: "Fiabilité, qualité et performance", subtitle: "Des technologies durables et reconnues pour vos opérations critiques." },
    { title: "Accompagnement personnalisé", subtitle: "Conseil, déploiement, formation et support à chaque étape de vos projets." },
    { title: "Innovation technologique continue", subtitle: "Des solutions numériques modernes pour accélérer votre transformation." },
  ];
  const [slideIndex, setSlideIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSlideIndex((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const whyUs = [
    { img: "/images/why/im1.webp", title: "Expertise et savoir-faire", link: "/details/why/expertise-savoir-faire" },
    { img: "/images/why/im2.webp", title: "Solutions sur mesure", link: "/details/why/solutions-sur-mesure" },
    { img: "/images/why/im3.webp", title: "Large gamme de services", link: "/details/why/large-gamme-services" },
    { img: "/images/why/im4.webp", title: "Présence régionale et réactivité", link: "/details/why/presence-reactivite" },
    { img: "/images/why/im5.webp", title: "Engagement envers la formation", link: "/details/why/engagement-formation" },
    { img: "/images/why/im6.webp", title: "Fiabilité et qualité", link: "/details/why/fiabilite-qualite" },
    { img: "/images/why/im7.webp", title: "Accompagnement personnalisé", link: "/details/why/accompagnement-personnalise" },
    { img: "/images/why/im8.webp", title: "Innovation continue", link: "/details/why/innovation-continue" },
  ];

  const fallbackOffers = [
    {
      title: "Gestion commerciale",
      desc: "Motivation de l'équipe commerciale dans l'atteinte des objectifs.",
      price: "Inscription ouverte",
      icon: "fas fa-chart-line",
      img: "/images/offers/offre1.webp",
      link: "/formations",
      ctaLabel: "Je profite",
    },
    {
      title: "Organisation administrative et financiere",
      desc: "Conformité au SYSCOHADA révisé et meilleure organisation administrative.",
      price: "Inscription ouverte",
      icon: "fas fa-calculator",
      img: "/images/offers/offre2.webp",
      link: "/formations",
      ctaLabel: "Je profite",
    },
    {
      title: "Paie et ressources humaines",
      desc: "Maîtrise des outils RH, optimisation du personnel et conformité sociale.",
      price: "Inscription ouverte",
      icon: "fas fa-users-cog",
      img: "/images/offers/offre3.webp",
      link: "/formations",
      ctaLabel: "Je profite",
    },
  ];

  const fallbackFeaturedProducts = [
    { title: "Solutions de gestion d'entreprise", price: "Sur mesure", img: "/images/solutions/im1.webp", category: "Logiciels", link: "/solutions", ctaLabel: "En savoir plus" },
    { title: "Formation professionnelle", price: "Certifications", img: "/images/solutions/im2.webp", category: "Formation", link: "/formations", ctaLabel: "En savoir plus" },
    { title: "Ingénierie informatique et industrielle", price: "Expertise IT", img: "/images/solutions/im3.webp", category: "Ingénierie", link: "/solutions", ctaLabel: "En savoir plus" },
    { title: "Fourniture et formation en pilotage de drones", price: "Drone Pro", img: "/images/solutions/im4.webp", category: "Drone", link: "/produits?categories=drone-formation", ctaLabel: "En savoir plus" },
  ];

  const fallbackHomePromotions = [
    { title: "Promotion Ingenierie", src: "/images/promotions/promo9.webp", link: "/produits?categories=ingenierie", ctaLabel: "Decouvrir" },
    { title: "Promotion Solutions", src: "/images/promotions/promo10.webp", link: "/solutions", ctaLabel: "Decouvrir" },
    { title: "Promotion Drone", src: "/images/promotions/promo6.webp", link: "/produits?categories=drone-formation", ctaLabel: "Decouvrir" },
  ];

  const [offers, setOffers] = useState(fallbackOffers);
  const [featuredProducts, setFeaturedProducts] = useState(fallbackFeaturedProducts);
  const [homePromotions, setHomePromotions] = useState(fallbackHomePromotions);
  const [collaborators, setCollaborators] = useState(() => getFallbackCollaborators());
  const [testimonials, setTestimonials] = useState(() => getFallbackTestimonials());
  const [partners, setPartners] = useState(() => getFallbackPartners());

  const applyMarketingCards = (items) => {
    const list = Array.isArray(items) ? items : [];

    const mappedOffers = list
      .filter((item) => item.section === HOME_MARKETING_SECTIONS.OFFER)
      .map(mapOfferCard);

    const mappedProducts = list
      .filter((item) => item.section === HOME_MARKETING_SECTIONS.FEATURED_PRODUCT)
      .map(mapFeaturedProductCard);

    const mappedHomePromotions = list
      .filter((item) => item.section === HOME_MARKETING_SECTIONS.HOME_PROMOTION)
      .map((item) => mapPromotionCard(item, "/images/promotions/promo9.webp"));

    const mappedPromotionPage = list
      .filter((item) => item.section === HOME_MARKETING_SECTIONS.PROMOTION_PAGE)
      .map((item) => mapPromotionCard(item, "/images/promotions/promo1.webp"));

    if (mappedOffers.length > 0) setOffers(mappedOffers);
    if (mappedProducts.length > 0) setFeaturedProducts(mappedProducts);
    if (mappedHomePromotions.length > 0) {
      setHomePromotions(mappedHomePromotions);
    } else if (mappedPromotionPage.length > 0) {
      setHomePromotions(mappedPromotionPage);
    }
  };

  const refreshMarketingCards = () => {
    return getHomeMarketingCards()
      .then(applyMarketingCards)
      .catch((err) => {
        console.error("Erreur chargement home marketing cards", err);
      });
  };

  const refreshCollaborators = () => {
    return getHomeCollaborators()
      .then((items) => {
        const mapped = (Array.isArray(items) ? items : [])
          .map((item) => ({
            id: item.id,
            name: item.name || '',
            img: pickDisplayMediaUrl([item.image_url, item.image_path], '/images/collaborateur/col1.webp'),
            objectPosition: item.object_position || '',
          }))
          .filter((item) => item.name && item.img);

        if (mapped.length > 0) {
          setCollaborators(mapped);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement home collaborators', err);
      });
  };

  const refreshTestimonials = () => {
    return getHomeTestimonials()
      .then((items) => {
        const mapped = (Array.isArray(items) ? items : [])
          .map((item) => ({
            id: item.id,
            name: item.name || '',
            role: item.role || '',
            company: item.company || '',
            text: item.text || '',
            rating: Math.max(1, Math.min(5, Number(item.rating || 5))),
            avatar: pickDisplayMediaUrl([item.avatar_url, item.avatar_path], '/images/avis/pia.webp'),
          }))
          .filter((item) => item.name && item.text);

        if (mapped.length > 0) {
          setTestimonials(mapped);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement home testimonials', err);
      });
  };

  const refreshPartners = () => {
    return getHomePartners()
      .then((items) => {
        const mapped = (Array.isArray(items) ? items : [])
          .map((item) => ({
            id: item.id,
            name: item.name || '',
            img: pickDisplayMediaUrl([item.image_url, item.image_path], '/images/partenaire/pat1.webp'),
          }))
          .filter((item) => item.name && item.img);

        if (mapped.length > 0) {
          setPartners(mapped);
        }
      })
      .catch((err) => {
        console.error('Erreur chargement home partners', err);
      });
  };

  useEffect(() => {
    refreshMarketingCards();
    refreshCollaborators();
    refreshTestimonials();
    refreshPartners();
  }, []);

  useEffect(() => {
    const refreshAllDynamicSections = () => {
      refreshMarketingCards();
      refreshCollaborators();
      refreshTestimonials();
      refreshPartners();
    };

    const intervalId = window.setInterval(refreshAllDynamicSections, 30000);

    const handleFocus = () => {
      refreshAllDynamicSections();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refreshAllDynamicSections();
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const inscriptionLink = "/inscription";
  const formationLink = "/formations";

  // Noms des mois en français
  const moisNoms = [
    "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
    "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
  ];
  const moisActuel = new Date().getMonth(); // 0-11
  const nomMois = moisNoms[moisActuel];
  const dernierJour = new Date(new Date().getFullYear(), moisActuel + 1, 0).getDate();

  const [promoModalIndex, setPromoModalIndex] = useState(null);

  // État pour gérer le formulaire d'avis (déclaré avant useEffect pour éviter TDZ)
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewData, setReviewData] = useState({
    name: "",
    role: "",
    company: "",
    text: "",
    rating: 5
  });

  // Bloque le scroll de la page quand une modal est ouverte (promo ou review)
  useEffect(() => {
    const open = promoModalIndex !== null || showReviewForm;
    if (open) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => { document.body.classList.remove('modal-open'); };
  }, [promoModalIndex, showReviewForm]);

  const [geovisionProducts, setGeovisionProducts] = useState([]);
  const [geovisionLoading, setGeovisionLoading] = useState(true);

  useEffect(() => {
    let active = true;
    getCategories({ segment: "geovision", tree: 1, parent_id: "null" })
      .then(async (res) => {
        const cats = res.data?.data || res.data || [];
        const filtered = cats.filter((c) => {
          const segment = (c.segment || "").toLowerCase();
          const image = (c.image || c.image_url || "").toLowerCase();
          const slug = (c.slug || "").toLowerCase();
          const name = (c.nom || "").toLowerCase();
          return (
            segment === "geovision" ||
            image.includes("geovision") ||
            slug.includes("geovision") ||
            name.includes("geovision")
          );
        });
        const ids = filtered.map((c) => c.id_categorie || c.id).filter(Boolean);
        if (ids.length > 0) {
          const resProd = await getProduits({ segment: "geovision", tri: "recent", par_page: 24 });
          const items = resProd.data?.data || [];
          if (active) setGeovisionProducts(items.slice(0, 6));
        }
      })
      .catch(() => {
        if (active) {
          setGeovisionProducts([]);
        }
      })
      .finally(() => {
        if (active) setGeovisionLoading(false);
      });
    return () => { active = false; };
  }, []);

  // GeoVision : catégories principales pour la présentation (séparées)
  const geovisionCategories = [
    { title: "Caméras", desc: "Caméras professionnelles pour la surveillance et l'analyse vidéo.", image: "/images/geovision/cam1.webp", link: "/geovision?famille=geovision-cameras" },
    { title: "Contrôle d'accès", desc: "Contrôleurs et lecteurs pour la gestion des accès sécurisés.", image: "/images/geovision/controleur1.webp", link: "/geovision?famille=geovision-controle-acces" },
    { title: "Enregistreurs", desc: "Enregistreurs (NVR/DVR) et solutions d'archivage pour la gestion vidéo.", image: "/images/geovision/nvr1.webp", link: "/geovision?famille=geovision-enregistreurs-nvr" },
    { title: "Solutions", desc: "Logiciels et services GeoVision : VMS, analytics et intégration.", image: "/images/geovision/solution1.webp", link: "/geovision?famille=geovision-vms-analytics" },
  ];

  const sectors = [
    { title: "Ingénierie informatique et industrielle", desc: "Développement, architecture système et automatisation", icon: "fas fa-laptop-code", link: "/details/sectors/ingenierie-informatique-industrielle" },
    { title: "Solutions de gestion d'entreprise", desc: "ERP, CRM, BI et workflows adaptés à votre activité", icon: "fas fa-chart-line", link: "/details/sectors/solutions-gestion-entreprise" },
    { title: "Formation professionnelle", desc: "Programmes certifiants et accompagnement personnalisé", icon: "fas fa-user-graduate", link: "/details/sectors/formation-professionnelle" },
    { title: "Communication et publicité", desc: "Solutions de communication et systèmes TPE", icon: "fas fa-satellite-dish", link: "/details/sectors/communication-publicite" },
    { title: "Fourniture de drone et formation en pilotage de drones", desc: "Équipements professionnels et formation complète", icon: "fas fa-helicopter", link: "/details/sectors/drones-pilotage" },
    { title: "Développement d'application", desc: "Sites web, applications mobiles et solutions cloud", icon: "fas fa-rocket", link: "/details/sectors/developpement-application" },
    { title: "Fourniture de TPE", desc: "Sécuriser les transactions et faciliter la gestion des encaissements", icon: "fas fa-cash-register", link: "/details/sectors/fourniture-tpe" },
    { title: "BTP & Industrie", desc: "Solutions pour le secteur du bâtiment et de l'industrie", icon: "fas fa-hard-hat", link: "/details/sectors/btp-industrie" },
  ];

  const fallbackCollaborators = getFallbackCollaborators();


  const fallbackTestimonials = getFallbackTestimonials();


  const fallbackPartners = getFallbackPartners();

  // ✅ Produits phares dynamiques (DB) avec fallback local

  const stats = [
    { number: "300+", label: "Clients satisfaits" },
    { number: "250+", label: "Projets livrés" },
    { number: "50+", label: "Experts qualifiés" },
    { number: "15+", label: "Ans d'expérience" },
  ];

  const handleReviewSubmit = (e) => {
    e.preventDefault();
    // TODO: Envoyer l'avis au backend
    console.log("Nouvel avis:", reviewData);
    alert("Merci pour votre avis ! Il sera publié après validation.");
    setShowReviewForm(false);
    setReviewData({ name: "", role: "", company: "", text: "", rating: 5 });
  };

  return (
    <div className="home">
      {/* Hero avec slides */}
      <section className="hero">
        {heroSlides.map((s, i) => (
          <img 
            key={i} 
            src={s.src} 
            alt={s.alt} 
            className={`hero-slide ${i === slideIndex ? "active" : ""}`} 
          />
        ))}
        <div className="hero-overlay" />
        <div className="hero-content">
          <style>{`
            .hero-text-anim{animation:heroTextIn 900ms ease both}
            @keyframes heroTextIn{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
            .hero-title{font-size:2.2rem;margin:0 0 8px}
            .hero-subtitle{font-size:1.05rem;opacity:0.95;margin:0}
            @media(min-width:768px){.hero-title{font-size:3rem}.hero-subtitle{font-size:1.25rem}}
          `}</style>

          {/* Texte synchronisé avec le background */}
          <div key={slideIndex} className="hero-text-anim">
            <h1 className="hero-title">{heroTexts[slideIndex]?.title}</h1>
            <p className="hero-subtitle">{heroTexts[slideIndex]?.subtitle}</p>
          </div>

          <div className="hero-buttons animate-fade-in-delay-2">
            <a href="#offers" className="btn-primary">
              <span>Nos Offres</span>
              <i className="fas fa-arrow-right"></i>
            </a>
            <a href="#products" className="btn-secondary">
              <span>Voir nos produits</span>
              <i className="fas fa-shopping-cart"></i>
            </a>
          </div>
          {/* Stats intégrés dans le hero */}
          <div className="hero-stats">
            {stats.map((stat, idx) => (
              <div key={idx} className="hero-stat-item">
                <h3 className="stat-number">{stat.number}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-indicators">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              className={`indicator ${i === slideIndex ? "active" : ""}`}
              onClick={() => setSlideIndex(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Pourquoi nous choisir */}
      <section className="why-visual">
        <div className="section-header">
          <h2>Pourquoi choisir ISD AFRIK ?</h2>
          <p>Des solutions innovantes adaptées à vos besoins</p>
        </div>
        <div className="why-cards-grid">
          {whyUs.map((item, idx) => (
            <div key={idx} className="card" onClick={() => navigate(item.link)} role="button" tabIndex={0}>
              <div className="card-image">
                <img src={item.img} alt={item.title} />
                <div className="card-overlay" />
              </div>
              <div className="card-content">
                <h3>{item.title}</h3>
                <span className="card-arrow">→</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Nos Offres */}
      <section id="offers" className="offers">
        <div className="section-header">
          <h2>Nos Offres</h2>
          <p>Des packs adaptés à tous les besoins</p>
        </div>
        <div className="cards">
          {offers.map((o, idx) => (
            <div key={idx} className="card offer-card">
              <div className="card-image">
                <img src={o.img} alt={o.title} onError={(e) => { e.target.src = "/images/offers/offre1.webp"; }} />
              </div>
              <div className="card-body">
                <h3>{o.title}</h3>
                <p>{o.desc}</p>
                <div className="price-tag">{o.price}</div>
                <button className="btn-primary" onClick={() => openMarketingTarget(navigate, o.link, formationLink)}>
                  {o.ctaLabel || "Je profite"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Promotions */}
      <section id="promotions" className="promotions">
        <div className="section-header">
          <h2>Promotion de {nomMois}</h2>
          <p>Offres exclusives valables jusqu'au {dernierJour} {nomMois.toLowerCase()}</p>
        </div>
        <div className="promo-gallery">
          {homePromotions.slice(0, 3).map((item, idx) => (
            <button
              key={idx}
              type="button"
              className="promo-image-item"
              onClick={() => { setPromoModalIndex(idx); }}
              aria-label={`Voir la promotion ${item.title || idx + 1}`}
            >
                <img
                src={item.src}
                alt={item.title || `Promo ${idx + 1}`}
                className="promo-image"
                onError={(e)=>{e.target.style.background='#eee'; e.target.src=''}}
              />
            </button>
          ))}
        </div>

        {/* Bouton pour voir toutes les promotions */}
        <div className="promo-view-all">
          <button className="btn-secondary" onClick={() => navigate('/promotions')}>
            <i className="fas fa-images"></i> Voir toutes les promotions
          </button>
        </div>

        {/* Modal for promo image */}
        {promoModalIndex !== null && (
          <div
            className="modal-overlay"
            role="dialog"
            aria-modal="true"
            aria-label={`Promotion ${promoModalIndex + 1}`}
            onKeyDown={(e) => { if (e.key === 'Escape') setPromoModalIndex(null); }}
            onClick={() => setPromoModalIndex(null)}
          >
              <div className="modal-content promo-modal" onClick={(e)=>e.stopPropagation()}>
              <button className="modal-close" onClick={() => setPromoModalIndex(null)}>
                <i className="fas fa-times"></i>
              </button>

              <div className="modal-promo-figure">
                <img
                  src={homePromotions[promoModalIndex]?.src}
                  alt={homePromotions[promoModalIndex]?.title || `Promo ${promoModalIndex+1}`}
                  className="modal-promo-img"
                  onError={(e)=>{e.target.style.background='#eee'; e.target.src=''}}
                />
              </div>

              <div className="modal-promo-actions">
                <button
                  className="btn-primary"
                  onClick={() => openMarketingTarget(navigate, homePromotions[promoModalIndex]?.link, inscriptionLink)}
                >
                  <i className="fas fa-check"></i> {homePromotions[promoModalIndex]?.ctaLabel || "Decouvrir"}
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Secteurs d'activité */}
      <section id="sectors" className="sectors">
        <div className="section-header">
          <h2>Nos secteurs d'activités</h2>
          <p>Une expertise diversifiée pour tous vos projets</p>
        </div>
        <div className="sectors-grid">
          {sectors.map((s, idx) => (
            <div key={idx} className="card sector-card">
              <div className="icon"><i className={s.icon}></i></div>
              <h3>{s.title}</h3>
              <p>{s.desc}</p>
              <button className="link" onClick={() => navigate(s.link)}>
                En savoir plus <i className="fas fa-arrow-right"></i>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* ✅ CORRIGÉ : Produits phares - tous redirigent vers leurs pages respectives */}
      <section id="products" className="products">
        <div className="section-header">
          <h2><i className="fas fa-star" style={{color:'#f59e0b',marginRight:'8px'}}></i>PRODUITS PHARES DU GROUPE ISD AFRIK</h2>
          <p>Nos solutions majeures pour votre développement</p>
        </div>
        <div className="cards">
          {featuredProducts.map((p, i) => (
            <div key={i} className="card product-card">
              <div className="product-badge">{p.category}</div>
              <div className="card-image">
                <img src={p.img} alt={p.title} />
              </div>
              <div className="card-body">
                <h3>{p.title}</h3>
                <div className="price">{p.price}</div>
                <div className="actions">
                  <button className="btn-primary" onClick={() => openMarketingTarget(navigate, p.link, "/solutions")}>
                    <i className="fas fa-info-circle"></i> {p.ctaLabel || "En savoir plus"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Devenir vendeur */}
      <section className="seller">
        <img src="/images/vendeur/vendeur.webp" alt="Devenir vendeur" className="seller-bg" />
        <div className="seller-overlay" />
        <div className="seller-content">
         
          <button className="btn-primary" onClick={() => navigate('/devenir-vendeur')}>
            Devenir vendeur
          </button>
        </div>
      </section>

      {/* Geovision */}
      <section id="geovision" className="geovision">
        {/* GeoVision Presentation */}
        <div className="geovision-presentation">
          <div className="geovision-logo-section">
            <img src="/images/geovision/logo (GEOVISION).webp" alt="GeoVision Logo" className="geovision-logo" />
          </div>
          <div className="geovision-intro">
            <h2>Représentant officiel de GeoVision en Afrique de l'Ouest</h2>
            <p>
              GeoVision est un leader mondial en solutions de vidéosurveillance et de sécurité. 
              En tant que représentant officiel, GROUPE ISD AFRIK vous propose une gamme complète de produits 
              et services pour sécuriser vos installations : cameras professionnelles haute résolution, 
              écrans de supervision, systèmes VMS, contrôle d'accès, et bien d'autres accessoires 
              professionnels. Nos experts vous accompagnent dans le choix et le déploiement de solutions 
              adaptées à vos besoins de sécurité et de surveillance.
            </p>
          </div>
        </div>

        {/* Produits GeoVision */}
        <div className="section-header" style={{ marginTop: "40px" }}>
          <h3>Nos solutions GeoVision</h3>
          <p>Explorez notre sélection de produits et services de sécurité vidéo</p>
        </div>
        <div className="geovision-categories-grid">
          {geovisionCategories.map((cat, idx) => (
            <article key={idx} className="geovision-card" onClick={() => navigate(cat.link)} role="button" tabIndex={0}>
              <div className="geovision-card-image">
                <img src={cat.image} alt={cat.title} />
              </div>
              <div className="geovision-card-body">
                <h3>{cat.title}</h3>
                <p>{cat.desc}</p>
                <button className="btn-primary" onClick={(e) => { e.stopPropagation(); navigate(cat.link); }}>
                  Explorer
                </button>
              </div>
            </article>
          ))}
        </div>
        <div className="geovision-actions">
          <button className="btn-secondary" onClick={() => navigate("/geovision")}>Voir tout Geovision</button>
        </div>
      </section>

      {/* MODIFIÉ : Avis clients avec bouton pour laisser un avis */}
      <section className="testimonials">
        <div className="section-header">
          <h2>Ce que disent nos clients</h2>
          <p>Ils nous font confiance et témoignent</p>
        </div>
        <div className="testimonials-grid">
          {testimonials.map((t, i) => (
            <div key={t.id || i} className="testimonial-card-new">
              <div className="testimonial-header">
                <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                <div className="testimonial-info">
                  <h4>{t.name}</h4>
                  <p className="testimonial-role">{t.role}</p>
                  <div className="stars">
                    {Array.from({ length: 5 }).map((_, idx) => (
                      <i key={idx} className={`fas fa-star ${idx < t.rating ? 'filled' : ''}`}></i>
                    ))}
                  </div>
                </div>
              </div>
              <p className="testimonial-text-new">"{t.text}"</p>
              <div className="testimonial-company">{t.company}</div>
            </div>
          ))}
        </div>

        {/* NOUVEAU : Bouton pour laisser un avis */}
        <div className="add-review-section">
          <button className="btn-primary" onClick={() => setShowReviewForm(!showReviewForm)}>
            <i className="fas fa-pen"></i> Laisser un avis
          </button>

          {/* Formulaire d'avis (modal amélioré) */}
          {showReviewForm && (
            <div
              className="modal-overlay"
              role="dialog"
              aria-modal="true"
              aria-labelledby="review-title"
              tabIndex={-1}
              onKeyDown={(e) => { if (e.key === 'Escape') setShowReviewForm(false); }}
              onClick={(e) => { if (e.target === e.currentTarget) setShowReviewForm(false); }}
            >
              <div className="modal-content review-modal" onClick={(e) => e.stopPropagation()} role="document">
                <div className="modal-header">
                  <h3 id="review-title">Partagez votre expérience</h3>
                  <button className="modal-close" aria-label="Fermer" onClick={() => setShowReviewForm(false)}>
                    <i className="fas fa-times"></i>
                  </button>
                </div>

                <form className="review-form" onSubmit={handleReviewSubmit}>
                  <div className="form-row">
                    <label className="visually-hidden" htmlFor="rev-name">Votre nom</label>
                    <input
                      id="rev-name"
                      type="text"
                      placeholder="Votre nom *"
                      required
                      value={reviewData.name}
                      onChange={(e) => setReviewData({ ...reviewData, name: e.target.value })}
                    />

                    <label className="visually-hidden" htmlFor="rev-role">Votre fonction</label>
                    <input
                      id="rev-role"
                      type="text"
                      placeholder="Votre fonction *"
                      required
                      value={reviewData.role}
                      onChange={(e) => setReviewData({ ...reviewData, role: e.target.value })}
                    />
                  </div>

                  <label className="visually-hidden" htmlFor="rev-company">Votre entreprise</label>
                  <input
                    id="rev-company"
                    type="text"
                    placeholder="Votre entreprise"
                    value={reviewData.company}
                    onChange={(e) => setReviewData({ ...reviewData, company: e.target.value })}
                  />

                  <label className="visually-hidden" htmlFor="rev-text">Votre avis</label>
                  <textarea
                    id="rev-text"
                    placeholder="Votre avis *"
                    required
                    rows="5"
                    value={reviewData.text}
                    onChange={(e) => setReviewData({ ...reviewData, text: e.target.value })}
                  />

                  <div className="rating-select" aria-label="Note">
                    <label>Note :</label>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <i
                        key={star}
                        role="button"
                        tabIndex={0}
                        aria-label={`${star} étoile${star > 1 ? 's' : ''}`}
                        className={`fas fa-star ${star <= reviewData.rating ? 'filled' : ''}`}
                        onClick={() => setReviewData({ ...reviewData, rating: star })}
                        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setReviewData({ ...reviewData, rating: star }); }}
                      />
                    ))}
                  </div>

                  <div className="form-actions">
                    <button type="button" className="btn-secondary" onClick={() => setShowReviewForm(false)}>
                      Annuler
                    </button>
                    <button type="submit" className="btn-primary">
                      <i className="fas fa-paper-plane"></i> Envoyer
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Collaborateurs */}
      <section className="collaborators">
        <div className="section-header">
          <h2>Nos collaborateurs prestigieux</h2>
          <p>Des partenariats de confiance avec les leaders du marché</p>
        </div>
        <div className="collaborators-grid">
          {collaborators.map((collab, i) => (
            <div key={collab.id || i} className="collaborator-card">
              <img
                src={collab.img}
                alt={collab.name}
                className="collaborator-image"
                style={collab.objectPosition ? { objectPosition: collab.objectPosition } : {}}
              />
            </div>
          ))}
        </div>
      </section>

      {/* ✅ MODIFIÉ : Partenaires en horizontal (scroll infini) */}
      <section className="partners">
        <div className="section-header">
          <h2>Nos partenaires technologiques</h2>
          <p>Nous travaillons avec les meilleures solutions du marché</p>
        </div>
        <div className="partners-horizontal">
          <div className="partners-track">
            {[...partners, ...partners].map((partner, i) => (
              <div key={i} className="partner-item">
                <img src={partner.img} alt={partner.name} />
                <h4>{partner.name}</h4>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="cta-final">
        <div className="cta-content">
          <h2 style={{ fontSize: '3.6rem' }}>Prêt à transformer votre entreprise ?</h2>
          <p>Contactez-nous dès aujourd'hui pour discuter de votre projet</p>
          <div className="cta-buttons">
            <button className="btn-secondary" onClick={() => navigate('/contact')}>
              <i className="fas fa-file-alt"></i> Nous contacter
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
