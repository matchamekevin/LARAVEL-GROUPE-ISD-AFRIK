import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { getCategories, getProduits } from "../services/ProduitService";
import { addToCart, getCartItems, isFavorite, subscribeStoreUpdates, toggleFavorite } from "../utils/shopStorage";
import { useLivePolling } from "../hooks/useLivePolling";
import { toastError, toastSuccess } from "../utils/toast";
import "../styles/produit.css";
import SearchBar from "../components/SearchBar";
import { countryCodeToId, getStoredCountry } from "../utils/country";

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
    children.forEach((child) => stack.push(String(child.id_categorie || child.id)));
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

    const parentId = String(current.parent_id || 0);
    if (!parentId || parentId === "0") break;

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

const extractCollection = (response) => {
  const items = response?.data?.data;
  return Array.isArray(items) ? items : Array.isArray(response?.data) ? response.data : [];
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

  return directImage || null;
};

const getDbProductImage = (produit) => {
    const candidates = [
     produit.image_url,
     ...(Array.isArray(produit.image_urls) ? produit.image_urls : []),
    ].filter(Boolean);
    return candidates[0] || null;
   };

const getCategoryImage = (category) => {
    const candidates = [
     category?.image_url,
     category?.image,
     category?.display_image_url,
    ].filter(Boolean);
    return candidates[0] || null;
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
    const ownId = String(item.id_categorie || item.id || 0);
    const ownSlug = normalizeSlug(item.slug || item.nom || "");

    const hasChildren = categories.some((c) => String(c.parent_id || 0) === ownId) ||
      (Array.isArray(item.children_recursive) && item.children_recursive.length > 0) ||
      (Array.isArray(item.children) && item.children.length > 0);

    setSearchTerm("");

    const existingIndex = categoryStack.findIndex((c) => {
      const cId = String(c.id);
      const cSlug = normalizeSlug(c.slug || c.nom || "");
      return cId === ownId || (ownSlug && cSlug === ownSlug);
    });

    if (existingIndex >= 0) {
      setCategoryStack((prev) => prev.slice(0, existingIndex + 1));
    } else {
      setCategoryStack((prev) => [...prev, { ...item, id: ownId }]);
    }

    if (hasChildren) {
      setSelectedSubcategoryId("");
      setSelectedSubcategorySlug("");
    } else {
      setSelectedSubcategoryId(String(ownId));
      setSelectedSubcategorySlug(ownSlug);
      setSelectedModel("");
    }
  };

  const saveCatalogState = () => {
    sessionStorage.setItem("produit_back_url", `${location.pathname}${location.search}`);
    sessionStorage.setItem("produit_back_active_slug", activeCategorySlug);
    sessionStorage.setItem("produit_back_stack", JSON.stringify(categoryStack));
    sessionStorage.setItem("produit_back_sub_id", selectedSubcategoryId);
    sessionStorage.setItem("produit_back_sub_slug", selectedSubcategorySlug);
    sessionStorage.setItem("produit_back_model", selectedModel);
    sessionStorage.setItem("produit_back_search", searchTerm);
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
      accumulator[String(item.id_categorie || item.id)] = item;
      return accumulator;
    }, {});
  }, [categories]);

  const topLevelCategories = useMemo(
    () => categories.filter((item) => String(item.parent_id || 0) === "0"),
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

  const technicalRootId = String(technicalRootCategory?.id_categorie || technicalRootCategory?.id || 0);

  const GEOVISION_SLUG = "geovision";

  const mainCategories = useMemo(() => {
    const base = [
      {
        slug: ALL_CATEGORY_SLUG,
        label: "Tout",
        id: null,
        node: null,
        image: "/images/produits/proj.webp",
      },
      {
        slug: GEOVISION_SLUG,
        label: "Geovision",
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
          id: String(item.id_categorie || item.id),
          node: item,
          image: getCategoryImage(item),
        }));

      return [...base, ...fallbackMain];
    }

    const dbMain = categories
      .filter((item) => String(item.parent_id || 0) === technicalRootId)
      .sort((a, b) => {
        const orderDiff = Number(a.ordre || 0) - Number(b.ordre || 0);
        if (orderDiff !== 0) return orderDiff;
        return String(a.nom || "").localeCompare(String(b.nom || ""), "fr");
      })
      .map((item) => ({
        slug: normalizeSlug(item.slug || item.nom),
        label: item.nom,
        id: String(item.id_categorie || item.id),
        node: item,
        image: getCategoryImage(item),
      }));

    return [...base, ...dbMain];
  }, [categories, technicalRootId, topLevelCategories]);

  const mainCategorySlugs = useMemo(
    () => mainCategories.filter((item) => item.slug !== ALL_CATEGORY_SLUG && item.slug !== GEOVISION_SLUG).map((item) => item.slug),
    [mainCategories]
  );

  const activeCategory = useMemo(() => {
    return mainCategories.find((item) => item.slug === activeCategorySlug) || mainCategories[0] || null;
  }, [activeCategorySlug, mainCategories]);

  const visibleSubcategories = useMemo(() => {
    if (activeCategorySlug === ALL_CATEGORY_SLUG && categoryStack.length === 0) {
      const mainIds = mainCategories
        .filter((item) => item.slug !== ALL_CATEGORY_SLUG && item.slug !== GEOVISION_SLUG && item.id)
        .map((item) => String(item.id));
      const mainIdSet = new Set(mainIds);
      const firstLevel = categories.filter((item) => mainIdSet.has(String(item.parent_id || 0)));
      if (firstLevel.length > 0) {
        return firstLevel;
      }
      return categories.filter((c) => String(c.parent_id || 0) !== 0);
    }

    let parentId = 0;
    if (categoryStack.length > 0) {
      parentId = String(currentCategory?.id_categorie || currentCategory?.id || 0);
    } else if (activeCategory && activeCategory.id) {
      parentId = String(activeCategory.id);
    }
    return categories.filter((c) => String(c.parent_id || 0) === String(parentId));
  }, [activeCategory, activeCategorySlug, categories, categoryStack, currentCategory, mainCategories]);




  const subcategories = useMemo(() => {
    if (!activeCategory) {
      return [];
    }

    let source = [];
    const activeRootId = String(activeCategory.id || 0);

    if (activeCategory.slug === ALL_CATEGORY_SLUG) {
      const mainCategoryIds = mainCategories
        .filter((item) => item.slug !== ALL_CATEGORY_SLUG && item.id)
        .map((item) => String(item.id));

      const idSet = new Set();
      mainCategoryIds.forEach((mainId) => {
        getDescendantIds(mainId, categories).forEach((id) => {
          if (id !== mainId) {
            idSet.add(id);
          }
        });
      });

      source = categories.filter((item) => idSet.has(String(item.id_categorie || item.id)));

      // Fallback: si aucune catégorie enfant, afficher les catégories principales elles-mêmes.
      if (source.length === 0) {
        const mainSet = new Set(mainCategoryIds);
        source = categories.filter((item) => mainSet.has(String(item.id_categorie || item.id)));
      }
    } else if (activeCategory.id) {
      const descendants = getDescendantIds(String(activeCategory.id), categories).filter(
        (id) => id !== String(activeCategory.id)
      );
      const idSet = new Set(descendants);
      source = categories.filter((item) => idSet.has(String(item.id_categorie || item.id)));

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
          const id = String(item.id_categorie || item.id);
          const ancestors = [];
          let parentId = String(item.parent_id || 0);
          let guard = 0;

          while (parentId && parentId !== "0" && guard < 20) {
            const parent = categoriesById[parentId];
            if (!parent) break;
            const parentOwnId = String(parent.id_categorie || parent.id || 0);

            if (activeRootId && parentOwnId === activeRootId) {
              break;
            }

            ancestors.unshift(String(parent.nom || "").trim());
            parentId = String(parent.parent_id || 0);
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

  const allCategoriesWithPath = useMemo(() => {
    return categories
      .filter((item) => item.parent_id && String(item.parent_id) !== "0")
      .map((item) => {
        const id = String(item.id_categorie || item.id);
        const ancestors = [];
        let parentId = String(item.parent_id || 0);
        let guard = 0;
        while (parentId && parentId !== "0" && guard < 20) {
          const parent = categoriesById[parentId];
          if (!parent) break;
          ancestors.unshift(String(parent.nom || "").trim());
          parentId = String(parent.parent_id || 0);
          guard += 1;
        }
        return {
          id,
          slug: normalizeSlug(item.slug || item.nom),
          nom: item.nom,
          pathLabel: ancestors.length ? `${ancestors.join(" / ")} / ${item.nom}` : item.nom,
          depth: ancestors.length,
          hasChildren: categories.some((c) => String(c.parent_id || 0) === id),
        };
      });
  }, [categories, categoriesById]);

  const filteredSubcategories = useMemo(() => {
    const subcategoryIds = new Set(subcategories.filter((item) => item.id).map((item) => String(item.id)));
    const productSearchIndex = new Map();

    if (subcategoryIds.size > 0) {
      produits.forEach((produit) => {
        let current = String(produit.id_categorie || produit.categorie?.id_categorie || 0);
        let resolvedSubcategoryId = null;
        let guard = 0;

        while (current && current !== "0" && guard < 15) {
          if (subcategoryIds.has(current)) {
            resolvedSubcategoryId = current;
            break;
          }

          current = String(categoriesById[current]?.parent_id || 0);
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
      const seen = new Set();
      return subcategories.filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const localMatches = subcategories.filter((item) => {
      const haystack = `${item.label} ${item.description || ""}`.toLowerCase();
      if (haystack.includes(searchNormalized)) {
        return true;
      }

      if (!item.id) {
        return false;
      }

      const productBlob = productSearchIndex.get(String(item.id)) || "";
      return productBlob.includes(searchNormalized);
    });

    if (localMatches.length > 0) {
      const seen = new Set();
      return localMatches.filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }

    const localIds = new Set(subcategories.map((item) => String(item.id)));
    const fallback = allCategoriesWithPath
      .filter((cat) => {
        if (localIds.has(cat.id)) return false;
        const haystack = `${cat.nom} ${cat.pathLabel}`.toLowerCase();
        return haystack.includes(searchNormalized);
      })
      .slice(0, 20)
      .map((cat) => {
        const raw = categories.find((c) => String(c.id_categorie || c.id) === cat.id);
        return {
          id: cat.id,
          slug: cat.slug,
          label: cat.nom,
          nom: cat.nom,
          pathLabel: cat.pathLabel,
          depth: cat.depth,
          description: raw?.description || "",
          image_url: getCategoryImage(raw || {}),
          image: getCategoryImage(raw || {}),
          id_categorie: cat.id,
          has_children: cat.hasChildren,
        };
      });

    const seen = new Set();
    return fallback.filter((item) => {
      const key = String(item.id);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [allCategoriesWithPath, categories, categoriesById, produits, searchNormalized, subcategories]);

  const countsBySubcategory = useMemo(() => {
    const buckets = {};
    if (!activeCategory) {
      return buckets;
    }

    const subcategoryIds = new Set(subcategories.filter((item) => item.id).map((item) => String(item.id)));
    if (subcategoryIds.size === 0) {
      return buckets;
    }

    produits.forEach((produit) => {
      let current = String(produit.id_categorie || produit.categorie?.id_categorie || 0);
      let guard = 0;

      while (current && current !== "0" && guard < 15) {
        if (subcategoryIds.has(current)) {
          buckets[current] = (buckets[current] || 0) + 1;
          break;
        }

        const parent = categoriesById[current];
        current = String(parent?.parent_id || 0);
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
      const productId = String(item.id_produit || item.id || "");
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
      let tree = extractCollection(await getCategories({ segment: "general", tree: 1 }));

      if (tree.length === 0) {
        tree = extractCollection(await getCategories({ segment: "general", tree: 1, id_pays: null }));
      }

      if (tree.length === 0) {
        tree = extractCollection(await getCategories({ tree: 1, id_pays: null }));
      }

      setCategories(flattenCategories(tree));
    } catch {
      // Conserver les catégories existantes en cas d'erreur réseau ponctuelle
      // pour éviter de vider toute l'interface.
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
    const subcategoryIdParam = params.get("sous_categorie_id") || "";
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
      ? categoriesById[subcategoryIdParam] || categories.find((item) => String(item.id_categorie || item.id) === subcategoryIdParam)
      : null;

    if (categoryFromId) {
      const ownSlug = normalizeSlug(categoryFromId.slug || categoryFromId.nom);
      const ownId = String(categoryFromId.id_categorie || categoryFromId.id || 0);
      const mainAncestorSlug = getNearestMainAncestorSlug(categoryFromId, categoriesById, mainCategorySlugs);
      const hasChildren = categories.some((item) => String(item.parent_id || 0) === ownId);

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
      const ownId = String(categoryFromDb.id_categorie || categoryFromDb.id || 0);
      const mainAncestorSlug = getNearestMainAncestorSlug(categoryFromDb, categoriesById, mainCategorySlugs);
      const hasChildren = categories.some((item) => String(item.parent_id || 0) === ownId);

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

    // Restore saved catalog state (from sessionStorage on back navigation).
    // URL params take precedence; sessionStorage fills in what URL doesn't carry.
    const savedActiveSlug = sessionStorage.getItem("produit_back_active_slug");
    const savedStack = sessionStorage.getItem("produit_back_stack");
    const savedSubId = sessionStorage.getItem("produit_back_sub_id");
    const savedSubSlug = sessionStorage.getItem("produit_back_sub_slug");
    const savedModel = sessionStorage.getItem("produit_back_model");
    const savedSearch = sessionStorage.getItem("produit_back_search");

    if (savedStack) {
      try {
        const parsed = JSON.parse(savedStack);
        if (Array.isArray(parsed)) {
          setCategoryStack(parsed);
        }
      } catch (_) {}
      if (savedActiveSlug && categoriesParam.length === 0) setActiveCategorySlug(savedActiveSlug);
      if (savedSubId && !subcategoryIdParam) setSelectedSubcategoryId(savedSubId);
      if (savedSubSlug && !subcategoryIdParam) setSelectedSubcategorySlug(savedSubSlug);
      if (savedModel && !modelParam) setSelectedModel(savedModel);
      if (savedSearch) setSearchTerm(savedSearch);
    }
    sessionStorage.removeItem("produit_back_url");
    sessionStorage.removeItem("produit_back_active_slug");
    sessionStorage.removeItem("produit_back_stack");
    sessionStorage.removeItem("produit_back_sub_id");
    sessionStorage.removeItem("produit_back_sub_slug");
    sessionStorage.removeItem("produit_back_model");
    sessionStorage.removeItem("produit_back_search");
  }, [categories, categoriesById, location.search, mainCategorySlugs]);

  useEffect(() => {
    const state = location.state;
    const catalog = state?.produitCatalog;
    if (catalog) {
      if (catalog.activeCategorySlug) setActiveCategorySlug(catalog.activeCategorySlug);
      if (catalog.categoryStack?.length > 0) setCategoryStack(catalog.categoryStack);
      if (catalog.selectedSubcategoryId) setSelectedSubcategoryId(catalog.selectedSubcategoryId);
      if (catalog.selectedSubcategorySlug) setSelectedSubcategorySlug(catalog.selectedSubcategorySlug);
      if (catalog.selectedModel) setSelectedModel(catalog.selectedModel);
      window.history.replaceState({}, document.title, location.pathname + location.search);
    }
  }, [JSON.stringify(location.state)]);

  useEffect(() => {
    const refreshStoreState = () => {
      const nextFavorites = new Set();

      produits.forEach((item) => {
        const id = String(item.id_produit || item.id);
        if (id && isFavorite(id)) {
          nextFavorites.add(id);
        }
      });

      const nextCart = new Set(
        getCartItems()
          .map((item) => String(item.id_produit || item.id))
          .filter((id) => id && id !== "0")
      );

      setFavoriteIds(nextFavorites);
      setCartIds(nextCart);
    };

    refreshStoreState();
    return subscribeStoreUpdates(refreshStoreState);
  }, [produits]);

  const fetchProduits = useCallback(async () => {
    if (!activeCategory) {
      return;
    }

    const queryParams = {
      segment: "general",
      tri: "recent",
      id_pays: countryCodeToId(getStoredCountry()),
      par_page: selectedModel ? 100 : 100, // Réduit de 250 à 100 pour optimiser les perfs
    };

    try {
      const categoryIds = [];

      if (selectedSubcategoryId) {
        categoryIds.push(...getDescendantIds(String(selectedSubcategoryId), categories));
      } else if (activeCategory.id) {
        const descendants = getDescendantIds(String(activeCategory.id), categories);
        descendants.forEach((id) => {
          if (id !== String(activeCategory.id)) {
            categoryIds.push(id);
          }
        });
      }

      if (categoryIds.length > 0) {
        queryParams.id_categorie = Array.from(new Set(categoryIds)).join(",");
      }

      if (selectedModel) {
        queryParams.modele = selectedModel;
      }

      const noSegmentParams = { ...queryParams };
      delete noSegmentParams.segment;
      delete noSegmentParams.id_pays;

      const attemptList = [
        { ...queryParams },
        { ...queryParams, id_pays: null },
        noSegmentParams,
      ];

      let produitsData = [];

      for (const params of attemptList) {
        try {
          const response = await getProduits(params);
          produitsData = extractCollection(response);

          if (produitsData.length > 0 || !params.segment) {
            break;
          }
        } catch (error) {
          if (!params.segment) {
            throw error;
          }
        }
      }

      setProduits(produitsData);
      setError("");
    } catch (err) {
      setProduits((previous) => {
        if (previous.length === 0) {
          toastError("Impossible de charger les produits pour le moment.");
        }
        return previous;
      });
      setError("Impossible de charger les produits pour le moment.");
    }
  }, [activeCategory, categories, selectedModel, selectedSubcategoryId]);

  useLivePolling(() => fetchProduits(), {
    intervalMs: 30000,
    enabled: !!activeCategory,
  });

  useEffect(() => {
    fetchProduits();
  }, [fetchProduits]);

  const searchPlaceholder = selectedModel
    ? "Rechercher un produit dans ce modele"
    : selectedSubcategory
      ? "Rechercher un modele"
      : "Rechercher une sous-categorie";

  const handleCategoryChange = (slug) => {
    if (slug === GEOVISION_SLUG) {
      navigate("/geovision");
      return;
    }

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
      saveCatalogState();
      navigate(`/produits/${matching[0].id_produit}`, { state: { from: `${location.pathname}${location.search}`, produitCatalog: { activeCategorySlug, categoryStack, selectedSubcategoryId, selectedSubcategorySlug, selectedModel } } });
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

  const handleImageError = (event) => {
    event.currentTarget.style.display = "none";
  };

  return (
    <section className="pcat-shell">
      <div className="pcat-bg-layer" aria-hidden="true" />
      <div className="pcat-container">
        <section className="pcat-hero">

          <div style={{ position: "relative", zIndex: 1, textAlign: "center" }}>
            <h1 className="pcat-hero-title">Nos Produits</h1>

            <SearchBar
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              onClear={() => setSearchTerm("")}
              placeholder={searchPlaceholder}
            />
            
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
          <nav className="pcat-breadcrumb" aria-label="Fil d'Ariane">
            <div className="pcat-breadcrumb-path">
              <button type="button" className="pcat-breadcrumb-link-btn" onClick={() => navigate("/")}>
                Accueil
              </button>
              <span className="pcat-breadcrumb-sep">/</span>
              <button
                type="button"
                className="pcat-breadcrumb-link-btn"
                onClick={() => {
                  setActiveCategorySlug(ALL_CATEGORY_SLUG);
                  setCategoryStack([]);
                  setSelectedSubcategoryId("");
                  setSelectedSubcategorySlug("");
                  setSelectedModel("");
                  setSearchTerm("");
                  navigate("/produits");
                }}
              >
                Produits
              </button>
              {activeCategory?.label && (
                <>
                  <span className="pcat-breadcrumb-sep">/</span>
                  <button type="button" className="pcat-breadcrumb-link-btn" onClick={() => handleCategoryChange(activeCategorySlug)}>
                    {activeCategory.label}
                  </button>
                </>
              )}
              {categoryStack.map((cat, idx) => {
                const isLast = idx === categoryStack.length - 1 && !selectedModel;
                return (
                  <React.Fragment key={cat.id}>
                    <span className="pcat-breadcrumb-sep">/</span>
                    {isLast ? (
                      <span className="pcat-breadcrumb-current">{cat.nom || cat.label}</span>
                    ) : (
                      <button type="button" className="pcat-breadcrumb-link-btn" onClick={() => navigateUp(idx)}>
                        {cat.nom || cat.label}
                      </button>
                    )}
                  </React.Fragment>
                );
              })}
              {selectedModel && (
                <>
                  <span className="pcat-breadcrumb-sep">/</span>
                  <span className="pcat-breadcrumb-current">{selectedModel}</span>
                </>
              )}
            </div>
            {categoryStack.length > 0 && (
              <button type="button" className="pcat-outline-btn" onClick={() => navigateUp(-1)}>
                ↑ Tout voir
              </button>
            )}
          </nav>
        )}

        {visibleSubcategories.length > 0 && !searchNormalized && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Sous-catégories</h2>
              <p>Sélectionnez une famille pour continuer la navigation.</p>
            </div>

            <div className="pcat-sub-grid">
              {visibleSubcategories.map((item) => (
                <article key={`${item.slug}-${item.id_categorie || item.id}`} className="pcat-sub-card">
                  <div className="pcat-sub-visual">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.nom || item.label}
                        loading="lazy"
                        onLoad={applyOrientationClass}
                      />
                    ) : null}
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
                            categories.some(c => String(c.parent_id) === String(item.id)) ||
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

        {searchNormalized && filteredSubcategories.length > 0 && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Résultats de recherche ({filteredSubcategories.length})</h2>
              <p>Sous-catégories correspondantes</p>
            </div>

            <div className="pcat-sub-grid">
              {filteredSubcategories.map((item) => (
                <article key={`search-${item.slug}-${item.id_categorie || item.id}`} className="pcat-sub-card pcat-search-match">
                  <div className="pcat-sub-visual">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.nom || item.label}
                        loading="lazy"
                        onLoad={applyOrientationClass}
                      />
                    ) : null}
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
                          onClick={() => {
                            const mainAncestor = getNearestMainAncestorSlug(
                              categoriesById[item.id] || categories.find((c) => String(c.id_categorie || c.id) === item.id),
                              categoriesById,
                              mainCategorySlugs
                            );
                            if (mainAncestor) {
                              setActiveCategorySlug(mainAncestor);
                              setCategoryStack([]);
                              setSelectedSubcategoryId("");
                              setSelectedSubcategorySlug("");
                            }
                            setSearchTerm("");
                          }}
                          className="pcat-solid-btn"
                        >
                          Voir
                        </button>
                    </div>
                  </div>                </article>
              ))}
            </div>
          </section>
        )}

        {searchNormalized && globalProductResults.length > 0 && (
          <section className="pcat-section">
            <div className="pcat-heading-row">
              <h2>Produits trouvés ({globalProductResults.length})</h2>
              <p>Produits correspondant à votre recherche</p>
            </div>

            <div className="pcat-product-grid">
              {globalProductResults.map((produit) => {
                const prixFinal = produit.prix_promo ?? produit.prix;
                const isFav = favoriteIds.has(String(produit.id_produit));
                const badgeClass = statusClasses[produit.statut] || "bg-slate-100 text-slate-800 border border-slate-200";

                return (
                  <article key={produit.id_produit} className="pcat-product-card">
                    <div className="pcat-product-image-wrap">
                      {(() => {
                        const imgSrc = getProductImage(produit);
                        return imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={produit.titre}
                            className="pcat-product-image"
                            loading="lazy"
                            onLoad={applyOrientationClass}
                            onError={handleImageError}
                          />
                        ) : <div className="pcat-sub-empty-visual" />;
                      })()}
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
                        <button type="button" onClick={() => { saveCatalogState(); navigate(`/produits/${produit.id_produit}`, { state: { from: `${location.pathname}${location.search}`, produitCatalog: { activeCategorySlug, categoryStack, selectedSubcategoryId, selectedSubcategorySlug, selectedModel } } }); }} className="pcat-solid-btn">
                          Voir detail
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        {searchNormalized && globalProductResults.length === 0 && filteredSubcategories.length === 0 && (
          <section className="pcat-section">
            <div className="pcat-empty-box">Aucun résultat pour "{searchTerm}".</div>
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
                const representativeId = String(item.representativeId || item.representativeProduct?.id_produit || item.representativeProduct?.id || 0);
                const isModelFavorite = representativeId && representativeId !== "0" ? favoriteIds.has(representativeId) : false;
                const isModelInCart = representativeId && representativeId !== "0" ? cartIds.has(representativeId) : false;

                return (
                  <article key={`${item.name}`} className="pcat-model-card">
                    <div className="pcat-model-visual">
                      {item.image ? (
                      <img
                        src={item.image}
                        alt={`Modèle ${item.name}`}
                        className="pcat-model-image"
                        loading="lazy"
                        onLoad={applyOrientationClass}
                      />
                      ) : null}
                      <button
                        type="button"
                        className={`pcat-fav-btn ${isModelFavorite ? "is-active" : ""}`}
                        aria-label={isModelFavorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                        onClick={() => handleModelToggleFavorite(item)}
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                        </svg>
                      </button>
                    </div>
                    <div className="pcat-model-body">
                      <h3>{item.name}</h3>
                      {item.representativeProduct && (
                        <div className="pcat-model-rating">
                          <Stars note={item.representativeProduct.note_moyenne} />
                          <span>{Number(item.representativeProduct.nombre_avis || 0) > 0 ? `(${item.representativeProduct.nombre_avis})` : "Aucun avis"}</span>
                        </div>
                      )}
                      <div className="pcat-model-actions">
                        <p className="pcat-model-price">{formatPrice(item.representativeProduct?.prix_promo || item.representativeProduct?.prix || 0)} FCFA</p>
                        <button type="button" onClick={() => handleModelClick(item.name)} className="pcat-solid-btn">
                          Voir produits
                        </button>
                      </div>
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

            <div className="pcat-product-grid">
              {filteredProduitsModele.map((produit) => {
                const prixFinal = produit.prix_promo ?? produit.prix;
                const isFav = favoriteIds.has(String(produit.id_produit));
                const badgeClass = statusClasses[produit.statut] || "bg-slate-100 text-slate-800 border border-slate-200";

                return (
                  <article key={produit.id_produit} className="pcat-product-card">
                    <div className="pcat-product-image-wrap">
                      {(() => {
                        const imgSrc = getProductImage(produit);
                        return imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={produit.titre}
                            className="pcat-product-image"
                            loading="lazy"
                            onLoad={applyOrientationClass}
                            onError={handleImageError}
                          />
                        ) : <div className="pcat-sub-empty-visual" />;
                      })()}

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
                        <button type="button" onClick={() => { saveCatalogState(); navigate(`/produits/${produit.id_produit}`, { state: { from: `${location.pathname}${location.search}`, produitCatalog: { activeCategorySlug, categoryStack, selectedSubcategoryId, selectedSubcategorySlug, selectedModel } } }); }} className="pcat-solid-btn">
                          Voir detail
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>

            {!error && filteredProduitsModele.length === 0 && (
              <div className="pcat-empty-box">Aucun produit detaille trouve pour ce modele.</div>
            )}
          </section>
        )}
      </div>
    </section>
  );
}
