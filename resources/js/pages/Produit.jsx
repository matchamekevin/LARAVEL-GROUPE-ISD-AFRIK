import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCategories, getProduits } from "../services/ProduitService";
import { addToCart, getCartItems, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import { useLivePolling } from "../hooks/useLivePolling";
import "../styles/produit.css";

const ALL_CATEGORY_SLUG = "tout";

const flattenCategories = (items = [], depth = 0, parentId = null) =>
  items.flatMap((item) => {
    const children = item.children_recursive || item.children || [];
    const flattenedItem = { 
      ...item, 
      depth, 
      parent_id: item.parent_id || parentId 
    };
    return [flattenedItem, ...flattenCategories(children, depth + 1, item.id_categorie || item.id)];
  });

const normalizeSlug = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

const buildChildrenByParent = (categories) => {
  return categories.reduce((accumulator, item) => {
    if (!item.parent_id) {
      return accumulator;
    }

    const key = String(item.parent_id);
    if (!accumulator[key]) {
      accumulator[key] = [];
    }

    accumulator[key].push(item);
    return accumulator;
  }, {});
};

const getDescendantIds = (rootId, categories) => {
  const byParent = buildChildrenByParent(categories);
  const stack = [Number(rootId)];
  const ids = [];

  while (stack.length > 0) {
    const currentId = stack.pop();
    if (!currentId || ids.includes(currentId)) {
      continue;
    }

    ids.push(currentId);
    const children = byParent[String(currentId)] || [];
    children.forEach((child) => stack.push(Number(child.id_categorie || child.id)));
  }

  return ids;
};

const getNearestMainAncestorSlug = (category, categoriesById, mainCategorySlugs = []) => {
  if (!category) return "";

  const allowed = new Set(mainCategorySlugs);
  let current = category;
  let guard = 0;

  while (current && guard < 20) {
    const slug = normalizeSlug(current.slug || current.nom || "");
    if (allowed.has(slug)) {
      return slug;
    }

    const parentId = Number(current.parent_id || 0);
    if (!parentId) break;

    current = categoriesById[parentId] || null;
    guard += 1;
  }

  return "";
};

const formatPrice = (value) => Number(value || 0).toLocaleString("fr-FR");

const statusLabel = (statut) => {
  if (statut === "disponible") return "Disponible";
  if (statut === "occasion") return "Occasion";
  if (statut === "rupture") return "Rupture";
  if (!statut) return "N/A";
  return `${statut.charAt(0).toUpperCase()}${statut.slice(1)}`;
};

const statusClasses = {
  disponible: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  actif: "bg-emerald-100 text-emerald-800 border border-emerald-200",
  occasion: "bg-amber-100 text-amber-800 border border-amber-200",
  rupture: "bg-rose-100 text-rose-800 border border-rose-200",
  indisponible: "bg-rose-100 text-rose-800 border border-rose-200",
};

const LOCALHOST_IMAGE_PATTERN = /(?:127\.0\.0\.1|localhost)/i;

const extractStoragePathFromUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";

  try {
    const parsed = new URL(raw);
    if (String(parsed.pathname || "").startsWith("/storage/")) {
      return parsed.pathname;
    }
  } catch (error) {
    // Ignore parsing errors for non-absolute URLs.
  }

  const match = raw.match(/\/storage\/[^?#]+/i);
  return match ? match[0] : "";
};

const normalizeImageCandidate = (value) => {
  const normalized = String(value || "").trim();
  if (!normalized) return "";

  if (LOCALHOST_IMAGE_PATTERN.test(normalized)) {
    const storagePath = extractStoragePathFromUrl(normalized);
    return storagePath || "";
  }

  if (normalized === "/placeholder.webp") return "";

  if (normalized.startsWith("http://") || normalized.startsWith("https://") || normalized.startsWith("/")) {
    return normalized;
  }

  if (normalized.startsWith("storage/")) {
    return `/${normalized}`;
  }

  return `/storage/${normalized.replace(/^\/+/, "")}`;
};

const getImageCandidates = (values, { allowDefault = false } = {}) => {
  const candidates = values
    .map((value) => normalizeImageCandidate(value))
    .filter(Boolean);

  if (allowDefault) {
    return candidates;
  }

  return candidates.filter((value) => value !== "/images/default.webp");
};

const getProductImage = (produit) => {
  const directImage = getImageCandidates(
    [produit.image_url, ...(Array.isArray(produit.image_urls) ? produit.image_urls : [])],
    { allowDefault: true }
  )[0];

  if (directImage) {
    return directImage;
  }

  const titre = String(produit.titre || "").toLowerCase();
  const modele = String(produit.modele || "").toLowerCase();
  const category = normalizeSlug(produit.categorie?.slug || produit.categorie?.nom || "");

  if (titre.includes("drone") || modele.includes("dji") || category.includes("drone")) {
    return "/images/produits/drone.webp";
  }
  if (titre.includes("tpe") || category.includes("tpe")) {
    return "/images/produits/tpe.webp";
  }
  if (category.includes("reseau") || category.includes("securite")) {
    return "/images/produits/int.webp";
  }
  if (category.includes("energie") || category.includes("incendie")) {
    return "/images/produits/ond.webp";
  }

  return "/images/produits/proj.webp";
};

const getDbProductImage = (produit) => {
  const candidates = getImageCandidates([
    produit.image_url,
    ...(Array.isArray(produit.image_urls) ? produit.image_urls : []),
  ]);

  return candidates[0] || null;
};

const getCategoryImage = (category) => {
  const candidates = [
    category?.image_url,
    category?.image_path,
    category?.thumbnail,
    category?.photo_url,
    category?.image?.url,
    category?.image,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  return candidates[0] || "/images/produits/proj.webp";
};

const buildSearchBlob = (item) =>
  [
    item?.nom,
    item?.label,
    item?.slug,
    item?.titre,
    item?.title,
    item?.reference,
    item?.modele,
    item?.marque,
    item?.description_courte,
    item?.description,
  ]
    .map((value) => String(value || "").trim().toLowerCase())
    .filter(Boolean)
    .join(" ");

function Stars({ note = 0 }) {
  const rounded = Math.round(Number(note || 0));

  return (
    <div className="pp-stars" aria-label={`Note ${rounded} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} viewBox="0 0 24 24" className={`pp-star ${i <= rounded ? "is-filled" : ""}`} aria-hidden="true">
          <path d="M11.525 2.295a.53.53 0 0 1 .95 0l2.31 4.679a2.123 2.123 0 0 0 1.595 1.16l5.166.756a.53.53 0 0 1 .294.904l-3.736 3.638a2.123 2.123 0 0 0-.611 1.878l.882 5.14a.53.53 0 0 1-.771.56l-4.618-2.428a2.122 2.122 0 0 0-1.973 0L6.396 21.01a.53.53 0 0 1-.77-.56l.881-5.139a2.122 2.122 0 0 0-.611-1.879L2.16 9.795a.53.53 0 0 1 .294-.906l5.165-.755a2.122 2.122 0 0 0 1.597-1.16z" />
        </svg>
      ))}
    </div>
  );
}

export default function Produits() {
  const navigate = useNavigate();
  const location = useLocation();

  const [categories, setCategories] = useState([]);
  const [produits, setProduits] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [activeCategorySlug, setActiveCategorySlug] = useState(ALL_CATEGORY_SLUG);
  const [categoryStack, setCategoryStack] = useState([]); // Array of category objects
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState("");
  const [selectedSubcategorySlug, setSelectedSubcategorySlug] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [favoriteIds, setFavoriteIds] = useState(() => new Set());
  const [cartIds, setCartIds] = useState(() => new Set());

  const currentCategory = categoryStack.length > 0 ? categoryStack[categoryStack.length - 1] : null;


  

  const handleSubcategoryClick = (item) => {
    const ownId = Number(item.id_categorie || item.id || 0);

    // Detect children in the current categories list or in nested property
    const hasChildren = categories.some((c) => Number(c.parent_id || 0) === ownId) ||
      (Array.isArray(item.children_recursive) && item.children_recursive.length > 0) ||
      (Array.isArray(item.children) && item.children.length > 0);

    setSearchTerm("");

    if (hasChildren) {
      // Drill down
      setCategoryStack((prev) => [...prev, { ...item, id: ownId }]);
      // Reset any previously selected leaf-subcategory
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
    } else {
      // It's a leaf: show products for this subcategory
      setCategoryStack((prev) => [...prev, { ...item, id: ownId }]);
      setSelectedSubcategoryId(String(ownId));
      setSelectedSubcategorySlug(normalizeSlug(item.slug || item.nom || ""));
      // Clear model selection when selecting a leaf
      setSelectedModel("");
    }
  };

  const navigateUp = (index = -1) => {
    if (index === -1) {
       setCategoryStack([]);
       setSelectedSubcategoryId("");
       setSelectedSubcategorySlug("");
    } else {
       setCategoryStack(prev => prev.slice(0, index + 1));
    }
  };

  const categoriesById = useMemo(() => {
    return categories.reduce((accumulator, item) => {
      accumulator[Number(item.id_categorie || item.id)] = item;
      return accumulator;
    }, {});
  }, [categories]);

  const topLevelCategories = useMemo(
    () => categories.filter((item) => Number(item.parent_id || 0) === 0),
    [categories]
  );

  const technicalRootCategory = useMemo(() => {
    const bySlug = topLevelCategories.find(
      (item) => normalizeSlug(item.slug || item.nom) === "catalogue-produits-techniques"
    );
    if (bySlug) return bySlug;

    const byName = topLevelCategories.find((item) =>
      String(item.nom || "").trim().toLowerCase().includes("catalogue produits techniques")
    );

    return byName || null;
  }, [topLevelCategories]);

  const technicalRootId = Number(technicalRootCategory?.id_categorie || technicalRootCategory?.id || 0);

  const mainCategories = useMemo(() => {
    const base = [
      {
        slug: ALL_CATEGORY_SLUG,
        label: "Tout",
        id: null,
        node: null,
        image: "/images/produits/proj.webp",
      },
    ];

    if (!technicalRootId) {
      // Fallback production-friendly: si la racine catalogue n'existe pas,
      // utiliser directement les catégories top-level comme catégories principales.
      const fallbackMain = topLevelCategories
        .sort((a, b) => {
          const orderDiff = Number(a.ordre || 0) - Number(b.ordre || 0);
          if (orderDiff !== 0) return orderDiff;
          return String(a.nom || "").localeCompare(String(b.nom || ""), "fr");
        })
        .map((item) => ({
          slug: normalizeSlug(item.slug || item.nom),
          label: item.nom,
          id: Number(item.id_categorie || item.id),
          node: item,
          image: getCategoryImage(item),
        }));

      return [...base, ...fallbackMain];
    }

    const dbMain = categories
      .filter((item) => Number(item.parent_id || 0) === technicalRootId)
      .sort((a, b) => {
        const orderDiff = Number(a.ordre || 0) - Number(b.ordre || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.nom || "").localeCompare(String(b.nom || ""), "fr");
      })
      .map((item) => ({
        slug: normalizeSlug(item.slug || item.nom),
        label: item.nom,
        id: Number(item.id_categorie || item.id),
        node: item,
        image: getCategoryImage(item),
      }));

    return [...base, ...dbMain];
  }, [categories, technicalRootId, topLevelCategories]);

  const mainCategorySlugs = useMemo(
    () => mainCategories.filter((item) => item.slug !== ALL_CATEGORY_SLUG).map((item) => item.slug),
    [mainCategories]
  );

  const activeCategory = useMemo(() => {
    return mainCategories.find((item) => item.slug === activeCategorySlug) || mainCategories[0] || null;
  }, [activeCategorySlug, mainCategories]);

  // Compute visible subcategories based on current stack or active main category
  const visibleSubcategories = useMemo(() => {
    let parentId = 0;

    if (categoryStack.length > 0) {
      parentId = Number(currentCategory?.id_categorie || currentCategory?.id || 0);
    } else if (activeCategorySlug !== ALL_CATEGORY_SLUG && activeCategory && activeCategory.id) {
      parentId = Number(activeCategory.id);
    } else {
      parentId = 0;
    }

    return categories.filter((c) => Number(c.parent_id || 0) === Number(parentId));
  }, [activeCategory, activeCategorySlug, categories, categoryStack, currentCategory]);




  const subcategories = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    let source = [];
    const activeRootId = Number(activeCategory.id || 0);

    if (activeCategory.slug === ALL_CATEGORY_SLUG) {
      const mainCategoryIds = mainCategories
        .filter((item) => item.slug !== ALL_CATEGORY_SLUG && item.id)
        .map((item) => Number(item.id));

      const idSet = new Set();
      mainCategoryIds.forEach((mainId) => {
        getDescendantIds(mainId, categories).forEach((id) => {
          if (id !== mainId) {
            idSet.add(id);
          }
        });
      });

      source = categories.filter((item) => idSet.has(Number(item.id_categorie || item.id)));

      // Fallback: si aucune catégorie enfant, afficher les catégories principales elles-mêmes.
      if (source.length === 0) {
        const mainSet = new Set(mainCategoryIds);
        source = categories.filter((item) => mainSet.has(Number(item.id_categorie || item.id)));
      }
    } else if (activeCategory.id) {
      const descendants = getDescendantIds(Number(activeCategory.id), categories).filter(
        (id) => id !== Number(activeCategory.id)
      );
      const idSet = new Set(descendants);
      source = categories.filter((item) => idSet.has(Number(item.id_categorie || item.id)));

      // Fallback: catégorie principale sans enfants, la rendre cliquable comme sous-catégorie.
      if (source.length === 0 && activeCategory.node) {
        source = [activeCategory.node];
      }
    }

    return source
      .sort((a, b) => {
        const orderDiff = Number(a.ordre || 0) - Number(b.ordre || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.nom || "").localeCompare(String(b.nom || ""), "fr");
      })
      .map((item) => ({
        ...(function buildDisplayItem() {
          const id = Number(item.id_categorie || item.id);
          const ancestors = [];
          let parentId = Number(item.parent_id || 0);
          let guard = 0;

          while (parentId && guard < 20) {
            const parent = categoriesById[parentId];
            if (!parent) break;
            const parentOwnId = Number(parent.id_categorie || parent.id || 0);

            if (activeRootId && parentOwnId === activeRootId) {
              break;
            }

            ancestors.unshift(String(parent.nom || "").trim());
            parentId = Number(parent.parent_id || 0);
            guard += 1;
          }

          return {
            id,
            slug: normalizeSlug(item.slug || item.nom),
            label: item.nom,
            pathLabel: ancestors.length ? `${ancestors.join(" / ")} / ${item.nom}` : item.nom,
            depth: ancestors.length + 1,
            description: item.description || "",
            image: getCategoryImage(item),
          };
        })(),
      }));
  }, [activeCategory, categories, categoriesById, mainCategories]);

  const selectedSubcategory = useMemo(() => {
    if (!selectedSubcategoryId && !selectedSubcategorySlug) {
      return null;
    }

    if (selectedSubcategoryId) {
      const direct = subcategories.find((item) => String(item.id) === String(selectedSubcategoryId));
      if (direct) {
        return direct;
      }
    }

    if (selectedSubcategorySlug) {
      return subcategories.find((item) => item.slug === selectedSubcategorySlug) || null;
    }

    return null;
  }, [selectedSubcategoryId, selectedSubcategorySlug, subcategories]);

  const searchNormalized = useMemo(() => searchTerm.trim().toLowerCase(), [searchTerm]);

  const filteredSubcategories = useMemo(() => {
    const subcategoryIds = new Set(subcategories.filter((item) => item.id).map((item) => Number(item.id)));
    const productSearchIndex = new Map();

    if (subcategoryIds.size > 0) {
      produits.forEach((produit) => {
        let current = Number(produit.id_categorie || produit.categorie?.id_categorie || 0);
        let resolvedSubcategoryId = 0;
        let guard = 0;

        while (current && guard < 15) {
          if (subcategoryIds.has(current)) {
            resolvedSubcategoryId = current;
            break;
          }

          current = Number(categoriesById[current]?.parent_id || 0);
          guard += 1;
        }

        if (!resolvedSubcategoryId) return;

        const blob = buildSearchBlob(produit);
        if (!blob) return;

        const previous = productSearchIndex.get(resolvedSubcategoryId) || "";
        productSearchIndex.set(resolvedSubcategoryId, `${previous} ${blob}`);
      });
    }

    if (!searchNormalized) {
      return subcategories;
    }

    return subcategories.filter((item) => {
      const haystack = `${item.label} ${item.description || ""}`.toLowerCase();
      if (haystack.includes(searchNormalized)) {
        return true;
      }

      if (!item.id) {
        return false;
      }

      const productBlob = productSearchIndex.get(Number(item.id)) || "";
      return productBlob.includes(searchNormalized);
    });
  }, [categoriesById, produits, searchNormalized, subcategories]);

  const countsBySubcategory = useMemo(() => {
    const buckets = {};
    if (!activeCategory) {
      return buckets;
    }

    const subcategoryIds = new Set(subcategories.filter((item) => item.id).map((item) => Number(item.id)));
    if (subcategoryIds.size === 0) {
      return buckets;
    }

    produits.forEach((produit) => {
      let current = Number(produit.id_categorie || produit.categorie?.id_categorie || 0);
      let guard = 0;

      while (current && guard < 15) {
        if (subcategoryIds.has(current)) {
          buckets[current] = (buckets[current] || 0) + 1;
          break;
        }

        const parent = categoriesById[current];
        current = Number(parent?.parent_id || 0);
        guard += 1;
      }
    });

    return buckets;
  }, [activeCategory, categoriesById, produits, subcategories]);

  const modelCards = useMemo(() => {
    if (!selectedSubcategory) {
      return [];
    }

    const byModel = {};
    produits.forEach((item) => {
      const modelName = String(item.modele || "").trim();
      if (!modelName) {
        return;
      }

      const key = modelName.toLowerCase();
      const productId = Number(item.id_produit || item.id || 0);
      const dbImage = getDbProductImage(item);

      if (!byModel[key]) {
        byModel[key] = {
          name: modelName,
          count: 0,
          source: "db",
          image: dbImage || getProductImage(item),
          hasDbImage: Boolean(dbImage),
          searchBlob: "",
          representativeProduct: item,
          representativeId: productId || null,
          ratingWeightedTotal: 0,
          ratingVoteTotal: 0,
          ratingFallbackTotal: 0,
          ratingFallbackCount: 0,
        };
      }

      if (!byModel[key].hasDbImage) {
        if (dbImage) {
          byModel[key].image = dbImage;
          byModel[key].hasDbImage = true;
        }
      }

      if (!byModel[key].representativeId && productId) {
        byModel[key].representativeProduct = item;
        byModel[key].representativeId = productId;
      }

      const note = Number(item.note_moyenne || 0);
      const avis = Number(item.nombre_avis || 0);

      if (note > 0 && avis > 0) {
        byModel[key].ratingWeightedTotal += note * avis;
        byModel[key].ratingVoteTotal += avis;
      } else if (note > 0) {
        byModel[key].ratingFallbackTotal += note;
        byModel[key].ratingFallbackCount += 1;
      }

      byModel[key].searchBlob += ` ${buildSearchBlob(item)}`;
      byModel[key].count += 1;
    });

    const cards = Object.values(byModel)
      .map((item) => {
        const ratingAverage = item.ratingVoteTotal > 0
          ? item.ratingWeightedTotal / item.ratingVoteTotal
          : item.ratingFallbackCount > 0
            ? item.ratingFallbackTotal / item.ratingFallbackCount
            : 0;

        const ratingCount = item.ratingVoteTotal > 0 ? item.ratingVoteTotal : item.ratingFallbackCount;

        return {
          ...item,
          ratingAverage,
          ratingCount,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "fr"));

    if (searchNormalized) {
      return cards.filter((item) => {
        return item.name.toLowerCase().includes(searchNormalized) || item.searchBlob.includes(searchNormalized);
      });
    }

    return cards;
  }, [produits, searchNormalized, selectedSubcategory]);

  const produitsModele = useMemo(() => {
    if (!selectedModel) {
      return [];
    }

    return produits.filter((item) => String(item.modele || "").trim().toLowerCase() === selectedModel.toLowerCase());
  }, [produits, selectedModel]);

  const filteredProduitsModele = useMemo(() => {
    if (!searchNormalized) {
      return produitsModele;
    }

    return produitsModele.filter((item) => buildSearchBlob(item).includes(searchNormalized));
  }, [produitsModele, searchNormalized]);

  const globalModelResults = useMemo(() => {
    if (!searchNormalized) {
      return [];
    }

    const byModel = {};
    produits.forEach((item) => {
      const modelName = String(item.modele || "").trim();
      if (!modelName) {
        return;
      }

      const key = modelName.toLowerCase();
      if (!byModel[key]) {
        byModel[key] = {
          name: modelName,
          count: 0,
          representativeProduct: item,
          searchBlob: "",
        };
      }

      byModel[key].count += 1;
      byModel[key].searchBlob += ` ${buildSearchBlob(item)}`;
    });

    return Object.values(byModel)
      .filter((item) => item.name.toLowerCase().includes(searchNormalized) || item.searchBlob.includes(searchNormalized))
      .sort((a, b) => a.name.localeCompare(b.name, "fr"))
      .slice(0, 10);
  }, [produits, searchNormalized]);

  const globalProductResults = useMemo(() => {
    if (!searchNormalized) {
      return [];
    }

    return produits
      .filter((item) => buildSearchBlob(item).includes(searchNormalized))
      .slice(0, 12);
  }, [produits, searchNormalized]);

  const loadCategories = useCallback(async () => {
    try {
      // Try with the 'general' segment first (production expectation).
      let response = await getCategories({ segment: "general", tree: 1 });
      let tree = response.data?.data || response.data || [];

      // Fallback for local/dev DB where categories may not have a segment set.
      if (!Array.isArray(tree) || tree.length === 0) {
        response = await getCategories({ tree: 1 });
        tree = response.data?.data || response.data || [];
      }

      setCategories(flattenCategories(tree));
    } catch {
      setCategories([]);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const categoriesParam = String(params.get("categories") || "")
      .split(",")
      .map((item) => normalizeSlug(item))
      .filter(Boolean);
    const subcategoryIdParam = Number(params.get("sous_categorie_id") || 0);
    const modelParam = String(params.get("modele") || "").trim();

    if (categoriesParam.length === 0 && !subcategoryIdParam) {
      if (modelParam) {
        setSelectedModel(modelParam);
      }
      return;
    }

    const requestedCategory = categoriesParam.find((slug) => [...mainCategorySlugs, ALL_CATEGORY_SLUG].includes(slug));
    if (requestedCategory) {
      setActiveCategorySlug(requestedCategory);
    }

    const categoryFromId = subcategoryIdParam
      ? categoriesById[subcategoryIdParam] || categories.find((item) => Number(item.id_categorie || item.id) === subcategoryIdParam)
      : null;

    if (categoryFromId) {
      const ownSlug = normalizeSlug(categoryFromId.slug || categoryFromId.nom);
      const ownId = Number(categoryFromId.id_categorie || categoryFromId.id || 0);
      const mainAncestorSlug = getNearestMainAncestorSlug(categoryFromId, categoriesById, mainCategorySlugs);
      const hasChildren = categories.some((item) => Number(item.parent_id || 0) === ownId);

      if (mainCategorySlugs.includes(ownSlug)) {
        // Cas fallback: une catégorie principale peut aussi être sélectionnée
        // comme sous-catégorie si elle n'a pas d'enfants.
        if (subcategoryIdParam && ownId === subcategoryIdParam && !hasChildren) {
          setActiveCategorySlug(ownSlug);
          setSelectedSubcategoryId(String(ownId));
          setSelectedSubcategorySlug(ownSlug);
        } else {
          setActiveCategorySlug(ownSlug);
          setSelectedSubcategoryId("");
          setSelectedSubcategorySlug("");
        }
      } else if (mainAncestorSlug) {
        setActiveCategorySlug(mainAncestorSlug);
        setSelectedSubcategoryId(String(categoryFromId.id_categorie || categoryFromId.id));
        setSelectedSubcategorySlug(ownSlug);
      }
    }

    const categoryFromDb = categories.find((item) => {
      const slug = normalizeSlug(item.slug || item.nom);
      return categoriesParam.includes(slug);
    });

    if (!categoryFromId && categoryFromDb) {
      const ownSlug = normalizeSlug(categoryFromDb.slug || categoryFromDb.nom);
      const ownId = Number(categoryFromDb.id_categorie || categoryFromDb.id || 0);
      const mainAncestorSlug = getNearestMainAncestorSlug(categoryFromDb, categoriesById, mainCategorySlugs);
      const hasChildren = categories.some((item) => Number(item.parent_id || 0) === ownId);

      if (mainCategorySlugs.includes(ownSlug)) {
        if (subcategoryIdParam && ownId === subcategoryIdParam && !hasChildren) {
          setActiveCategorySlug(ownSlug);
          setSelectedSubcategoryId(String(ownId));
          setSelectedSubcategorySlug(ownSlug);
        } else {
          setActiveCategorySlug(ownSlug);
          setSelectedSubcategoryId("");
          setSelectedSubcategorySlug("");
        }
      } else if (mainAncestorSlug) {
        setActiveCategorySlug(mainAncestorSlug);
        setSelectedSubcategoryId(String(categoryFromDb.id_categorie || categoryFromDb.id));
        setSelectedSubcategorySlug(ownSlug);
      }
    }

    if (modelParam) {
      setSelectedModel(modelParam);
    }
  }, [categories, categoriesById, location.search, mainCategorySlugs]);

  useEffect(() => {
    const refreshStoreState = () => {
      const nextFavorites = new Set();

      produits.forEach((item) => {
        const id = Number(item.id_produit || item.id);
        if (id && isFavorite(id)) {
          nextFavorites.add(id);
        }
      });

      const nextCart = new Set(
        getCartItems()
          .map((item) => Number(item.id_produit || item.id))
          .filter((id) => Number.isFinite(id) && id > 0)
      );

      setFavoriteIds(nextFavorites);
      setCartIds(nextCart);
    };

    refreshStoreState();
    return subscribeStoreUpdates(refreshStoreState);
  }, [produits]);

  const fetchProduits = useCallback(async (isSilent = false) => {
    if (!activeCategory) {
      return;
    }

    if (!isSilent) {
      setLoading(true);
      setError("");
    }

    try {
      const params = {
        segment: "general",
        tri: "recent",
        par_page: selectedModel ? 100 : 100, // Réduit de 250 à 100 pour optimiser les perfs
      };

      const categoryIds = [];

      if (selectedSubcategoryId) {
        categoryIds.push(...getDescendantIds(Number(selectedSubcategoryId), categories));
      } else if (activeCategory.id) {
        const descendants = getDescendantIds(Number(activeCategory.id), categories);
        descendants.forEach((id) => {
          if (id !== Number(activeCategory.id)) {
            categoryIds.push(id);
          }
        });
      }

      if (categoryIds.length > 0) {
        params.id_categorie = Array.from(new Set(categoryIds)).join(",");
      }

      if (selectedModel) {
        params.modele = selectedModel;
      }

      const response = await getProduits(params);
      setProduits(response.data?.data || []);
    } catch (err) {
      if (!isSilent) {
        setError("Impossible de charger les produits pour le moment.");
        setProduits([]);
      }
    } finally {
      if (!isSilent) {
        setLoading(false);
      }
    }
  }, [activeCategory, categories, selectedModel, selectedSubcategoryId]);

  // Polling des produits (silencieux après le premier load)
  useLivePolling(() => fetchProduits(true), {
    intervalMs: 30000, // 30s au lieu de 7s (plus raisonnable)
    enabled: !!activeCategory,
  });

  // Chargement initial des produits quand les filtres changent
  useEffect(() => {
    fetchProduits(false);
  }, [fetchProduits]);

  useLivePolling(loadCategories, {
    intervalMs: 60000, // 1m au lieu de 20s pour les catégories
    enabled: true,
  });

  const searchPlaceholder = selectedModel
    ? "Rechercher un produit dans ce modele"
    : selectedSubcategory
      ? "Rechercher un modele"
      : "Rechercher une sous-categorie";

  const handleCategoryChange = (slug) => {
    setActiveCategorySlug(slug);
    setCategoryStack([]);
    setSelectedModel("");
    setSelectedSubcategoryId("");
    setSelectedSubcategorySlug("");
    setSearchTerm("");

    const params = new URLSearchParams(location.search);
    params.set("categories", slug);
    params.delete("sous_categorie_id");
    params.delete("modele");
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`);
  };

  const handleModelClick = (modelName) => {
    const matching = produits.filter(
      (item) => String(item.modele || "").trim().toLowerCase() === String(modelName).trim().toLowerCase()
    );

    if (matching.length === 1) {
      navigate(`/produits/${matching[0].id_produit}`);
      return;
    }

    setSelectedModel(modelName);
    setSearchTerm("");

    const params = new URLSearchParams(location.search);
    const cats = selectedSubcategorySlug || activeCategorySlug || "";
    if (cats) {
      params.set("categories", cats);
    } else {
      params.delete("categories");
    }

    if (selectedSubcategoryId) {
      params.set("sous_categorie_id", selectedSubcategoryId);
    } else {
      params.delete("sous_categorie_id");
    }

    params.set("modele", modelName);
    const query = params.toString();
    navigate(`${location.pathname}${query ? `?${query}` : ""}`);
  };

  const handleModelAddToCart = (modelCard) => {
    const targetProduct = modelCard?.representativeProduct || null;
    if (!targetProduct) {
      handleModelClick(modelCard?.name || "");
      return;
    }

    addToCart(targetProduct, 1);
  };

  const handleModelToggleFavorite = (modelCard) => {
    const targetProduct = modelCard?.representativeProduct || null;
    if (!targetProduct) {
      handleModelClick(modelCard?.name || "");
      return;
    }

    toggleFavorite(targetProduct);
  };

  const applyOrientationClass = (event) => {
    const img = event.currentTarget || event.target;
    if (!img) return;
    const w = img.naturalWidth || img.width;
    const h = img.naturalHeight || img.height;
    if (!w || !h) return;

    img.classList.remove("is-landscape", "is-portrait", "is-square");
    const ratio = w / h;
    if (ratio >= 1.15) {
      img.classList.add("is-landscape");
    } else if (ratio <= 0.85) {
      img.classList.add("is-portrait");
    } else {
      img.classList.add("is-landscape");
    }
  };

  const handleImageError = (event, fallback = "/images/default.webp") => {
    const img = event.currentTarget || event.target;
    if (!img) return;
    if (img.dataset.fallbackApplied === "1") return;
    img.dataset.fallbackApplied = "1";
    img.src = fallback;
  };

  return (
    <section className="pcat-shell">
      <div className="pcat-bg-layer" aria-hidden="true" />
      <div className="pcat-container">
        <section className="pcat-hero">

          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <h1 className="pcat-hero-title">Nos Produits</h1>

            <label className="pcat-search" aria-label="Recherche catalogue">
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d="M11 19a8 8 0 1 1 5.293-14.002A8 8 0 0 1 11 19Zm9.707 1.293-4.52-4.52" />
              </svg>
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={searchPlaceholder}
              />
              {searchTerm && (
                <button type="button" onClick={() => setSearchTerm("")} className="pcat-search-clear" aria-label="Effacer la recherche">
                  x
                </button>
              )}
            </label>
            <div style={{ marginTop: 8 }}>
              <button
                type="button"
                className="pcat-outline-btn"
                onClick={() => {
                  // Exemple: créer une pile de catégories profonde si possible
                  const root = topLevelCategories[0];
                  if (!root) return;
                  const level1 = categories.find(c => Number(c.parent_id || 0) === Number(root.id_categorie || root.id));
                  const level2 = level1 ? categories.find(c => Number(c.parent_id || 0) === Number(level1.id_categorie || level1.id)) : null;
                  const level3 = level2 ? categories.find(c => Number(c.parent_id || 0) === Number(level2.id_categorie || level2.id)) : null;

                  const stack = [];
                  if (root && root.id) stack.push({ ...root, id: Number(root.id_categorie || root.id) });
                  if (level1) stack.push({ ...level1, id: Number(level1.id_categorie || level1.id) });
                  if (level2) stack.push({ ...level2, id: Number(level2.id_categorie || level2.id) });
                  if (level3) stack.push({ ...level3, id: Number(level3.id_categorie || level3.id) });

                  setCategoryStack(stack);
                  if (stack.length > 0) {
                    const last = stack[stack.length - 1];
                    const ownId = Number(last.id_categorie || last.id || 0);
                    const hasChildren = categories.some(c => Number(c.parent_id || 0) === ownId);
                    if (!hasChildren) {
                      setSelectedSubcategoryId(String(ownId));
                      setSelectedSubcategorySlug(normalizeSlug(last.slug || last.nom || ""));
                    } else {
                      setSelectedSubcategoryId("");
                      setSelectedSubcategorySlug("");
                    }
                  }
                }}
              >
                Exemple: navigation profonde
              </button>
            </div>
          </div>
        </section>

        <section className="pcat-main-pills" aria-label="Categories principales">
          {mainCategories.map((item) => {
            const active = item.slug === activeCategorySlug;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => handleCategoryChange(item.slug)}
                className={`pcat-pill ${active ? "is-active" : ""}`}
              >
                {item.label}
              </button>
            );
          })}
        </section>

        {(categoryStack.length > 0 || selectedModel) && (
          <section className="pcat-breadcrumb">
            <div className="pcat-breadcrumb-actions">
              <button
                type="button"
                className="pcat-outline-btn"
                onClick={() => navigateUp(-1)}
              >
                Tout voir
              </button>
              {categoryStack.map((cat, idx) => (
                <button
                    key={cat.id}
                    type="button"
                    className="pcat-outline-btn"
                    onClick={() => navigateUp(idx)}
                >
                    Retour à {cat.nom || cat.label}
                </button>
              ))}
            </div>

            <p className="pcat-breadcrumb-path">
              {activeCategory?.label}
              {categoryStack.map(cat => ` / ${cat.nom || cat.label}`)}
              {selectedModel ? ` / ${selectedModel}` : ""}
            </p>
          </section>
        )}

        {visibleSubcategories.length > 0 && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Sous-catégories</h2>
              <p>Sélectionnez une famille pour continuer la navigation.</p>
            </div>

            <div className="pcat-sub-grid">
              {visibleSubcategories.map((item) => (
                <article key={`${item.slug}-${item.id_categorie || item.id}`} className="pcat-sub-card">
                  <div className="pcat-sub-visual">
                    <img
                      src={item.image_url || "/images/produits/proj.webp"}
                      alt={item.nom || item.label}
                      loading="lazy"
                      onLoad={applyOrientationClass}
                      onError={(event) => handleImageError(event, "/images/produits/proj.webp")}
                    />
                    <div className="pcat-sub-overlay" aria-hidden="true" />
                  </div>

                  <div className="pcat-sub-content">
                    <h3>{item.nom || item.label}</h3>
                    <p>{item.description || "Sélectionnez cette catégorie pour voir la suite."}</p>
                    <div className="pcat-sub-footer">
                      <span className="pcat-sub-count">
                        {item.id ? `${countsBySubcategory[item.id] || 0} produit(s) DB` : "Catalogue"}
                      </span>
                        <button
                          type="button"
                          onClick={() => handleSubcategoryClick(item)}
                          className="pcat-solid-btn"
                        >
                          {(
                            categories.some(c => Number(c.parent_id) === Number(item.id)) ||
                            (Array.isArray(item.children_recursive) && item.children_recursive.length > 0) ||
                            (Array.isArray(item.children) && item.children.length > 0)
                          ) ? "Voir sous-catégories" : "Voir produits"}
                        </button>
                    </div>
                  </div>                </article>
              ))}
            </div>
          </section>
        )}

        {/* Show model list if at a leaf node (no more subcategories) */}
        {categoryStack.length > 0 && visibleSubcategories.length === 0 && !selectedModel && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Modèles disponibles</h2>
              <p>Produits dans {currentCategory?.nom || currentCategory?.label}</p>
            </div>

            <div className="pcat-model-grid">
              {modelCards.map((item) => {
                const representativeId = Number(item.representativeId || item.representativeProduct?.id_produit || item.representativeProduct?.id || 0);
                const isModelFavorite = representativeId > 0 ? favoriteIds.has(representativeId) : false;
                const isModelInCart = representativeId > 0 ? cartIds.has(representativeId) : false;

                return (
                  <article key={`${item.name}`} className="pcat-model-card">
                    <div className="pcat-model-visual">
                      <img
                        src={item.image || "/images/produits/proj.webp"}
                        alt={`Modèle ${item.name}`}
                        className="pcat-model-image"
                        loading="lazy"
                        onLoad={applyOrientationClass}
                        onError={(event) => handleImageError(event, "/images/produits/proj.webp")}
                      />
                    </div>
                    <h3>{item.name}</h3>
                    <div className="pcat-model-actions">
                      <button type="button" onClick={() => handleModelClick(item.name)} className="pcat-solid-btn">
                        Voir produits
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {modelCards.length === 0 && <p className="pcat-empty-box">Aucun modèle trouvé.</p>}
          </section>
        )}

        {selectedModel && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Produits du modele {selectedModel}</h2>
            </div>

            {error && <p className="pcat-error-text">{error}</p>}

            <div className="pcat-product-grid">
              {loading && Array.from({ length: 6 }).map((_, index) => (
                <article key={`skeleton-${index}`} className="pcat-product-card is-skeleton">
                  <div className="pcat-product-image-wrap" />
                  <div className="pcat-product-body">
                    <div className="pcat-skeleton-line" />
                    <div className="pcat-skeleton-line short" />
                  </div>
                </article>
              ))}

              {!loading && filteredProduitsModele.map((produit) => {
                const prixFinal = produit.prix_promo ?? produit.prix;
                const isFav = favoriteIds.has(Number(produit.id_produit));
                const badgeClass = statusClasses[produit.statut] || "bg-slate-100 text-slate-800 border border-slate-200";

                return (
                  <article key={produit.id_produit} className="pcat-product-card">
                    <div className="pcat-product-image-wrap">
                      <img
                        src={getProductImage(produit)}
                        alt={produit.titre}
                        className="pcat-product-image"
                        loading="lazy"
                        onLoad={applyOrientationClass}
                        onError={handleImageError}
                      />

                      <span className={`pcat-status-chip ${badgeClass}`}>{statusLabel(produit.statut)}</span>

                      <button
                        type="button"
                        className={`pcat-fav-btn ${isFav ? "is-active" : ""}`}
                        aria-label={isFav ? "Retirer des favoris" : "Ajouter aux favoris"}
                        onClick={() => toggleFavorite(produit)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                    </div>

                    <div className="pcat-product-body">
                      <p className="pcat-brand">{produit.marque || "Marque non renseignee"}</p>
                      <h3 className="pcat-title">{produit.titre}</h3>
                      <p className="pcat-description">{produit.description_courte || produit.description || "Description en cours."}</p>

                      <div className="pcat-rating-row">
                        <Stars note={produit.note_moyenne} />
                        <span>{produit.nombre_avis > 0 ? `(${produit.nombre_avis})` : "Aucun avis"}</span>
                      </div>

                      <div className="pcat-footer-row">
                        <p className="pcat-price">{formatPrice(prixFinal)} FCFA</p>
                        <button type="button" onClick={() => navigate(`/produits/${produit.id_produit}`)} className="pcat-solid-btn">
                          Voir detail
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!loading && !error && filteredProduitsModele.length === 0 && (
              <div className="pcat-empty-box">Aucun produit detaille trouve pour ce modele.</div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
