// Utilitaires pour les formations
export const getFormationImageUrl = (formation) => {
  if (!formation) return "/uploads/formations/drone.jpeg";

  const titre = formation.titre?.toLowerCase() || "";
  const categorie = formation.categorie?.toLowerCase() || "";

  // Mapping basé sur le titre de la formation
  if (titre.includes("drone") || titre.includes("formation de drone")) {
    return "/uploads/formations/drone.jpeg";
  }
  if (titre.includes("big data") || titre.includes("big-data")) {
    return "/uploads/formations/big-data.jpg";
  }
  if (titre.includes("coaching commercial")) {
    return "/uploads/formations/coaching-commercial.jpg";
  }
  if (titre.includes("community management")) {
    return "/uploads/formations/community-management.jpg";
  }
  if (titre.includes("comptabilité") && titre.includes("gestion") && titre.includes("projets")) {
    return "/uploads/formations/comptabilite-gestion-projets.jpg";
  }
  if (titre.includes("comptabilité") && titre.includes("immobilisations")) {
    return "/uploads/formations/comptabilite-immobilisations.jpg";
  }
  if (titre.includes("conception") && titre.includes("site web")) {
    return "/uploads/formations/conception-site-web.jpg";
  }
  if (titre.includes("développement") && titre.includes("api")) {
    return "/uploads/formations/dev-application-api.jpg";
  }
  if (titre.includes("développement") && titre.includes("débutant")) {
    return "/uploads/formations/dev-application-debutant.jpg";
  }
  if (titre.includes("excel") && titre.includes("avancé")) {
    return "/uploads/formations/excel-avance.jpg";
  }
  if (titre.includes("excel") && titre.includes("pro")) {
    return "/uploads/formations/excel-pro.jpg";
  }
  if (titre.includes("gestion commerciale") && titre.includes("stock")) {
    return "/uploads/formations/gestion-commerciale-stock.jpg";
  }
  if (titre.includes("gestion") && titre.includes("entreprise")) {
    return "/uploads/formations/gestion-entreprise.jpg";
  }
  if (titre.includes("gestion") && titre.includes("projets")) {
    return "/uploads/formations/gestion-projets.jpg";
  }
  if (titre.includes("gpec")) {
    return "/uploads/formations/gpec.jpg";
  }
  if (titre.includes("hôtellerie") || titre.includes("restauration")) {
    return "/uploads/formations/hotellerie-restauration.jpg";
  }
  if (titre.includes("ia") && titre.includes("organisation commerciale")) {
    return "/uploads/formations/ia-organisation-commerciale.jpg";
  }
  if (titre.includes("ia") && titre.includes("performance") && titre.includes("avancé")) {
    return "/uploads/formations/ia-performance-avance.jpg";
  }
  if (titre.includes("ia") && titre.includes("performance commerciale")) {
    return "/uploads/formations/ia-performance-commerciale.jpg";
  }
  if (titre.includes("infographie")) {
    return "/uploads/formations/infographie.jpg";
  }
  if (titre.includes("leadership") && titre.includes("rh") && titre.includes("avancé")) {
    return "/uploads/formations/leadership-rh-avance.jpg";
  }
  if (titre.includes("leadership") && titre.includes("rh")) {
    return "/uploads/formations/leadership-rh.jpg";
  }
  if (titre.includes("management") && titre.includes("ia") && titre.includes("avancé")) {
    return "/uploads/formations/management-ia-avance.jpg";
  }
  if (titre.includes("management") && titre.includes("ia")) {
    return "/uploads/formations/management-ia.jpg";
  }
  if (titre.includes("microsoft") && titre.includes("avancé")) {
    return "/uploads/formations/microsoft-avance.jpg";
  }
  if (titre.includes("modernisation") && titre.includes("rh")) {
    return "/uploads/formations/modernisation-rh.jpg";
  }
  if (titre.includes("motivation") && titre.includes("équipe commerciale")) {
    return "/uploads/formations/motivation-equipe-commerciale.jpg";
  }
  if (titre.includes("motivation") && titre.includes("équipes")) {
    return "/uploads/formations/motivation-equipes.jpg";
  }
  if (titre.includes("multimedia")) {
    return "/uploads/formations/multimedia.jpg";
  }
  if (titre.includes("négociation") && titre.includes("vente")) {
    return "/uploads/formations/negociation-vente.jpg";
  }
  if (titre.includes("paie") && titre.includes("ressources humaines")) {
    return "/uploads/formations/paie-ressources-humaines.jpg";
  }
  if (titre.includes("paie") && titre.includes("rh") && titre.includes("logiciel")) {
    return "/uploads/formations/paie-rh-logiciel.jpg";
  }
  if (titre.includes("paie") && titre.includes("rh")) {
    return "/uploads/formations/paie-rh.jpg";
  }
  if (titre.includes("power point")) {
    return "/uploads/formations/power point.jpg";
  }
  if (titre.includes("relance commerciale")) {
    return "/uploads/formations/relance-commerciale.jpg";
  }
  if (titre.includes("relance") && titre.includes("hôtellerie")) {
    return "/uploads/formations/relance-hotellerie.jpg";
  }
  if (titre.includes("relance") && titre.includes("marché")) {
    return "/uploads/formations/relance-marche.jpg";
  }
  if (titre.includes("réseaux sociaux") && titre.includes("entreprise")) {
    return "/uploads/formations/reseaux-sociaux-entreprise.jpg";
  }
  if (titre.includes("rh") && titre.includes("ia")) {
    return "/uploads/formations/rh-ia.jpg";
  }
  if (titre.includes("secretariat") && titre.includes("moderne")) {
    return "/uploads/formations/secretariat-moderne.jpg";
  }
  if (titre.includes("seo") || titre.includes("référencement")) {
    return "/uploads/formations/seo-referencement.jpg";
  }
  if (titre.includes("syscohada") && titre.includes("avancé")) {
    return "/uploads/formations/syscohada-avance.jpg";
  }
  if (titre.includes("syscohada") && titre.includes("comptabilité")) {
    return "/uploads/formations/syscohada-comptabilite.jpg";
  }
  if (titre.includes("syscohada") && titre.includes("révisé")) {
    return "/uploads/formations/syscohada-revise.jpg";
  }
  if (titre.includes("télémarketing")) {
    return "/uploads/formations/telemarketing.jpg";
  }
  if (titre.includes("ventes") && titre.includes("ia") && titre.includes("avancé")) {
    return "/uploads/formations/ventes-ia-avance.jpg";
  }
  if (titre.includes("ventes") && titre.includes("ia")) {
    return "/uploads/formations/ventes-ia.jpg";
  }
  if (titre.includes("vidéo") && titre.includes("surveillance")) {
    return "/uploads/formations/video-surveillance.jpg";
  }
  if (titre.includes("web") && titre.includes("wordpress")) {
    return "/uploads/formations/web-wordpress.jpg";
  }
  if (titre.includes("assistant") && titre.includes("direction")) {
    return "/uploads/formations/assistant-direction.jpg";
  }

  // Images par défaut selon l'ID pour éviter les répétitions
  const defaultImages = [
    "/uploads/formations/drone.jpeg",
    "/uploads/formations/big-data.jpg",
    "/uploads/formations/coaching-commercial.jpg",
    "/uploads/formations/community-management.jpg"
  ];
  return defaultImages[formation.id_formation % defaultImages.length] || "/uploads/formations/drone.jpeg";
};