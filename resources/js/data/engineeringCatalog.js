const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

export const PRODUCT_ROOT_SLUG = "catalogue-produits-techniques";

export const PRODUCT_CATEGORY_DEFINITIONS = [
  {
    slug: "ingenierie",
    label: "Ingenierie",
    description: "Branche qui regroupe les solutions TPE et drone pour les operations terrain.",
    subcategories: [
      {
        slug: "tpe",
        label: "TPE",
        description: "Terminaux de paiement electronique fixes, mobiles et Android.",
        models: ["Ingenico Move/5000", "Verifone VX680", "PAX A920", "Sunmi P2"],
      },
      {
        slug: "drone",
        label: "Drone",
        description: "Drones pour cartographie, surveillance, securite et inspection.",
        models: ["DJI Matrice 350 RTK", "DJI Mavic 3 Enterprise", "Autel EVO II Pro", "Parrot Anafi USA"],
      },
    ],
  },
  {
    slug: "archivage-numerique",
    label: "Archivage numerique",
    description: "Numerisation, conservation et gestion documentaire pour l'entreprise.",
    subcategories: [
      {
        slug: "scanner-documentaire",
        label: "Scanner documentaire",
        description: "Scanners de production pour la numerisation de masse.",
        models: ["Fujitsu fi-8170", "Kodak Alaris S2085f", "Epson WorkForce DS-870", "Canon imageFORMULA DR-C240"],
      },
      {
        slug: "baie-nas",
        label: "Baie NAS",
        description: "Stockage NAS pour sauvegarde, archivage et partage securise.",
        models: ["Synology DS923+", "Synology DS1522+", "QNAP TS-464", "Asustor Lockerstor 4"],
      },
      {
        slug: "serveur-sauvegarde",
        label: "Serveur de sauvegarde",
        description: "Serveurs dedies a la sauvegarde des donnees critiques.",
        models: ["Dell PowerEdge R550", "HPE ProLiant DL380 Gen11", "Lenovo ThinkSystem SR630 V2", "Fujitsu PRIMERGY RX2530"],
      },
      {
        slug: "logiciel-ged",
        label: "Logiciel GED",
        description: "Plateformes de gestion electronique des documents.",
        models: ["Alfresco Content Services", "OpenText Content Suite", "M-Files", "Nuxeo Platform"],
      },
    ],
  },
  {
    slug: "materiel-informatique",
    label: "Materiel informatique",
    description: "Postes de travail, serveurs et impression pour les services IT.",
    subcategories: [
      {
        slug: "ordinateur-portable",
        label: "Ordinateur portable",
        description: "PC portables professionnels pour mobilite et bureautique avancee.",
        models: ["Dell Latitude 5540", "HP ProBook 450 G10", "Lenovo ThinkPad E14 Gen 5", "ASUS ExpertBook B1"],
      },
      {
        slug: "ordinateur-bureau",
        label: "Ordinateur de bureau",
        description: "Stations de travail et PC desktop d'entreprise.",
        models: ["Dell OptiPlex 7010", "HP ProDesk 400 G9", "Lenovo ThinkCentre M75s Gen 2", "Acer Veriton X"],
      },
      {
        slug: "serveur-rack",
        label: "Serveur rack",
        description: "Serveurs rackables pour virtualisation et applications metier.",
        models: ["Dell PowerEdge R650", "HPE ProLiant DL360 Gen10", "Lenovo ThinkSystem SR650 V2", "Fujitsu PRIMERGY RX2540 M7"],
      },
      {
        slug: "imprimante-professionnelle",
        label: "Imprimante professionnelle",
        description: "Imprimantes et multifonctions pour production bureautique.",
        models: ["HP LaserJet Enterprise MFP M430f", "Brother MFC-L6900DW", "Canon i-SENSYS MF754Cdw", "Epson EcoTank Pro ET-16600"],
      },
    ],
  },
  {
    slug: "reseau-informatique",
    label: "Reseau informatique",
    description: "Infrastructure LAN/WAN securisee pour les systemes d'information.",
    subcategories: [
      {
        slug: "switch-manage",
        label: "Switch manage",
        description: "Switches manageables avec VLAN, QoS et PoE.",
        models: ["Cisco C9300X-48HX", "Aruba 6200F 48G", "Ubiquiti USW-Pro-48-PoE", "TP-Link TL-SG3428XMP"],
      },
      {
        slug: "routeur-entreprise",
        label: "Routeur entreprise",
        description: "Routeurs multi-WAN pour sites distants et sieges.",
        models: ["Cisco ISR 4331", "MikroTik CCR2004-1G-12S+2XS", "Peplink Balance 310X", "DrayTek Vigor3910"],
      },
      {
        slug: "point-acces-wifi",
        label: "Point d'acces Wi-Fi",
        description: "Bornes Wi-Fi professionnelles pour couverture d'entreprise.",
        models: ["Cisco Catalyst 9130AXI", "Aruba AP-515", "Ubiquiti U6 Pro", "TP-Link EAP670"],
      },
      {
        slug: "pare-feu-reseau",
        label: "Pare-feu reseau",
        description: "Firewalls pour segmentation et protection du trafic.",
        models: ["Fortinet FortiGate 60F", "Sophos XGS 2100", "Palo Alto PA-440", "Cisco Firepower 1010"],
      },
    ],
  },
  {
    slug: "incendie",
    label: "Incendie",
    description: "Solutions de prevention, detection et alerte incendie.",
    subcategories: [
      {
        slug: "extincteur",
        label: "Extincteur",
        description: "Extincteurs a poudre, CO2 et eau additif.",
        models: ["Extincteur ABC 6kg", "Extincteur CO2 5kg", "Extincteur Eau additif 9L", "Extincteur poudre 12kg"],
      },
      {
        slug: "ria",
        label: "R.I.A",
        description: "Robinets d'incendie armes pour intervention rapide.",
        models: ["RIA DN25 30m", "RIA DN19 20m", "RIA pivotant mural", "RIA armoire inox"],
      },
      {
        slug: "detecteur-fumee",
        label: "Detecteur de fumee",
        description: "Detection optique de fumee pour systemes SSI.",
        models: ["Honeywell ECO1003", "Siemens OP720", "Hochiki SOC-E3N", "Apollo XP95 Optical"],
      },
      {
        slug: "detecteur-humidite",
        label: "Detecteur d'humidite",
        description: "Capteurs humidite/fuite pour locaux techniques et archives.",
        models: ["Ajax LeaksProtect", "Honeywell WLD2", "Fibaro Flood Sensor", "Tuya TS0207"],
      },
      {
        slug: "sirene",
        label: "Sirene",
        description: "Sirenes sonores et visuelles d'evacuation.",
        models: ["Bosch FNM-420-A-BS", "Honeywell WSS-PC-I02", "Ajax StreetSiren", "Hikvision DS-PS1-E-WE"],
      },
    ],
  },
  {
    slug: "telecommunications",
    label: "Telecommunications",
    description: "Autocom, voix sur IP et equipements de communication d'entreprise.",
    subcategories: [
      {
        slug: "autocom",
        label: "Autocom",
        description: "IP-PBX et standards telephoniques pour entreprises.",
        models: ["Grandstream UCM6302A", "Panasonic KX-NS500", "Yeastar S100", "Alcatel-Lucent OXO Connect"],
      },
      {
        slug: "telephone-ip",
        label: "Telephone IP",
        description: "Postes SIP pour centre d'appels et postes utilisateurs.",
        models: ["Yealink SIP-T54W", "Cisco 8841", "Grandstream GXP2170", "Fanvil X7A"],
      },
      {
        slug: "passerelle-voip",
        label: "Passerelle VoIP",
        description: "Passerelles FXO/FXS vers SIP pour interconnexion telephonique.",
        models: ["Grandstream GXW4108", "Cisco ATA191", "Yeastar TG200", "Dinstar UC2000"],
      },
      {
        slug: "routeur-4g-5g",
        label: "Routeur 4G/5G",
        description: "Routeurs de secours et connectivite haut debit mobile.",
        models: ["Teltonika RUTX50", "Huawei AR502H", "MikroTik Chateau 5G", "Peplink MAX BR1 Pro 5G"],
      },
    ],
  },
  {
    slug: "securite-informatique-base-de-donnees",
    label: "Securite informatique et base de donnees",
    description: "Protection des postes, reseaux, SIEM et sauvegarde des bases de donnees.",
    subcategories: [
      {
        slug: "antivirus-edr",
        label: "Antivirus / EDR",
        description: "Protection endpoint et detection/reponse avancee.",
        models: ["Kaspersky Endpoint Security", "Bitdefender GravityZone", "Microsoft Defender for Endpoint", "ESET PROTECT"],
      },
      {
        slug: "siem-soc",
        label: "SIEM / SOC",
        description: "Supervision de securite et correlation des evenements.",
        models: ["Splunk Enterprise Security", "IBM QRadar SIEM", "Elastic Security", "Wazuh"],
      },
      {
        slug: "sauvegarde-base-de-donnees",
        label: "Sauvegarde base de donnees",
        description: "Protection des bases SQL/NoSQL et reprise d'activite.",
        models: ["Veeam Backup & Replication", "Acronis Cyber Protect", "Commvault Complete", "Veritas NetBackup"],
      },
      {
        slug: "pare-feu-applicatif-bdd",
        label: "Pare-feu applicatif et BDD",
        description: "Protection WAF et firewall de base de donnees.",
        models: ["Imperva SecureSphere", "F5 Advanced WAF", "Oracle Database Firewall", "AWS WAF"],
      },
    ],
  },
  {
    slug: "energie",
    label: "Energie",
    description: "Continuite electrique via onduleur, groupe et solaire.",
    subcategories: [
      {
        slug: "onduleur",
        label: "Onduleur",
        description: "UPS online et line-interactive pour sites critiques.",
        models: ["APC Smart-UPS SMT2200IC", "Eaton 9E 3000i", "Vertiv Liebert GXT5-3000IRT2UXL", "Riello Sentinel Dual SDH 3000"],
      },
      {
        slug: "groupe-electrique",
        label: "Groupe electrique",
        description: "Groupes electrogenes de secours pour installation IT.",
        models: ["Cummins C33D5", "FG Wilson P33-6", "SDMO J44K", "Pramac GSW45P"],
      },
      {
        slug: "panneau-solaire",
        label: "Panneau solaire",
        description: "Modules photovoltaiques haute performance.",
        models: ["LONGi LR5-72HPH-550M", "Jinko Tiger Neo 565W", "Trina Vertex S 430W", "Canadian Solar HiKu6 550W"],
      },
      {
        slug: "regulateur-convertisseur",
        label: "Regulateur / convertisseur",
        description: "Regulation MPPT et conversion energie hybride.",
        models: ["Victron SmartSolar MPPT 250/100", "Schneider Conext MPPT 80 600", "SMA Sunny Tripower 8.0", "Huawei SUN2000-10KTL-M1"],
      },
    ],
  },
];

