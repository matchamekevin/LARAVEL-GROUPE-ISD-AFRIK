const FALLBACK_IMAGE = "/images/produits/proj.webp";

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
      "Surveillez, protegez, rassurez. Nos solutions de videosurveillance modernes vous permettent de garder un oeil sur vos locaux depuis n'importe ou.",
    image: "/images/produits/proj.webp",
    details:
      "Nous concevons des architectures de video protection robustes avec enregistrement centralise, acces distant securise, analytics video et retention conforme a vos obligations legales et reglementaires.",
    services: [
      "Audit de securite et etude des zones a couvrir",
      "Conception et dimensionnement du systeme (camera, NVR, stockage)",
      "Installation de cameras IP, cablage et infrastructure reseau",
      "Configuration du VMS et acces distant securise",
      "Parametrage de la detection intelligente (mouvement, intrusion, perimetre)",
      "Supervision en temps reel et maintenance preventive",
      "Formation des equipes a l'exploitation du systeme",
      "Extension et mise a niveau du parc existant",
    ],
    deliverables: [
      "Plan de couverture et schema d'implantation des cameras",
      "Plan de cablage et architecture reseau",
      "Politique de conservation et de gestion des enregistrements",
      "Guide d'utilisation du VMS et procedure d'exploitation",
      "Rapport d'audit et preconstations de securite",
    ],
    technologies: [
      "Cameras IP (fixe, PTZ, thermique, 360)",
      "NVR / DVR / Serveur VMS",
      "Analytics video (IA, detection visage, lecture plaques)",
      "PoE / Switch reseau / Fibre optique",
      "Stockage NAS / SAN / Cloud",
      "Acces distant VPN / Application mobile",
    ],
  },
  {
    slug: "securite-informatique-base-de-donnees",
    title: "Securite informatique & base de donnees",
    description:
      "Protegez vos donnees, assurez la continuite de vos activites. Nous offrons des solutions de securite informatique de pointe.",
    image: "/images/produits/int.webp",
    details:
      "Nous mettons en place une defense multicouche incluant durcissement des systemes, sauvegardes testees, supervision continue et plans de reprise d'activite pour garantir l'integrite et la disponibilite de vos donnees critiques.",
    services: [
      "Audit de vulnerabilites et test d'intrusion (pentest)",
      "Durcissement des systemes (serveurs, postes, applications)",
      "Mise en place de firewall, EDR/XDR et SIEM",
      "Segmentation reseau et controle d'acces (PIM/PAM)",
      "Sauvegarde et plan de reprise d'activite (PRA/PCA)",
      "Protection des bases de donnees (SQL, NoSQL) et chiffrement",
      "Sensibilisation et formation aux risques cyber",
      "Gestion des correctifs et maintenance securite continue",
    ],
    deliverables: [
      "Rapport d'audit et matrice des risques",
      "Plan de remediation et feuille de route securite",
      "Guide de durcissement des systemes",
      "Procedure de gestion d'incident et runbook",
      "Plan de sauvegarde et de reprise (PRA/PCA)",
    ],
    technologies: [
      "EDR / XDR (CrowdStrike, SentinelOne, Defender)",
      "SIEM (Splunk, Wazuh, ELK)",
      "Firewall (Fortinet, pfSense, Palo Alto)",
      "WAF / Proxy / Reverse Proxy",
      "Sauvegarde (Veeam, Acronis, Backup Exec)",
      "Gestion d'acces (Active Directory, LDAP, IAM)",
      "Chiffrement (TLS, AES, BitLocker)",
    ],
  },
  {
    slug: "conception-hebergement-site-internet",
    title: "Conception & hebergement site internet",
    description:
      "Creez une presence en ligne captivante et fiable. Notre equipe concoit des sites web modernes, intuitifs et adaptes a vos besoins.",
    image: "/images/produits/tpe2.webp",
    details:
      "Du cadrage fonctionnel au deploiement, nous livrons des sites vitrines, institutionnels ou transactionnels avec une architecture scalable, un design sur mesure et une orientation conversion.",
    services: [
      "Audit des besoins et cadrage fonctionnel du projet",
      "Conception UX/UI et maquettage des interfaces",
      "Developpement front-end (React, Vue, Tailwind)",
      "Developpement back-end (API, base de donnees, CMS)",
      "Integration de contenu et参考ement SEO",
      "Mise en place de l'hebergement, nom de domaine et SSL",
      "Optimisation des performances (vitesse, cache, CDN)",
      "Formation et accompagnement a la gestion du site",
      "Maintenance evolutive et corrective",
    ],
    deliverables: [
      "Charte graphique et maquettes validees",
      "Code source versionne (Git) et documente",
      "Guide d'utilisation et documentation technique",
      "Plans de maintenance et d'evolution",
      "Rapports de performance et d'audit SEO",
    ],
    technologies: [
      "Laravel / Symfony / Node.js",
      "React / Vue.js / Next.js / Nuxt.js",
      "CMS (WordPress, Strapi, Drupal)",
      "Base de donnees (MySQL, PostgreSQL, MongoDB)",
      "Nginx / Apache / Docker",
      "CDN (Cloudflare, AWS CloudFront)",
      "SSL / HTTPS / Securite Web",
      "SEO (Schema.org, Lighthouse, Analytics)",
    ],
  },
  {
    slug: "controle-acces",
    title: "Controle d'acces",
    description:
      "Maitrisez l'acces a vos locaux en toute securite. Nos systemes de controle d'acces modernes vous permettent de gerer et restreindre les entrees.",
    image: "/images/produits/drone1.webp",
    details:
      "Nous integrons des dispositifs de controle d'acces adaptables aux exigences de surete, avec tracabilite des passages, gestion centralisee des habilitations et orchestration multi-sites.",
    services: [
      "Etude des flux et des zones de securite",
      "Conception du schema d'acces (portes, badges, biometrie)",
      "Installation de lecteurs, controleurs et serrures electriques",
      "Deploiement de badges, cartes RFID et lecteurs biometriques",
      "Configuration du logiciel de gestion des habilitations",
      "Integration avec la videosurveillance et les alarmes",
      "Formation des administrateurs et utilisateurs",
      "Maintenance preventive et depannage",
    ],
    deliverables: [
      "Schema d'architecture surete et plan de zonage",
      "Matrice des habilitations et profils d'acces",
      "Guide d'administration du systeme",
      "Procedure d'audit des acces et tracabilite",
      "Plan de maintenance et inventaire des equipements",
    ],
    technologies: [
      "Badges RFID / NFC / MIFARE",
      "Biometrie (empreinte, reconnaissance faciale)",
      "Controleurs IP (Paxton, Lenel, Axis)",
      "Serrures electriques et gaches",
      "Interphonie IP / Visiophonie",
      "IAM physique et middleware d'integration",
    ],
  },
  {
    slug: "archivage-numerique",
    title: "Archivage numerique",
    description:
      "Simplifiez la gestion de vos informations et optimisez votre productivite. Nos solutions d'archivage numerique et de GED transforment votre documentation.",
    image: "/images/produits/int.webp",
    details:
      "Nous deployons des plateformes GED orientees conformite et continuite d'exploitation pour reduire les risques de perte d'information, avec indexation intelligente et recherche rapide.",
    services: [
      "Audit des processus documentaires et besoins d'archivage",
      "Numerisation de masse et traitement OCR",
      "Conception du plan de classement et indices de gestion",
      "Mise en place d'une plateforme GED/ECM",
      "Politique de conservation, cycle de vie et destruction controlee",
      "Gestion des droits d'acces et tracabilite des consultations",
      "Formation a l'utilisation de la GED",
      "Migration et reprise de donnees existantes",
    ],
    deliverables: [
      "Plan de classement cible et arbre documentaire",
      "Regles d'archivage par typologie documentaire",
      "Guide d'exploitation et procedure d'utilisation",
      "Rapport de numerisation et controle qualite",
      "Politique de conservation et destruction",
    ],
    technologies: [
      "GED (Alfresco, DocuWare, OnlyOffice)",
      "OCR / ICR (Tesseract, ABBYY)",
      "NAS / SAN / Stockage Cloud",
      "Signature electronique (DocuSign, Universign)",
      "Base de donnees d'indexation",
      "Chiffrement des documents au repos",
    ],
  },
  {
    slug: "materiels-informatiques",
    title: "Materiels informatiques",
    description:
      "Tout ce dont vous avez besoin pour equiper votre entreprise en technologie. Large gamme de materiel et consommables informatiques professionnels.",
    image: "/images/produits/drone1.webp",
    details:
      "Nous accompagnons le cycle complet: sourcing, standardisation du parc, installation, support et renouvellement planifie pour optimiser votre investissement IT.",
    services: [
      "Audit du parc existant et definition des besoins",
      "Standardisation et selection des equipements",
      "Preparation, image systeme et configuration",
      "Deploiement et installation sur site",
      "Maintenance preventive et corrective",
      "Gestion des stocks et pieces de rechange (spare)",
      "Recyclage et renouvellement du materiel",
      "Support technique N1/N2/N3",
    ],
    deliverables: [
      "Inventaire du parc et etiquette",
      "Dossier de reference materiel par type",
      "Catalogue des configurations standards",
      "Plan de maintenance et SLA",
      "Rapport d'audit et preconstations de renouvellement",
    ],
    technologies: [
      "Postes de travail (PC, station, portable, ecrans)",
      "Serveurs (rack, tower, blade)",
      "Peripheriques (imprimante, scanner, onduleur)",
      "Switch / Routeur / Point d'acces WiFi",
      "Virtualisation (VMware, Proxmox, Hyper-V)",
      "MDM (Intune, Jamf, MobileIron)",
      "ITSM (GLPI, ServiceNow)",
    ],
  },
  {
    slug: "reseau-informatique",
    title: "Reseau informatique",
    description:
      "Connectez votre entreprise avec fiabilite et efficacite. Nous concevons, installons et optimisons vos infrastructures reseau pour une communication fluide.",
    image: "/images/produits/proj.webp",
    details:
      "Nous construisons des infrastructures resilientes avec segmentation, qualite de service et observabilite pour supporter vos applications critiques et garantir la continuite de vos operations.",
    services: [
      "Audit de performance et cartographie du reseau existant",
      "Conception de l'architecture (LAN, WAN, WiFi)",
      "Cablage structure cuivre et fibre optique",
      "Installation et configuration des equipements actifs",
      "Segmentation VLAN, QoS et politiques de securite",
      "Mise en place de VPN et acces distants",
      "Supervision et monitoring des infrastructures",
      "Maintenance preventive et evolution",
    ],
    deliverables: [
      "Schema logique et physique du reseau (HLD/LLD)",
      "Plan d'adressage IP et nomenclature",
      "Runbook d'exploitation NOC",
      "Rapport d'audit et plan d'amelioration",
      "Plan de cablage et test de certification",
    ],
    technologies: [
      "Fibre optique / Cuivre (Cat6, Cat7)",
      "Switch gere / manageable (Cisco, HP Aruba, Ubiquiti)",
      "Routeur / Firewall (MikroTik, pfSense)",
      "WiFi (Aruba, Unifi, Meraki)",
      "NMS (Nagios, Zabbix, PRTG)",
      "VPN (IPSec, OpenVPN, WireGuard)",
      "QoS / VLAN / STP / OSPF / BGP",
    ],
  },
  {
    slug: "incendie",
    title: "Incendie",
    description:
      "Protegez vos installations avec des solutions de securite incendie adaptees et fiables. Systemes de detection, d'alarme et d'extinction.",
    image: "/images/produits/ond.webp",
    details:
      "Nos equipes implementent des dispositifs conformes aux normes applicables, avec maintenance reglementaire et tests periodiques pour garantir la securite des personnes et des biens.",
    services: [
      "Analyse de risque incendie et conception SSI",
      "Pose de detecteurs de fumee, chaleur et gaz",
      "Installation de centrales de mise en securite incendie (CMSI)",
      "Mise en place d'alarmes sonores et visuelles",
      "Installation de RIA et extincteurs",
      "Maintenance reglementaire et verifications periodiques",
      "Formation des equipes d'evacuation et consignes de securite",
      "Mise a jour du registre de securite",
    ],
    deliverables: [
      "Plan de securite incendie et notices techniques",
      "Registre de securite et suivi des maintenances",
      "Compte-rendu de tests et verifications periodiques",
      "Procedure d'evacuation et consignes de securite",
      "Attestations de conformite et rapports de controle",
    ],
    technologies: [
      "SSI (Systeme de Securite Incendie)",
      "Detecteurs (fumee, chaleur, gaz, lineaire)",
      "CMSI (Centrale de Mise en Securite Incendie)",
      "Alarme sonore / flash lumineux",
      "RIA (Robinets Incendie Armes)",
      "Extincteurs (CO2, poudre, eau)",
      "Desenfumage",
    ],
  },
  {
    slug: "energie",
    title: "Energie",
    description:
      "Alimentez vos installations avec des solutions energetiques fiables et durables. Installation d'onduleurs, groupes electrogenes, solaire et supervision.",
    image: "/images/produits/tpe1.webp",
    details:
      "Nous dimensionnons des chaines d'alimentation fiables pour environnements IT et industriels, avec supervision energetique et optimisation de la consommation pour reduire les couts et l'impact environnemental.",
    services: [
      "Audit energetique et etude de charge",
      "Dimensionnement de l'alimentation (UPS, groupe electrogene)",
      "Installation d'onduleurs et batteries de secours",
      "Mise en place de groupes electrogenes et ATS",
      "Solution solaire hybride et optimisation consommation",
      "Supervision energetique et suivi metrique",
      "Maintenance preventive des chaines d'alimentation",
      "Plan de continuite de service electrique",
    ],
    deliverables: [
      "Bilan de puissance et schema unifilaire",
      "Plan de continuite de service electrique",
      "Rapport de performance energetique",
      "Guide d'exploitation et de maintenance",
      "Plan de maintenance preventive",
    ],
    technologies: [
      "UPS / Onduleur (APC, Eaton, Schneider)",
      "Groupe electrogene",
      "ATS (Automatic Transfer Switch)",
      "Batteries Lithium-ion / AGM",
      "Panneaux solaires PV / MPPT",
      "Supervision (SNMP, Modbus, BMS)",
      "Compteur intelligent (Smart Meter)",
    ],
  },
  {
    slug: "telecommunications",
    title: "Telecommunications",
    description:
      "Restez connecte partout et tout le temps. Solutions de telecommunication avancees pour la voix, la data et la connectivite d'entreprise.",
    image: "/images/produits/tpe2.webp",
    details:
      "Nous mettons en place des environnements de communication fiables, interoperables et securises pour les operations quotidiennes, avec supervision de la qualite de service et support N2/N3.",
    services: [
      "Audit de l'infrastructure telecom existante",
      "Conception de l'architecture voix et donnees",
      "Installation d'IPBX et trunk SIP",
      "Deploiement de terminaux VoIP et softphones",
      "Mise en place de liaisons dediees (fibre, SDSL, 4G/5G)",
      "Solution de visioconference et collaboration",
      "Supervision de la qualite de service (QoS)",
      "Support et maintenance N2/N3",
    ],
    deliverables: [
      "Plan de numerotation et routage d'appels",
      "Schema d'infrastructure telecom",
      "Dossier d'exploitation et procedures",
      "Plan de continuite des communications",
      "Rapport de qualite de service et recommandations",
    ],
    technologies: [
      "IPBX (Asterisk, 3CX, FreePBX)",
      "VoIP / SIP Trunk",
      "Terminaux VoIP (Yealink, Snom, Poly)",
      "Visioconference (Teams, Zoom, Jitsi)",
      "Fibre optique / SDSL / LTE 4G/5G",
      "QoS / ToS / DSCP",
      "SBC (Session Border Controller)",
    ],
  },
  {
    slug: "intelligence-artificielle",
    title: "Intelligence artificielle",
    description:
      "Transformez vos donnees en opportunites avec nos solutions d'intelligence artificielle. Automatisation, prediction, analyse video et aide a la decision.",
    image: "/images/produits/drone.webp",
    details:
      "Nous industrialisons des cas d'usage IA avec gouvernance des donnees, MLOps et indicateurs de valeur afin d'assurer un impact mesurable et un retour sur investissement concret.",
    services: [
      "Identification et priorisation des cas d'usage metier",
      "Audit et preparation des donnees (collecte, nettoyage, labeling)",
      "Conception et entrainement de modeles ML/DL",
      "Mise en production et deploiement (MLOps)",
      "Analyse video intelligente (reconnaissance d'objets, tracking)",
      "Traitement automatique du langage (NLP) et chatbots",
      "Tableaux de bord et monitoring des performances",
      "Transfert de competences et accompagnement des equipes",
    ],
    deliverables: [
      "Dossier de cadrage et priorisation des cas d'usage",
      "Pipeline de donnees et notebook de modelisation",
      "Modele entraine et deploye avec API",
      "Guide d'utilisation et documentation technique",
      "Tableau de bord de suivi des KPI et derive du modele",
    ],
    technologies: [
      "Python / R / Julia",
      "TensorFlow / PyTorch / Keras",
      "Scikit-learn / XGBoost / LightGBM",
      "NLP (Hugging Face, spaCy, NLTK)",
      "Computer Vision (OpenCV, YOLO, Detectron2)",
      "MLOps (MLflow, Kubeflow, Docker)",
      "Cloud (AWS SageMaker, GCP AI, Azure ML)",
    ],
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
  image: item.image || "",
  services: Array.isArray(item.services) ? item.services : [],
  deliverables: Array.isArray(item.deliverables) ? item.deliverables : [],
  technologies: Array.isArray(item.technologies) ? item.technologies : [],
});

