export const HOME_MARKETING_SECTIONS = {
  OFFER: "offer",
  FEATURED_PRODUCT: "featured_product",
  HOME_PROMOTION: "home_promotion",
  PROMOTION_PAGE: "promotion_page",
};

const EXTERNAL_URL_REGEX = /^https?:\/\//i;

function isAbsoluteMediaPath(path) {
  return typeof path === "string" && (EXTERNAL_URL_REGEX.test(path) || path.startsWith("/"));
}

export function normalizeMarketingTarget(target, fallback = "/") {
  const rawTarget = String(target || "").trim();
  if (!rawTarget) return fallback;

  if (typeof window === "undefined") {
    if (EXTERNAL_URL_REGEX.test(rawTarget) || rawTarget.startsWith("/")) {
      return rawTarget;
    }

    return `/${rawTarget.replace(/^\/+/, "")}`;
  }

  try {
    const url = new URL(rawTarget, window.location.origin);
    const isCurrentOrigin = url.origin === window.location.origin;
    const isKnownLocalOrigin = ["http://127.0.0.1:8000", "http://localhost:8000"].includes(url.origin);

    if (isCurrentOrigin || isKnownLocalOrigin) {
      return `${url.pathname}${url.search}${url.hash}` || fallback;
    }

    return rawTarget;
  } catch {
    if (rawTarget.startsWith("/")) return rawTarget;
    return `/${rawTarget.replace(/^\/+/, "")}`;
  }
}

function normalizeStorageUrl(url) {
  if (typeof url !== "string") return url;
  const match = url.match(/\/storage\/.+/);
  if (match) return match[0];
  return url;
}

function resolveImage(item, fallbackImage) {
  if (isAbsoluteMediaPath(item?.image_url)) {
    return normalizeStorageUrl(item.image_url);
  }

  if (isAbsoluteMediaPath(item?.image_path)) {
    return normalizeStorageUrl(item.image_path);
  }

  return fallbackImage;
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
  const next = normalizeMarketingTarget(target, fallback);
  if (EXTERNAL_URL_REGEX.test(next)) {
    window.location.href = next;
    return;
  }

  navigate(next);
}
