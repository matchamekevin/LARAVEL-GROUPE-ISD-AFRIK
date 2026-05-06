const FALLBACK_IMAGE = "/images/prestations/default.jpg";

const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const INGENIERIE_DEFAULT_DOMAINES = [
  {
    slug: "video-surveillance",
    title: "Video surveillance",
    description:
      "Etude, installation et supervision de systemes de video surveillance IP pour sites sensibles, commerces et infrastructures.",
    image: "/images/produits/proj.webp",
    details:
      "Nous concevons des architectures de video protection robustes avec enregistrement centralise, acces distant securise, analytics video et retention conforme a vos obligations.",
    services: [
      "Audit de couverture et positionnement des cameras",
      "Installation NVR, VMS et stockage redondant",
      "Detection intelligente (intrusion, mouvement, perimetre)",
      "Supervision en temps reel et maintenance preventive",
    ],
    deliverables: [
      "Plan de camera et plan de cablage",
      "Politique de retention et journalisation",
      "Procedure d'exploitation et guide utilisateur",
    ],
    technologies: ["Cameras IP", "NVR/VMS", "PoE", "Analyse video IA"],
  },
  {
    slug: "securite-informatique-base-de-donnees",
    title: "Securite informatique & base de donnees",
    description:
      "Protection des postes, serveurs, reseaux et donnees critiques avec controles preventifs et capacites de reponse rapide.",
    image: "/images/produits/int.webp",
    details:
      "Nous mettons en place une defense multicouche incluant durcissement des systemes, sauvegardes teste es, supervision continue et plans de reprise d'activite.",
    services: [
      "Audit de vulnerabilites et tests de conformite",
      "Segmentation, firewall, EDR et controle des acces",
      "Protection et sauvegarde des bases SQL/NoSQL",
      "PCA/PRA et procedure de gestion d'incident",
    ],
    deliverables: [
      "Rapport d'audit priorise",
      "Plan de remediations et feuille de route",
      "Runbook de restauration et reprise",
    ],
    technologies: ["EDR", "SIEM", "WAF", "Sauvegarde immutable"],
  },
  {
    slug: "conception-hebergement-site-internet",
    title: "Conception & hebergement site internet",
    description:
      "Creation de plateformes web professionnelles, securisees et performantes, avec hebergement, monitoring et maintenance continue.",
    image: "/images/produits/tpe2.webp",
    details:
      "Du cadrage fonctionnel au deploiement, nous livrons des sites vitrines, institutionnels ou transactionnels avec une architecture scalable et orientee conversion.",
    services: [
      "UX/UI, maquettage et parcours utilisateur",
      "Developpement front/back et integration CMS",
      "Hebergement, SSL, sauvegardes et supervision",
      "SEO technique, optimisation performance et support",
    ],
    deliverables: [
      "Charte de navigation et maquettes",
      "Code source versionne et documentation technique",
      "Procedure de mise en production et supervision",
    ],
    technologies: ["Laravel", "React", "Nginx", "CDN"],
  },
  {
    slug: "controle-acces",
    title: "Controle d'acces",
    description:
      "Securisation des acces physiques par badges, biometrie, interphonie IP et centralisation des habilitations.",
    image: "/images/produits/drone1.webp",
    details:
      "Nous integrons des dispositifs de controle d'acces adaptables aux exigences de surete, avec traca bilite des passages et orchestration multi-sites.",
    services: [
      "Etude des flux et zones de securite",
      "Installation lecteurs, centrales et serrures",
      "Gestion des profils et politiques d'habilitation",
      "Interconnexion avec video surveillance et alarmes",
    ],
    deliverables: [
      "Matrice des habilitations",
      "Schema d'architecture surete",
      "Procedure d'administration et d'audit",
    ],
    technologies: ["RFID", "Biometrie", "IP Door Controller", "IAM physique"],
  },
  {
    slug: "archivage-numerique",
    title: "Archivage numerique",
    description:
      "Digitalisation et conservation securisee des documents avec indexation, recherche rapide et gouvernance documentaire.",
    image: "/images/produits/int.webp",
    details:
      "Nous deployons des plateformes GED orientees conformite et continuite d'exploitation pour reduire les risques de perte d'information.",
    services: [
      "Numerisation de masse et OCR",
      "Classement, indexation et cycle de vie documentaire",
      "Mise en place GED et gestion des droits",
      "Politique de conservation et destruction controlee",
    ],
    deliverables: [
      "Plan de classement cible",
      "Regles d'archivage par typologie",
      "Guide d'exploitation GED",
    ],
    technologies: ["OCR", "GED", "NAS/SAN", "Signature electronique"],
  },
  {
    slug: "materiels-informatiques",
    title: "Materiels informatiques",
    description:
      "Fourniture, deploiement et maintenance de postes, serveurs, peripheriques et equipements IT d'entreprise.",
    image: "/images/produits/drone1.webp",
    details:
      "Nous accompagnons le cycle complet: sourcing, standardisation du parc, installation, support et renouvellement planifie.",
    services: [
      "Definition des standards postes et serveurs",
      "Preparation, image systeme et deploiement",
      "Maintenance preventive/corrective et spare",
      "Pilotage du cycle de vie des actifs",
    ],
    deliverables: [
      "Inventaire et etiquetage du parc",
      "Dossier de reference materiel",
      "Plan de maintenance et renouvellement",
    ],
    technologies: ["Windows/Linux", "Virtualisation", "MDM", "ITSM"],
  },
  {
    slug: "reseau-informatique",
    title: "Reseau informatique",
    description:
      "Conception et modernisation de reseaux LAN/WAN/Wi-Fi avec haute disponibilite, securite et supervision centralisee.",
    image: "/images/produits/proj.webp",
    details:
      "Nous construisons des infrastructures resilientes avec segmentation, qualite de service et observabilite pour supporter vos applications critiques.",
    services: [
      "Audit de performance et cartographie reseau",
      "Cablage structure, switching, routing et Wi-Fi",
      "Segmentation VLAN, VPN et politiques QoS",
      "Monitoring, alerting et maintenance proactive",
    ],
    deliverables: [
      "HLD/LLD reseau",
      "Plan d'adressage et schema logique",
      "Runbook d'exploitation NOC",
    ],
    technologies: ["Fibre", "Switch manage", "Firewall", "NMS"],
  },
  {
    slug: "incendie",
    title: "Incendie",
    description:
      "Systemes de detection, alerte et extinction pour la protection des personnes, des locaux et des actifs critiques.",
    image: "/images/produits/ond.webp",
    details:
      "Nos equipes implementent des dispositifs conformes aux normes applicables, avec maintenance reglementaire et tests periodiques.",
    services: [
      "Analyse de risque et conception SSI",
      "Pose detecteurs, centrales, alarmes et RIA",
      "Verification periodique et maintenance",
      "Formation evacuation et consignes securite",
    ],
    deliverables: [
      "Plan de securite incendie",
      "Registre de maintenance",
      "Compte-rendus de tests et essais",
    ],
    technologies: ["SSI", "Detecteurs", "Alarme sonore", "Extinction"],
  },
  {
    slug: "energie",
    title: "Energie",
    description:
      "Solutions de continuite electrique et optimisation energetique: onduleurs, groupes, solaire et supervision.",
    image: "/images/produits/tpe1.webp",
    details:
      "Nous dimensionnons des chaines d'alimentation fiables pour environments IT et industriels afin de reduire les interruptions de service.",
    services: [
      "Etude de charge et dimensionnement",
      "Integration UPS, groupe electrogene et ATS",
      "Hybridation solaire et optimisation consommation",
      "Suivi metrique et maintenance energetique",
    ],
    deliverables: [
      "Bilan de puissance et schema unifilaire",
      "Plan de continute de service electrique",
      "Rapport de performance energetique",
    ],
    technologies: ["UPS", "ATS", "Groupe electrogene", "PV/MPPT"],
  },
  {
    slug: "telecommunications",
    title: "Telecommunications",
    description:
      "Deploiement de solutions voix/data: IPBX, VoIP, liens dedies, collaboration et interconnexion multi-sites.",
    image: "/images/produits/tpe2.webp",
    details:
      "Nous mettons en place des environnements de communication fiables, interopables et securises pour les operations quotidiennes.",
    services: [
      "Etude de trafic et architecture telecom",
      "Installation IPBX, SIP trunks et terminaux",
      "Integration visioconference et collaboration",
      "Supervision qualite voix et support N2/N3",
    ],
    deliverables: [
      "Plan de numerotation et routage",
      "Dossier d'exploitation telecom",
      "Plan de continuite des communications",
    ],
    technologies: ["VoIP", "IPBX", "SIP", "QoS"],
  },
  {
    slug: "intelligence-artificielle",
    title: "Intelligence artificielle",
    description:
      "Conception de solutions IA pour automatisation, prediction, analyse video et aide a la decision metier.",
    image: "/images/produits/drone.webp",
    details:
      "Nous industrialisons des cas d'usage IA avec gouvernance des donnees, MLOps et indicateurs de valeur afin d'assurer un impact mesurable.",
    services: [
      "Identification et priorisation des cas d'usage",
      "Preparation des donnees et modelisation",
      "Mise en production, suivi et amelioration continue",
      "Transfert de competence pour vos equipes",
    ],
    deliverables: [
      "Dossier de cadrage IA",
      "Pipeline de donnees et deploiement modele",
      "Tableau de bord KPI et monitoring derive",
    ],
    technologies: ["Machine Learning", "MLOps", "NLP", "Computer Vision"],
  },
];