export const resolveIngenierieDomaines = (categories = [], options = {}) => {
  const { fallbackToDefaults = true, includeBaseImageFallback = true } = options || {};
  const roots = (Array.isArray(categories) ? categories : [])
    .filter((category) => !category?.parent_id && category?.actif !== false)
    .sort((a, b) => {
      const orderA = Number(a?.ordre ?? 0);
      const orderB = Number(b?.ordre ?? 0);
      if (orderA !== orderB) return orderA - orderB;
      return String(a?.nom || "").localeCompare(String(b?.nom || ""), "fr", { sensitivity: "base" });
    });

  if (!roots.length) {
    return fallbackToDefaults ? INGENIERIE_DEFAULT_DOMAINES.map(withDefaults) : [];
  }

  const stripNumbers = (str) => str.replace(/-?\d+$/, "");
  const stripStopWords = (str) => str.replace(/-(de|du|des|le|la|les|l|d|a|au|aux|en|et|ou)-/g, "-").replace(/^-(de|du|des|le|la|les|l|d|a|au|aux|en|et|ou)-/g, "");
  const normalizeForMatch = (str) => stripStopWords(stripNumbers(str));

  const findMatchingDefault = (slug, categoryName) => {
    if (DEFAULT_BY_SLUG[slug]) return DEFAULT_BY_SLUG[slug];
    const match = Object.keys(DEFAULT_BY_SLUG).find(
      (key) => slug.includes(key) || key.includes(slug)
    );
    if (match) return DEFAULT_BY_SLUG[match];
    const normalized = normalizeForMatch(slug);
    if (normalized !== slug) {
      const fuzzy = Object.keys(DEFAULT_BY_SLUG).find(
        (key) => normalizeForMatch(key) === normalized
      );
      if (fuzzy) return DEFAULT_BY_SLUG[fuzzy];
    }
    if (categoryName) {
      const nameSlug = normalizeSlug(categoryName);
      if (DEFAULT_BY_SLUG[nameSlug]) return DEFAULT_BY_SLUG[nameSlug];
      const nameMatch = Object.keys(DEFAULT_BY_SLUG).find(
        (key) => nameSlug.includes(key) || key.includes(nameSlug) || normalizeForMatch(key) === normalizeForMatch(nameSlug)
      );
      if (nameMatch) return DEFAULT_BY_SLUG[nameMatch];
    }
    return null;
  };

  const coveredDefaultSlugs = new Set();

  const mapped = roots
    .map((category) => {
      const slug = category?.slug || normalizeSlug(category?.nom);
      const base = findMatchingDefault(slug, category?.nom) || {};
      if (base.slug) coveredDefaultSlugs.add(base.slug);
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
        image: appendVersionToImage(
          category?.image_url || category?.image || (includeBaseImageFallback ? base.image || FALLBACK_IMAGE : ""),
          category?.updated_at || category?.created_at || ""
        ),
        ...(!includeBaseImageFallback && (category?.image_url || category?.image) ? {} : !includeBaseImageFallback ? { image: "" } : {}),
        details:
          String(meta?.details || "").trim() ||
          base.details ||
          category?.description ||
          "Nos equipes construisent une reponse complete: audit, conception, deploiement, exploitation et evolution.",
        services: childServices.length ? childServices : normalizeList(meta?.services).length ? normalizeList(meta?.services) : base.services || [],
        deliverables: normalizeList(meta?.deliverables).length ? normalizeList(meta?.deliverables) : base.deliverables || [],
        technologies: normalizeList(meta?.technologies).length ? normalizeList(meta?.technologies) : base.technologies || [],
      });
    })
    .filter((item) => {
      const matchesDefault = INGENIERIE_DEFAULT_DOMAINES.some(
        (d) => d.slug === item.slug || item.slug?.includes(d.slug) || d.slug?.includes(item.slug || '') ||
          normalizeForMatch(d.slug) === normalizeForMatch(item.slug || '')
      );
      return matchesDefault;
    });

  for (const defaultDomain of INGENIERIE_DEFAULT_DOMAINES) {
    if (!coveredDefaultSlugs.has(defaultDomain.slug)) {
      mapped.push(withDefaults({ ...defaultDomain, image: includeBaseImageFallback ? defaultDomain.image || FALLBACK_IMAGE : (defaultDomain.image || "") }));
    }
  }

  return mapped;
};
