// Utilitaires pour les formations
export const getFormationImageUrl = (formation) => {
  if (!formation) return null;

  const titre = formation.titre?.toLowerCase() || "";
  const categorie = formation.categorie?.toLowerCase() || "";

  // Mapping basé sur le titre de la formation
  if (titre.includes("drone") || titre.includes("formation de drone")) {
    return "/uploads/formations/drone.webp";
  }
  if (titre.includes("big data") || titre.includes("big-data")) {
    return "/uploads/formations/big-data.webp";
  }
  if (titre.includes("coaching commercial")) {
    return "/uploads/formations/coaching-commercial.webp";
  }
  if (titre.includes("community management")) {
    return "/uploads/formations/community-management.webp";
  }
  if (titre.includes("comptabilité") && titre.includes("gestion") && titre.includes("projets")) {
    return "/uploads/formations/comptabilite-gestion-projets.webp";
  }
  if (titre.includes("comptabilité") && titre.includes("immobilisations")) {
    return "/uploads/formations/comptabilite-immobilisations.webp";
  }
  if (titre.includes("conception") && titre.includes("site web")) {
    return "/uploads/formations/conception-site-web.webp";
  }
  if (titre.includes("développement") && titre.includes("api")) {
    return "/uploads/formations/dev-application-api.webp";
  }
  if (titre.includes("développement") && titre.includes("débutant")) {
    return "/uploads/formations/dev-application-debutant.webp";
  }
  if (titre.includes("excel") && titre.includes("avancé")) {
    return "/uploads/formations/excel-avance.webp";
  }
  if (titre.includes("excel") && titre.includes("pro")) {
    return "/uploads/formations/excel-pro.webp";
  }
  if (titre.includes("gestion commerciale") && titre.includes("stock")) {
    return "/uploads/formations/gestion-commerciale-stock.webp";
  }
  if (titre.includes("gestion") && titre.includes("entreprise")) {
    return "/uploads/formations/gestion-entreprise.webp";
  }
  if (titre.includes("gestion") && titre.includes("projets")) {
    return "/uploads/formations/gestion-projets.webp";
  }
  if (titre.includes("gpec")) {
    return "/uploads/formations/gpec.webp";
  }
  if (titre.includes("hôtellerie") || titre.includes("restauration")) {
    return "/uploads/formations/hotellerie-restauration.webp";
  }
  if (titre.includes("ia") && titre.includes("organisation commerciale")) {
    return "/uploads/formations/ia-organisation-commerciale.webp";
  }
  if (titre.includes("ia") && titre.includes("performance") && titre.includes("avancé")) {
    return "/uploads/formations/ia-performance-avance.webp";
  }
  if (titre.includes("ia") && titre.includes("performance commerciale")) {
    return "/uploads/formations/ia-performance-commerciale.webp";
  }
  if (titre.includes("infographie")) {
    return "/uploads/formations/infographie.webp";
  }
  if (titre.includes("leadership") && titre.includes("rh") && titre.includes("avancé")) {
    return "/uploads/formations/leadership-rh-avance.webp";
  }
  if (titre.includes("leadership") && titre.includes("rh")) {
    return "/uploads/formations/leadership-rh.webp";
  }
  if (titre.includes("management") && titre.includes("ia") && titre.includes("avancé")) {
    return "/uploads/formations/management-ia-avance.webp";
  }
  if (titre.includes("management") && titre.includes("ia")) {
    return "/uploads/formations/management-ia.webp";
  }
  if (titre.includes("microsoft") && titre.includes("avancé")) {
    return "/uploads/formations/microsoft-avance.webp";
  }
  if (titre.includes("modernisation") && titre.includes("rh")) {
    return "/uploads/formations/modernisation-rh.webp";
  }
  if (titre.includes("motivation") && titre.includes("équipe commerciale")) {
    return "/uploads/formations/motivation-equipe-commerciale.webp";
  }
  if (titre.includes("motivation") && titre.includes("équipes")) {
    return "/uploads/formations/motivation-equipes.webp";
  }
  if (titre.includes("multimedia")) {
    return "/uploads/formations/multimedia.webp";
  }
  if (titre.includes("négociation") && titre.includes("vente")) {
    return "/uploads/formations/negociation-vente.webp";
  }
  if (titre.includes("paie") && titre.includes("ressources humaines")) {
    return "/uploads/formations/paie-ressources-humaines.webp";
  }
  if (titre.includes("paie") && titre.includes("rh") && titre.includes("logiciel")) {
    return "/uploads/formations/paie-rh-logiciel.webp";
  }
  if (titre.includes("paie") && titre.includes("rh")) {
    return "/uploads/formations/paie-rh.webp";
  }
  if (titre.includes("power point")) {
    return "/uploads/formations/power point.webp";
  }
  if (titre.includes("relance commerciale")) {
    return "/uploads/formations/relance-commerciale.webp";
  }
  if (titre.includes("relance") && titre.includes("hôtellerie")) {
    return "/uploads/formations/relance-hotellerie.webp";
  }
  if (titre.includes("relance") && titre.includes("marché")) {
    return "/uploads/formations/relance-marche.webp";
  }
  if (titre.includes("réseaux sociaux") && titre.includes("entreprise")) {
    return "/uploads/formations/reseaux-sociaux-entreprise.webp";
  }
  if (titre.includes("rh") && titre.includes("ia")) {
    return "/uploads/formations/rh-ia.webp";
  }
  if (titre.includes("secretariat") && titre.includes("moderne")) {
    return "/uploads/formations/secretariat-moderne.webp";
  }
  if (titre.includes("seo") || titre.includes("référencement")) {
    return "/uploads/formations/seo-referencement.webp";
  }
  if (titre.includes("syscohada") && titre.includes("avancé")) {
    return "/uploads/formations/syscohada-avance.webp";
  }
  if (titre.includes("syscohada") && titre.includes("comptabilité")) {
    return "/uploads/formations/syscohada-comptabilite.webp";
  }
  if (titre.includes("syscohada") && titre.includes("révisé")) {
    return "/uploads/formations/syscohada-revise.webp";
  }
  if (titre.includes("télémarketing")) {
    return "/uploads/formations/telemarketing.webp";
  }
  if (titre.includes("ventes") && titre.includes("ia") && titre.includes("avancé")) {
    return "/uploads/formations/ventes-ia-avance.webp";
  }
  if (titre.includes("ventes") && titre.includes("ia")) {
    return "/uploads/formations/ventes-ia.webp";
  }
  if (titre.includes("vidéo") && titre.includes("surveillance")) {
    return "/uploads/formations/video-surveillance.webp";
  }
  if (titre.includes("web") && titre.includes("wordpress")) {
    return "/uploads/formations/web-wordpress.webp";
  }
  if (titre.includes("assistant") && titre.includes("direction")) {
    return "/uploads/formations/assistant-direction.webp";
  }

  // Aucun fallback: si aucune correspondance trouvée, ne pas retourner d'image
  return null;
};