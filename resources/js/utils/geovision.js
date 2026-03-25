export const GEOVISION_FALLBACK_IMAGE = "/images/geovision/cam1.webp";

export function normalizeGeovisionKey(value = "") {
  return String(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function resolveGeovisionImage(entity, fallback = GEOVISION_FALLBACK_IMAGE) {
  const candidate =
    entity?.url ||
    entity?.path ||
    entity?.image_url ||
    entity?.image ||
    entity?.images?.[0]?.url ||
    entity?.images?.[0]?.path ||
    entity?.image_urls?.[0] ||
    fallback;

  if (!candidate) {
    return fallback;
  }

  return String(candidate).startsWith("http") || String(candidate).startsWith("/")
    ? candidate
    : `/${candidate}`;
}

export function getCategoryChildren(category) {
  if (!category) {
    return [];
  }

  if (Array.isArray(category.children_recursive) && category.children_recursive.length > 0) {
    return category.children_recursive;
  }

  if (Array.isArray(category.children) && category.children.length > 0) {
    return category.children;
  }

  return [];
}

export function flattenCategoryTree(categories = [], depth = 0) {
  return categories.flatMap((category) => {
    const children = getCategoryChildren(category);

    return [
      { ...category, depth },
      ...flattenCategoryTree(children, depth + 1),
    ];
  });
}

export function matchCategory(categories = [], key = "") {
  const normalizedKey = normalizeGeovisionKey(key);

  return flattenCategoryTree(categories).find((category) => {
    return (
      normalizeGeovisionKey(category.slug) === normalizedKey ||
      normalizeGeovisionKey(category.nom) === normalizedKey
    );
  }) || null;
}

export function buildCategoryPath(category, categoriesById = {}) {
  if (!category) {
    return "";
  }

  const segments = [category.nom];
  let currentParentId = category.parent_id;
  let guard = 0;

  while (currentParentId && categoriesById[currentParentId] && guard < 12) {
    const parent = categoriesById[currentParentId];
    segments.unshift(parent.nom);
    currentParentId = parent.parent_id;
    guard += 1;
  }

  return segments.join(" / ");
}

export function readGeovisionSpecifications(product) {
  const raw = product?.specifications;
  let specs = {};

  try {
    specs = typeof raw === "string" ? JSON.parse(raw) : raw || {};
  } catch (error) {
    specs = {};
  }

  const taxonomy = {
    family: specs?.taxonomy?.family || specs?.famille || "",
    category: specs?.taxonomy?.category || specs?.type_principal || "",
    subcategory: specs?.taxonomy?.subcategory || specs?.sous_type || "",
    series: specs?.taxonomy?.series || specs?.modele_famille || "",
  };

  const normalizeText = (value) => String(value || "").replace(/\s+/g, " ").trim();
  const uniqueStrings = (values) => {
    const seen = new Set();

    return values
      .map((value) => normalizeText(value))
      .filter((value) => {
        if (!value) return false;
        const key = value.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  };

  const features = Array.isArray(specs?.features)
    ? uniqueStrings(specs.features)
    : Array.isArray(specs?.caracteristiques)
      ? uniqueStrings(specs.caracteristiques)
      : [];

  const tags = Array.isArray(specs?.tags)
    ? uniqueStrings(specs.tags)
    : Array.isArray(specs?.features)
      ? uniqueStrings(specs.features).slice(0, 8)
      : Array.isArray(specs?.caracteristiques)
        ? uniqueStrings(specs.caracteristiques).slice(0, 8)
        : [];

  const platforms = Array.isArray(specs?.platforms)
    ? uniqueStrings(specs.platforms)
    : [];

  const useCases = Array.isArray(specs?.use_cases)
    ? uniqueStrings(specs.use_cases)
    : [];

  const detailNotes = Array.isArray(specs?.detail_notes)
    ? uniqueStrings(specs.detail_notes)
    : [];

  const technicalSpecs = Array.isArray(specs?.technical_specs)
    ? specs.technical_specs.filter((item) => item?.label || item?.value)
    : Object.entries(specs || {})
        .filter(([key, value]) => {
          if (!value) return false;

          return ![
            "overview",
            "features",
            "technical_specs",
            "taxonomy",
            "tags",
            "platforms",
            "use_cases",
            "detail_notes",
            "source_url",
            "famille",
            "type_principal",
            "sous_type",
            "modele_famille",
            "caracteristiques",
          ].includes(key);
        })
        .map(([label, value]) => ({
          label: label.replace(/_/g, " "),
          value: Array.isArray(value) ? value.join(", ") : String(value),
        }));

  return {
    overview: normalizeText(specs?.overview || product?.description_courte || product?.description || ""),
    tags,
    features,
    platforms,
    useCases,
    detailNotes,
    sourceUrl: specs?.source_url || "",
    technicalSpecs,
    taxonomy,
  };
}

export function getProductGallery(product) {
  if (Array.isArray(product?.images) && product.images.length > 0) {
    return product.images.map((image) => resolveGeovisionImage(image));
  }

  if (Array.isArray(product?.image_urls) && product.image_urls.length > 0) {
    return product.image_urls.map((image) => resolveGeovisionImage({ image_url: image }));
  }

  return [resolveGeovisionImage(product)];
}

export function formatGeovisionPrice(value) {
  const numericValue = Number(value || 0);
  if (!numericValue) {
    return "Sur devis";
  }

  return `${numericValue.toLocaleString("fr-FR")} FCFA`;
}

export function getGeovisionAvailability(product) {
  if ((product?.stock ?? 0) <= 0 || product?.statut === "rupture") {
    return "Rupture";
  }

  if ((product?.stock ?? 0) <= 5) {
    return "Stock limité";
  }

  return "Disponible";
}
