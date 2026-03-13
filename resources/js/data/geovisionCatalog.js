const typeDetails = {
  "cameras ip & thermiques": {
    summary: "Solutions de surveillance intelligentes pour intérieur, extérieur et sites sensibles.",
    specs: [
      { label: "Capteur", value: "Haute sensibilité jour/nuit" },
      { label: "Protection", value: "Boîtier résistant aux intempéries" },
      { label: "Analyse", value: "Détection avancée et alertes" },
      { label: "Réseau", value: "Intégration IP et PoE" },
    ],
  },
  "enregistreurs & nvr": {
    summary: "Plateformes d'enregistrement centralisé pour sites multiservices et supervision continue.",
    specs: [
      { label: "Capacité", value: "Stockage extensible" },
      { label: "Compression", value: "Optimisation H.265/H.264" },
      { label: "Sécurité", value: "Sauvegarde et redondance" },
      { label: "Accès", value: "Consultation distante sécurisée" },
    ],
  },
  "vms & analytics": {
    summary: "Pilotage vidéo unifié avec intelligence de détection, supervision et tableaux de bord.",
    specs: [
      { label: "Supervision", value: "Vue centralisée multi-sites" },
      { label: "IA", value: "Scénarios et alertes intelligentes" },
      { label: "Rapports", value: "Exports et indicateurs clés" },
      { label: "Interopérabilité", value: "Compatible écosystème Geovision" },
    ],
  },
  "controle d'acces": {
    summary: "Contrôle d'accès modulaire pour bureaux, zones critiques et gestion visiteurs.",
    specs: [
      { label: "Authentification", value: "Badge, code, biométrie" },
      { label: "Journalisation", value: "Traçabilité des accès" },
      { label: "Gestion", value: "Profils et règles horaires" },
      { label: "Intégration", value: "Portes, barrières, supervision" },
    ],
  },
  "lpr / anpr": {
    summary: "Lecture automatisée des plaques pour parkings, barrières et contrôle véhicules.",
    specs: [
      { label: "Reconnaissance", value: "Lecture haute précision" },
      { label: "Scénarios", value: "Liste blanche et liste noire" },
      { label: "Conditions", value: "Adapté jour et nuit" },
      { label: "Usage", value: "Sites privés et flux véhicules" },
    ],
  },
  "poe & réseau": {
    summary: "Infrastructure réseau et alimentation pour déployer un écosystème vidéo stable.",
    specs: [
      { label: "Distribution", value: "PoE et uplinks réseau" },
      { label: "Stabilité", value: "Conçu pour charges continues" },
      { label: "Déploiement", value: "Installation simplifiée" },
      { label: "Compatibilité", value: "Équipements IP et sécurité" },
    ],
  },
  "murs d'images": {
    summary: "Affichage de supervision et visualisation centralisée pour centres de contrôle.",
    specs: [
      { label: "Affichage", value: "Multi-écrans haute lisibilité" },
      { label: "Pilotage", value: "Répartition des flux" },
      { label: "Usage", value: "Postes de commandement" },
      { label: "Connectique", value: "HDMI et sources multiples" },
    ],
  },
  accessoires: {
    summary: "Éléments de montage, protection et raccordement pour finaliser l'installation.",
    specs: [
      { label: "Montage", value: "Supports et fixations" },
      { label: "Protection", value: "Boîtiers et adaptateurs" },
      { label: "Fiabilité", value: "Conçu pour intégration terrain" },
      { label: "Compatibilité", value: "Écosystème Geovision" },
    ],
  },
};

export const geovisionTypes = [
  { id: 1000, title: "Cameras IP & thermiques", desc: "Cameras fixes, dômes, PTZ et thermiques pour tous les environnements.", image: "/images/geovision/cam/cam1.png" },
  { id: 1001, title: "Enregistreurs & NVR", desc: "NVR haute capacité, stockage sécurisé et redondance.", image: "/images/geovision/nvr/nvr1.jpeg" },
  { id: 1002, title: "VMS & analytics", desc: "Logiciel de gestion vidéo, analyses IA, alertes intelligentes.", image: "/images/geovision/ecran1.png" },
  { id: 1003, title: "Controle d'acces", desc: "Badges, lecteurs, contrôle visiteurs et intégrations.", image: "/images/geovision/controleur1.png" },
  { id: 1004, title: "LPR / ANPR", desc: "Reconnaissance de plaques, barrières et parking.", image: "/images/geovision/cam/cam5.jpeg" },
  { id: 1005, title: "PoE & réseau", desc: "Switches PoE, alimentation, extensions réseau.", image: "/images/geovision/nvr/nvr4.jpeg" },
  { id: 1006, title: "Murs d'images", desc: "Moniteurs de supervision, affichage multi-écrans.", image: "/images/geovision/ecran1.png" },
  { id: 1007, title: "Accessoires", desc: "Supports, boitiers, câbles et modules complémentaires.", image: "/images/geovision/solution1.png" },
];