const DEFAULT_BY_SLUG = INGENIERIE_DEFAULT_DOMAINES.reduce((accumulator, item) => {
  accumulator[item.slug] = item;
  return accumulator;
}, {});

const parseDomainMeta = (rawValue) => {
  if (!rawValue || typeof rawValue !== "string") return {};

  try {
    const parsed = JSON.parse(rawValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};
    return parsed;
  } catch (_error) {
    return {};
  }
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => String(item || "").trim())
    .filter(Boolean);
};

const appendVersionToImage = (url, versionSeed) => {
  const source = String(url || "").trim();
  if (!source) return source;
  if (!versionSeed) return source;
  const separator = source.includes("?") ? "&" : "?";
  return `${source}${separator}v=${encodeURIComponent(String(versionSeed))}`;
};

const withDefaults = (item) => ({
  ...item,
  image: item.image || FALLBACK_IMAGE,
  services: Array.isArray(item.services) ? item.services : [],
  deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
  technologies: Array.isArray(item.technologies) ? item.technologies : [],
});

export const resolveIngenierieDomaines = (categories = []) => {
  const roots = (Array.isArray(categories) ? categories : [])
    .filter((category) => !category?.parent_id && category?.actif !== false)
    .sort((a, b) => {
      const orderA = Number(a?.ordre ?? 0);
      const orderB = Number(b?.ordre ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return String(a?.nom || "").localeCompare(String(b?.nom || ""), "fr", { sensitivity: "base" });
    });

  if (!roots.length) {
    return INGENIERIE_DEFAULT_DOMAINES.map(withDefaults);
  }

  return roots.map((category) => {
    const slug = category?.slug || normalizeSlug(category?.nom);
    const base = DEFAULT_BY_SLUG[slug] || {};
    const meta = parseDomainMeta(category?.icone);
    const children = Array.isArray(category?.children)
      ? category.children
          .filter((child) => child?.actif !== false)
          .sort((a, b) => {
            const orderA = Number(a?.ordre ?? 0);
            const orderB = Number(b?.ordre ?? 0);
            if (orderA !== orderB) return orderA - orderB;
            return String(a?.nom || "").localeCompare(String(b?.nom || ""), "fr", { sensitivity: "base" });
          })
      : [];

    const childServices = children
      .map((child) => {
        const name = String(child?.nom || "").trim();
        const desc = String(child?.description || "").trim();
        if (!name) return null;
        return desc ? `${name} - ${desc}` : name;
      })
      .filter(Boolean);

    return withDefaults({
      slug,
      title: category?.nom || base.title || "Domaine d'expertise",
      description: category?.description || base.description || "Accompagnement technique et operationnel sur mesure.",
      image: appendVersionToImage(category?.image_url || category?.image || base.image || FALLBACK_IMAGE, category?.updated_at || category?.created_at || ""),
      details:
        String(meta?.details || "").trim() ||
        base.details ||
        category?.description ||
        "Nos equipes construisent une reponse complete: audit, conception, deploiement, exploitation et evolution.",
      services: childServices.length ? childServices : normalizeList(meta?.services).length ? normalizeList(meta?.services) : base.services || [],
      deliverables: normalizeList(meta?.deliverables).length ? normalizeList(meta?.deliverables) : base.deliverables || [],
      technologies: normalizeList(meta?.technologies).length ? normalizeList(meta?.technologies) : base.technologies || [],
    });
  });
};
