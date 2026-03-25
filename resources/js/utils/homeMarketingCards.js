export const HOME_MARKETING_SECTIONS = {
  OFFER: "offer",
  FEATURED_PRODUCT: "featured_product",
  HOME_PROMOTION: "home_promotion",
  PROMOTION_PAGE: "promotion_page",
};

const EXTERNAL_URL_REGEX = /^https?:\/\//i;

function resolveImage(item, fallbackImage) {
  return item?.image_url || item?.image_path || fallbackImage;
}

export function mapOfferCard(item) {
  return {
    title: item?.title || "Offre",
    desc: item?.description || "",
    price: item?.meta_text || "Inscription ouverte",
    img: resolveImage(item, "/images/offers/offre1.webp"),
    link: item?.target_url || "/formations",
    ctaLabel: item?.cta_label || "Je profite",
  };
}

export function mapFeaturedProductCard(item) {
  return {
    title: item?.title || "Produit phare",
    price: item?.meta_text || "Sur mesure",
    img: resolveImage(item, "/images/solutions/im1.webp"),
    category: item?.badge_text || "Solution",
    link: item?.target_url || "/solutions",
    ctaLabel: item?.cta_label || "En savoir plus",
  };
}

export function mapPromotionCard(item, fallbackImage = "/images/promotions/promo1.webp") {
  return {
    id: item?.id,
    title: item?.title || "Promotion",
    src: resolveImage(item, fallbackImage),
    link: item?.target_url || "/promotions",
    ctaLabel: item?.cta_label || "Decouvrir",
  };
}

export function openMarketingTarget(navigate, target, fallback = "/") {
  const next = target || fallback;
  if (EXTERNAL_URL_REGEX.test(next)) {
    window.location.href = next;
    return;
  }

  navigate(next);
}