const rawProducts = [
  { id: 101, nom: "Caméra IP Dôme 2MP", type: "cameras ip & thermiques", description: "Dôme IP 2MP, zoom optique, PoE", image: "/images/geovision/cam/cam1.png", price: 185000 },
  { id: 102, nom: "Caméra PTZ 4K", type: "cameras ip & thermiques", description: "PTZ 4K, 30x zoom, IR 150m", image: "/images/geovision/cam/cam3.jpeg", price: 420000 },
  { id: 103, nom: "Caméra Thermique 640p", type: "cameras ip & thermiques", description: "Thermique 640x512, détection de feu", image: "/images/geovision/cam/cam2.jpeg", price: 690000 },
  { id: 201, nom: "NVR 16 canaux 12MP", type: "enregistreurs & nvr", description: "NVR 16ch, 2x HDD 4TB, RAID", image: "/images/geovision/nvr/nvr1.jpeg", price: 350000 },
  { id: 202, nom: "NVR 32 canaux 4K", type: "enregistreurs & nvr", description: "NVR 32ch, 4TB RAID, redondance", image: "/images/geovision/nvr/nvr3.jpeg", price: 560000 },
  { id: 203, nom: "Enregistreur Compact", type: "enregistreurs & nvr", description: "Enregistreur 8ch compact, PoE", image: "/images/geovision/nvr/nvr2.jpeg", price: 210000 },
  { id: 301, nom: "VMS Professional", type: "vms & analytics", description: "Logiciel VMS illimité, IA intégrée", image: "/images/geovision/ecran1.png", price: 275000 },
  { id: 302, nom: "Suite Analytics", type: "vms & analytics", description: "Analyse vidéo, comptage flux, détection", image: "/images/geovision/solution1.png", price: 320000 },
  { id: 401, nom: "Lecteur Badge RFID", type: "controle d'acces", description: "Lecteur RFID, sortie relai, LED", image: "/images/geovision/controleur1.png", price: 145000 },
  { id: 402, nom: "Lecteur Biométrique", type: "controle d'acces", description: "Reconnaissance faciale/empreinte", image: "/images/geovision/controleur1.png", price: 225000 },
  { id: 403, nom: "Gestion Visiteurs", type: "controle d'acces", description: "Logiciel contrôle accès intégré", image: "/images/geovision/solution1.png", price: 295000 },
  { id: 501, nom: "Caméra LPR Full HD", type: "lpr / anpr", description: "Reconnaissance plaques, 30 fps", image: "/images/geovision/cam/cam5.jpeg", price: 480000 },
  { id: 502, nom: "Barrière ANPR", type: "lpr / anpr", description: "Barrière automatique, gestion parking", image: "/images/geovision/solution1.png", price: 615000 },
  { id: 601, nom: "Switch PoE 24 ports", type: "poe & réseau", description: "PoE+ 24p, 240W budget", image: "/images/geovision/nvr/nvr4.jpeg", price: 175000 },
  { id: 602, nom: "Injecteur PoE", type: "poe & réseau", description: "Injecteur simple 60W", image: "/images/geovision/nvr/nvr5.jpeg", price: 45000 },
  { id: 603, nom: "Câble RJ45 blindé", type: "poe & réseau", description: "Câble 305m, catégorie 6A", image: "/images/geovision/solution1.png", price: 85000 },
  { id: 701, nom: "Moniteur 55\" CCTV", type: "murs d'images", description: "Moniteur 55\" Full HD, PoE", image: "/images/geovision/ecran1.png", price: 390000 },
  { id: 702, nom: "Contrôleur Mur vidéo", type: "murs d'images", description: "Contrôleur 4K, 16 sorties HDMI", image: "/images/geovision/solution1.png", price: 740000 },
  { id: 801, nom: "Support mural ajustable", type: "accessoires", description: "Support aluminium, charge 3kg", image: "/images/geovision/cam/cam4.jpeg", price: 35000 },
  { id: 802, nom: "Boîtier protection IP67", type: "accessoires", description: "Boîtier aluminium IP67 pour outdoor", image: "/images/geovision/cam/cam1.png", price: 65000 },
  { id: 803, nom: "Adaptateur PoE", type: "accessoires", description: "Adaptateur PoE 12V 2A", image: "/images/geovision/controleur1.png", price: 28000 },
];

export const geovisionProducts = rawProducts.map((product) => {
  const typeInfo = typeDetails[product.type] || typeDetails.accessoires;
  const formattedPrice = Number(product.price).toLocaleString("fr-FR");

  return {
    ...product,
    badge: "Catalogue Geovision",
    brand: "Geovision",
    priceLabel: `${formattedPrice} FCFA`,
    availability: "Disponible immédiatement",
    leadTime: "Étude et installation sous planification",
    deployment: "Mise en service sur site et accompagnement technique",
    images: [product.image],
    summary: typeInfo.summary,
    specs: typeInfo.specs,
  };
});

export function normalizeGeovisionText(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function getGeovisionProductById(id) {
  return geovisionProducts.find((product) => String(product.id) === String(id)) || null;
}

export function getGeovisionRelatedProducts(product, limit = 4) {
  if (!product) return [];

  return geovisionProducts
    .filter((candidate) => candidate.id !== product.id && candidate.type === product.type)
    .slice(0, limit);
}