export const PRODUCT_CATEGORY_SLUGS = PRODUCT_CATEGORY_DEFINITIONS.map((item) => item.slug);

export const PRODUCT_SUBCATEGORY_INDEX = PRODUCT_CATEGORY_DEFINITIONS.reduce((accumulator, category) => {
  category.subcategories.forEach((subcategory) => {
    accumulator[subcategory.slug] = {
      ...subcategory,
      categorySlug: category.slug,
      categoryLabel: category.label,
    };
  });
  return accumulator;
}, {});

export const PRODUCT_MODEL_INDEX = PRODUCT_CATEGORY_DEFINITIONS.reduce((accumulator, category) => {
  category.subcategories.forEach((subcategory) => {
    const fallbackKey = normalizeSlug(subcategory.label);
    const baseEntry = PRODUCT_SUBCATEGORY_INDEX[subcategory.slug] || {
      ...subcategory,
      categorySlug: category.slug,
      categoryLabel: category.label,
    };
    accumulator[subcategory.slug] = baseEntry.models || [];
    accumulator[fallbackKey] = baseEntry.models || [];
  });
  return accumulator;
}, {});

export const ENGINEERING_ROOT_SLUG = PRODUCT_ROOT_SLUG;

export const ENGINEERING_FAMILIES = PRODUCT_CATEGORY_DEFINITIONS.map((category) => ({
  slug: category.slug,
  label: category.label,
  description: category.description,
  types: category.subcategories.map((item) => item.label),
}));

export const ENGINEERING_FAMILY_SLUGS = ENGINEERING_FAMILIES.map((item) => item.slug);

export const ENGINEERING_DELIVERY_STEPS = [
  "Analyse du besoin et choix de la categorie",
  "Selection de la sous-categorie et du modele",
  "Integration, tests et mise en service",
  "Support, maintenance et evolution",
];
