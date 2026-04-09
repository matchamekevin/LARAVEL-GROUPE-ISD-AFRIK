import React, { useCallback, useEffect, useMemo, useState } from 'react';
import '../styles/catalogue-admin.css';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import AdminNotice from '../components/AdminNotice';
import '../styles/admin-shared.css';
import '../styles/products.css';
import {
  createProduct,
  deleteProductImage,
  getProducts,
  deleteProduct,
  restoreProduct,
  forceDeleteProduct,
  toggleProductVedette,
  updateProduct,
  uploadProductImages,
  getCategories,
  getCountries,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../api';

const EMPTY_META = {
  total: 0,
  per_page: 20,
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
};

const INITIAL_FORM = {
  title: '',
  reference: '',
  modele: '',
  marque: '',
  statut: 'disponible',
  price: '',
  prix_promo: '',
  stock: 0,
  stock_alerte: 5,
  id_categorie: '',
  id_pays: '',
  garantie: '',
  poids: '',
  slug: '',
  description_courte: '',
  description: '',
  overview: '',
  features: '',
  technical_specs: '',
  tags: '',
  platforms: '',
  use_cases: '',
  image_urls: '',
  est_en_vedette: false,
  est_nouveau: false,
  en_promo: false,
};

const INITIAL_CATEGORY_FORM = {
  nom: '',
  slug: '',
  description: '',
  parent_id: '',
  ordre: 0,
  image_url: '',
  actif: true,
};



const STATUS_OPTIONS = ['all', 'disponible', 'actif', 'indisponible', 'rupture', 'occasion'];

const linesToArray = (value) =>
  String(value || '')
    .split(/\r?\n|,/)
    .map((entry) => entry.trim())
    .filter(Boolean);

const arrayToLines = (value) => (Array.isArray(value) ? value.filter(Boolean).join('\n') : '');

const technicalSpecsToLines = (rows) => {
  if (!Array.isArray(rows)) return '';
  return rows
    .map((row) => {
      const label = String(row?.label || '').trim();
      const val = String(row?.value || '').trim();
      if (!label && !val) return '';
      return `${label}: ${val}`;
    })
    .filter(Boolean)
    .join('\n');
};

const linesToTechnicalSpecs = (value) =>
  linesToArray(value)
    .map((line) => {
      const [labelPart, ...valueParts] = line.split(':');
      return {
        label: String(labelPart || '').trim(),
        value: String(valueParts.join(':') || '').trim(),
      };
    })
    .filter((row) => row.label || row.value);

const normalizeSpecs = (specs) => (specs && typeof specs === 'object' ? specs : {});

const buildSpecificationsPayload = (form) => {
  const taxonomy = {
    family: null,
    category: null,
    subcategory: null,
    series: null,
  };

  const payload = {
    overview: String(form.overview || '').trim(),
    tags: linesToArray(form.tags),
    features: linesToArray(form.features),
    platforms: linesToArray(form.platforms),
    use_cases: linesToArray(form.use_cases),
    technical_specs: linesToTechnicalSpecs(form.technical_specs),
    taxonomy,
  };

  const hasTaxonomy = Object.values(taxonomy).some(Boolean);
  const hasContent =
    payload.overview ||
    payload.tags.length > 0 ||
    payload.features.length > 0 ||
    payload.platforms.length > 0 ||
    payload.use_cases.length > 0 ||
    payload.technical_specs.length > 0 ||
    hasTaxonomy;

  if (!hasContent) {
    return null;
  }

  if (!hasTaxonomy) {
    delete payload.taxonomy;
  }

  return payload;
};

const formatPrice = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '-';
  return `${n.toLocaleString('fr-FR')} FCFA`;
};

const LOCALHOST_IMAGE_PATTERN = /(?:127\.0\.0\.1|localhost)/i;

const normalizeMediaUrl = (value) => {
  const normalized = String(value || '').trim();
  if (!normalized) return '';
  if (LOCALHOST_IMAGE_PATTERN.test(normalized)) return '';
  return normalized;
};

const handleImageError = (event, fallback = '/images/default.webp') => {
  const img = event.currentTarget || event.target;
  if (!img) return;
  if (img.dataset.fallbackApplied === '1') return;
  img.dataset.fallbackApplied = '1';
  img.src = fallback;
};

const getProductImages = (product) => {
  if (!product) return [];

  if (Array.isArray(product.images) && product.images.length > 0) {
    return product.images
      .map((image) => ({
        id: image?.id,
        url: normalizeMediaUrl(image?.url || image?.path),
        alt: image?.alt || product.title || product.titre || 'Produit',
      }))
      .filter((image) => Boolean(image.url));
  }

  return (Array.isArray(product.image_urls) ? product.image_urls : [])
    .map((url) => normalizeMediaUrl(url))
    .filter(Boolean)
    .map((url, index) => ({
      id: `url-${index}`,
      url,
      alt: product.title || product.titre || 'Produit',
    }));
};

const getProductImage = (product) => {
  const direct = normalizeMediaUrl(product?.image_url);
  if (direct) return direct;

  const firstImage = getProductImages(product)[0];
  if (firstImage?.url) return firstImage.url;

  return '/images/default.webp';
};

const getCategoryImage = (category) => {
  if (!category) return '/images/produits/proj.webp';

  const rawImage =
    category?.image_url ||
    category?.image_path ||
    category?.thumbnail ||
    category?.photo_url ||
    category?.image?.url ||
    category?.image;

  if (typeof rawImage === 'string' && rawImage.trim()) {
    return rawImage.trim();
  }

  return '/images/produits/proj.webp';
};

const isTrashedProduct = (product) => Boolean(product?.deleted_at || product?.is_deleted);

const isLowStockProduct = (product) => {
  const stock = Number(product?.stock ?? 0);
  const alert = Number(product?.stock_alert ?? product?.stock_alerte ?? 0);
  if (!Number.isFinite(stock) || !Number.isFinite(alert)) return false;
  return stock <= alert;
};

const productToForm = (product) => {
  const specs = normalizeSpecs(product?.specifications);

  return {
    title: product?.title || product?.titre || '',
    reference: product?.reference || '',
    modele: product?.modele || '',
    marque: product?.marque || '',
    statut: product?.statut || 'disponible',
    price: product?.price ?? product?.prix ?? '',
    prix_promo: product?.promo_price ?? product?.prix_promo ?? '',
    stock: product?.stock ?? 0,
    stock_alerte: product?.stock_alert ?? product?.stock_alerte ?? 5,
    id_categorie: product?.category_id ?? product?.id_categorie ?? '',
    id_pays: product?.id_pays ?? '',
    garantie: product?.garantie || '',
    poids: product?.poids ?? '',
    slug: product?.slug || '',
    description_courte: product?.short_description || product?.description_courte || '',
    description: product?.description || '',
    overview: specs?.overview || '',
    features: arrayToLines(specs?.features),
    technical_specs: technicalSpecsToLines(specs?.technical_specs),
    tags: arrayToLines(specs?.tags),
    platforms: arrayToLines(specs?.platforms),
    use_cases: arrayToLines(specs?.use_cases),
    image_urls: arrayToLines(product?.image_urls),
    est_en_vedette: Boolean(product?.est_en_vedette),
    est_nouveau: Boolean(product?.est_nouveau),
    en_promo: Boolean(product?.en_promo),
  };
};

const parseApiError = (err, fallbackMessage) => {
  const fields = err?.response?.data?.errors;
  if (fields && typeof fields === 'object') {
    return Object.values(fields).flat().join(' ');
  }

  return err?.response?.data?.message || fallbackMessage;
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [countries, setCountries] = useState([]);
  const [meta, setMeta] = useState(null);
  const [productStats, setProductStats] = useState({
    total: 0,
    vedette: 0,
    lowStock: 0,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lookupsLoading, setLookupsLoading] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const { toast, showToast } = useAdminToast();

  const [activeTab, setActiveTab] = useState('products');

  const [filters, setFilters] = useState({
    q: '',
    statut: 'all',
    id_categorie: 'all',
    trashed: '',
    page: 1,
    per_page: 20,
  });

  const [editorMode, setEditorMode] = useState('idle');
  const [currentProductId, setCurrentProductId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [uploadFiles, setUploadFiles] = useState([]);
  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [categoryQuery, setCategoryQuery] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  const [categoryActionLoadingId, setCategoryActionLoadingId] = useState(null);
  const [categoryErrorMessage, setCategoryErrorMessage] = useState('');
  const [categorySuccessMessage, setCategorySuccessMessage] = useState('');
  const [categoryImageFile, setCategoryImageFile] = useState(null);
  const [categoryImagePreview, setCategoryImagePreview] = useState(null);

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      const id = Number(category.id ?? category.id_categorie);
      if (id) map.set(id, category);
    });
    return map;
  }, [categories]);

  const countriesById = useMemo(() => {
    const map = new Map();
    countries.forEach((country) => {
      const id = Number(country.id ?? country.id_pays);
      if (id) map.set(id, country);
    });
    return map;
  }, [countries]);

  const selectedProduct = useMemo(
    () => products.find((item) => Number(item.id ?? item.id_produit) === Number(currentProductId)) || null,
    [products, currentProductId]
  );

  const selectedProductImages = useMemo(() => getProductImages(selectedProduct), [selectedProduct]);

  const filteredCategories = useMemo(() => {
    const query = categoryQuery.trim().toLowerCase();
    if (!query) return categories;

    return categories.filter((category) => {
      const name = String(category.nom || '').toLowerCase();
      const slug = String(category.slug || '').toLowerCase();
      const description = String(category.description || '').toLowerCase();
      return name.includes(query) || slug.includes(query) || description.includes(query);
    });
  }, [categories, categoryQuery]);

  const topLevelCategories = useMemo(
    () => categories.filter((category) => Number(category.parent_id ?? category.parent?.id ?? 0) === 0),
    [categories]
  );

  const technicalRootCategory = useMemo(() => {
    const bySlug = topLevelCategories.find(
      (category) => String(category.slug || '').trim().toLowerCase() === 'catalogue-produits-techniques'
    );
    if (bySlug) return bySlug;

    const byName = topLevelCategories.find((category) =>
      String(category.nom || '').trim().toLowerCase().includes('catalogue produits techniques')
    );
    if (byName) return byName;

    return topLevelCategories[0] || null;
  }, [topLevelCategories]);

  const technicalRootId = Number(technicalRootCategory?.id ?? technicalRootCategory?.id_categorie ?? 0);

  const mainCategoriesAll = useMemo(() => {
    if (!technicalRootId) return [];
    return categories.filter((category) => Number(category.parent_id ?? category.parent?.id ?? 0) === technicalRootId);
  }, [categories, technicalRootId]);

  const mainCategories = useMemo(() => {
    if (!technicalRootId) return [];
    return filteredCategories.filter((category) => Number(category.parent_id ?? category.parent?.id ?? 0) === technicalRootId);
  }, [filteredCategories, technicalRootId]);

  const subCategories = useMemo(() => {
    const mainIds = new Set(mainCategoriesAll.map((category) => Number(category.id ?? category.id_categorie)).filter(Boolean));
    if (mainIds.size === 0) return [];

    return filteredCategories.filter((category) => mainIds.has(Number(category.parent_id ?? category.parent?.id ?? 0)));
  }, [filteredCategories, mainCategoriesAll]);

  const subcategoryParentCategories = useMemo(
    () => mainCategoriesAll.filter((category) => Number(category.id ?? category.id_categorie) !== Number(editingCategoryId || 0)),
    [mainCategoriesAll, editingCategoryId]
  );

  const isCategoryManagementTab = activeTab === 'categories' || activeTab === 'subcategories';
  const isSubcategoryTab = activeTab === 'subcategories';
  const managedCategories = isSubcategoryTab ? subCategories : mainCategories;
  const categoryManagementTitle = editingCategoryId
    ? isSubcategoryTab
      ? 'Modifier une sous-categorie'
      : 'Modifier une categorie principale'
    : isSubcategoryTab
      ? 'Gestion des sous-categories'
      : 'Gestion des categories principales';

  const buildDefaultCategoryForm = useCallback(
    (targetTab = activeTab) => {
      const defaultParentId =
        targetTab === 'subcategories'
          ? String(subcategoryParentCategories[0]?.id ?? subcategoryParentCategories[0]?.id_categorie ?? '')
          : String(technicalRootId || '');

      return {
        ...INITIAL_CATEGORY_FORM,
        parent_id: defaultParentId,
      };
    },
    [activeTab, subcategoryParentCategories, technicalRootId]
  );

  const ensureFormDefaults = useCallback((nextCategories, nextCountries) => {
    setForm((previous) => {
      const updates = {};

      if (!previous.id_categorie && nextCategories.length > 0) {
        updates.id_categorie = String(nextCategories[0].id ?? nextCategories[0].id_categorie);
      }

      if (!previous.id_pays && nextCountries.length > 0) {
        updates.id_pays = String(nextCountries[0].id ?? nextCountries[0].id_pays);
      }

      if (Object.keys(updates).length === 0) {
        return previous;
      }

      return { ...previous, ...updates };
    });
  }, []);

  const loadLookups = useCallback(async () => {
    setLookupsLoading(true);
    try {
      const [categoriesResponse, countriesResponse] = await Promise.all([
        getCategories({ segment: 'general' }),
        getCountries({ per_page: 250 }),
      ]);

      const nextCategories = Array.isArray(categoriesResponse.data) ? categoriesResponse.data : [];
      const nextCountries = Array.isArray(countriesResponse.data) ? countriesResponse.data : [];

      setCategories(nextCategories);
      setCountries(nextCountries);
      ensureFormDefaults(nextCategories, nextCountries);
    } catch (error) {
      setCategories([]);
      setCountries([]);
      setErrorMessage('Impossible de charger les categories ou les pays.');
      showToast('Impossible de charger les categories ou les pays.', 'error');
    } finally {
      setLookupsLoading(false);
    }
  }, [ensureFormDefaults, showToast]);

  const loadProducts = useCallback(
    async () => {
      setLoading(true);
      setErrorMessage('');

      try {
        const params = {
          segment: 'general',
          page: filters.page,
          per_page: filters.per_page,
        };

        if (filters.q.trim()) {
          params.q = filters.q.trim();
        }

        if (filters.statut !== 'all') {
          params.statut = filters.statut;
        }

        if (filters.id_categorie !== 'all') {
          params.id_categorie = Number(filters.id_categorie);
        }

        if (filters.trashed) {
          params.trashed = filters.trashed;
        }

        const res = await getProducts(params);
        const nextProducts = Array.isArray(res.data) ? res.data : [];
        const nextMeta = res.meta || EMPTY_META;

        setProducts(nextProducts);
        setMeta(nextMeta);
        setProductStats({
          total: Number(nextMeta.total || nextProducts.length || 0),
          vedette: nextProducts.filter((item) => Boolean(item.est_en_vedette)).length,
          lowStock: nextProducts.filter((item) => isLowStockProduct(item)).length,
        });

        setCurrentProductId((previous) => {
          if (!previous) {
            return nextProducts[0] ? Number(nextProducts[0].id ?? nextProducts[0].id_produit) : null;
          }

          const exists = nextProducts.some((item) => Number(item.id ?? item.id_produit) === Number(previous));
          if (exists) {
            return previous;
          }

          return nextProducts[0] ? Number(nextProducts[0].id ?? nextProducts[0].id_produit) : null;
        });
      } catch (error) {
        setProducts([]);
        setMeta(EMPTY_META);
        setProductStats({ total: 0, vedette: 0, lowStock: 0 });
        setErrorMessage('Impossible de charger la liste des produits.');
      } finally {
        setLoading(false);
      }
    },
    [filters]
  );

  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  const setFilter = (key, value) => {
    setFilters((previous) => {
      if (key === 'page') {
        return { ...previous, page: value };
      }

      return { ...previous, [key]: value, page: 1 };
    });
  };

  const handleResetFilters = () => {
    setFilters({
      q: '',
      statut: 'all',
      id_categorie: 'all',
      trashed: '',
      page: 1,
      per_page: 20,
    });
  };

  const handleStartCreate = () => {
    setEditorMode('create');
    setCurrentProductId(null);
    setUploadFiles([]);
    setErrorMessage('');
    setSuccessMessage('');

    const defaultCategory = categories[0] ? String(categories[0].id ?? categories[0].id_categorie) : '';
    const defaultCountry = countries[0] ? String(countries[0].id ?? countries[0].id_pays) : '';

    setForm({
      ...INITIAL_FORM,
      id_categorie: defaultCategory,
      id_pays: defaultCountry,
    });
  };

  const handleStartEdit = (product) => {
    const id = Number(product.id ?? product.id_produit);
    setEditorMode('edit');
    setCurrentProductId(id);
    setUploadFiles([]);
    setErrorMessage('');
    setSuccessMessage('');
    setForm(productToForm(product));
  };

  const handleCancelEdit = () => {
    setEditorMode('idle');
    setUploadFiles([]);
    setErrorMessage('');
    setSuccessMessage('');
    if (selectedProduct) {
      setForm(productToForm(selectedProduct));
    } else {
      setForm(INITIAL_FORM);
    }
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (!form.title.trim()) {
      setErrorMessage('Le titre du produit est obligatoire.');
      showToast('Le titre du produit est obligatoire.', 'error');
      return;
    }

    if (!form.id_categorie) {
      setErrorMessage('La categorie est obligatoire.');
      showToast('La categorie est obligatoire.', 'error');
      return;
    }

    if (!form.id_pays) {
      setErrorMessage('Le pays est obligatoire.');
      showToast('Le pays est obligatoire.', 'error');
      return;
    }

    setSaving(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const reference = String(form.reference || '').trim();
      const modele = String(form.modele || '').trim();
      const marque = String(form.marque || '').trim();
      const garantie = String(form.garantie || '').trim();
      const slug = String(form.slug || '').trim();
      const descriptionCourte = String(form.description_courte || '').trim();
      const description = String(form.description || '').trim();

      const payload = {
        title: String(form.title || '').trim(),
        reference: reference || null,
        modele: modele || null,
        marque: marque || null,
        statut: String(form.statut || 'disponible').trim() || 'disponible',
        price: Number(form.price || 0),
        prix_promo: form.prix_promo === '' ? null : Number(form.prix_promo),
        stock: Number(form.stock || 0),
        stock_alerte: Number(form.stock_alerte || 0),
        id_categorie: Number(form.id_categorie),
        id_pays: Number(form.id_pays),
        garantie: garantie || null,
        poids: form.poids === '' ? null : Number(form.poids),
        slug: slug || null,
        description_courte: descriptionCourte || null,
        description: description || null,
        est_en_vedette: Boolean(form.est_en_vedette),
        est_nouveau: Boolean(form.est_nouveau),
        en_promo: Boolean(form.en_promo),
        segment: 'general',
      };

      const specsPayload = buildSpecificationsPayload(form);
      if (specsPayload) {
        payload.specifications = specsPayload;
      }

      const imageUrls = linesToArray(form.image_urls);
      if (imageUrls.length > 0) {
        payload.image_urls = imageUrls;
      }

      let targetId = currentProductId;
      if (editorMode === 'edit' && currentProductId) {
        await updateProduct(currentProductId, payload);
      } else {
        const response = await createProduct(payload);
        targetId = response?.data?.data?.id || response?.data?.data?.id_produit || null;
      }

      if (targetId && uploadFiles.length > 0) {
        await uploadProductImages(targetId, uploadFiles);
      }

      const message = editorMode === 'edit' ? 'Produit mis a jour avec succes.' : 'Produit cree avec succes.';
      setSuccessMessage(message);
      showToast(message, 'success');
      setEditorMode('edit');
      setUploadFiles([]);
      if (targetId) {
        setCurrentProductId(Number(targetId));
      }

      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Echec de la sauvegarde du produit.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer ce produit ?')) return;
    setActionLoadingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteProduct(id);
      setSuccessMessage('Produit supprime.');
      showToast('Produit supprime.', 'success');
      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Suppression impossible.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRestore = async (id) => {
    if (!window.confirm('Restaurer ce produit ?')) return;
    setActionLoadingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await restoreProduct(id);
      setSuccessMessage('Produit restaure.');
      showToast('Produit restaure.', 'success');
      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Restauration impossible.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleForceDelete = async (id) => {
    if (!window.confirm('Supprimer definitivement ce produit ? Cette action est irreversible.')) return;
    setActionLoadingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await forceDeleteProduct(id);
      setSuccessMessage('Produit supprime definitivement.');
      showToast('Produit supprime definitivement.', 'success');
      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Suppression definitive impossible.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleToggleVedette = async (id) => {
    setActionLoadingId(id);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await toggleProductVedette(id);
      setSuccessMessage('Etat vedette mis a jour.');
      showToast('Etat vedette mis a jour.', 'success');
      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Mise a jour vedette impossible.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteImage = async (productId, imageId) => {
    if (!window.confirm('Supprimer cette image ?')) return;

    setActionLoadingId(productId);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      await deleteProductImage(productId, imageId);
      setSuccessMessage('Image supprimee avec succes.');
      showToast('Image supprimee avec succes.', 'success');
      await loadProducts();
    } catch (error) {
      const message = parseApiError(error, 'Suppression de l image impossible.');
      setErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleCancelCategoryEdit = () => {
    setEditingCategoryId(null);
    setCategoryEditorOpen(false);
    setCategoryForm(buildDefaultCategoryForm());
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');
    setCategoryImageFile(null);
    if (categoryImagePreview) {
      try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
    }
    setCategoryImagePreview(null);
  };

  const handleStartCreateCategory = () => {
    setEditingCategoryId(null);
    setCategoryEditorOpen(true);
    setCategoryForm(buildDefaultCategoryForm());
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');
    setCategoryImageFile(null);
    if (categoryImagePreview) {
      try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
    }
    setCategoryImagePreview(null);
  };

  const handleOpenCategoryManagement = (tab) => {
    if (tab === 'products') {
      setActiveTab('products');
      setCategoryEditorOpen(false);
      return;
    }

    setActiveTab(tab);
    setCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');
    setCategoryForm(buildDefaultCategoryForm(tab));
  };

  const handleStartEditCategory = (category) => {
    const id = Number(category.id ?? category.id_categorie);
    setEditingCategoryId(id);
    setCategoryEditorOpen(true);
    setCategoryForm({
      nom: category.nom || '',
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id ? String(category.parent_id) : '',
      ordre: Number(category.ordre ?? 0),
      image_url: category.image_url || category.image || '',
      actif: category.actif !== false,
    });
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');
    setCategoryImageFile(null);
    if (categoryImagePreview) {
      try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
    }
    setCategoryImagePreview(null);
  };

  const handleSaveCategory = async (event) => {
    event.preventDefault();

    const isSubcategoryMode = activeTab === 'subcategories';

    const nom = String(categoryForm.nom || '').trim();
    if (!nom) {
      setCategoryErrorMessage('Le nom de la categorie est obligatoire.');
      showToast('Le nom de la categorie est obligatoire.', 'error');
      return;
    }

    if (isSubcategoryMode && !categoryForm.parent_id) {
      setCategoryErrorMessage('La categorie parente est obligatoire pour une sous-categorie.');
      showToast('La categorie parente est obligatoire pour une sous-categorie.', 'error');
      return;
    }

    if (!isSubcategoryMode && !technicalRootId) {
      setCategoryErrorMessage('Categorie racine du catalogue introuvable. Impossible de creer une categorie principale.');
      showToast('Categorie racine du catalogue introuvable. Impossible de creer une categorie principale.', 'error');
      return;
    }

    const isEditingCategory = Boolean(editingCategoryId);

    setSavingCategory(true);
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');

    try {
      const payload = {
        nom,
        slug: String(categoryForm.slug || '').trim() || undefined,
        description: String(categoryForm.description || '').trim() || null,
        parent_id: isSubcategoryMode ? Number(categoryForm.parent_id) : technicalRootId,
        ordre: Number(categoryForm.ordre || 0),
        actif: Boolean(categoryForm.actif),
        segment: 'general',
      };

      // For subcategories allow either an uploaded image file or an existing image_url
      if (isSubcategoryMode) {
        if (categoryImageFile) {
          payload.image = categoryImageFile;
        } else if (String(categoryForm.image_url || '').trim()) {
          payload.image_url = String(categoryForm.image_url || '').trim() || null;
        }
      }

      if (isEditingCategory && editingCategoryId) {
        await updateCategory(editingCategoryId, payload);
      } else {
        await createCategory(payload);
      }

      const message = isEditingCategory
        ? isSubcategoryMode
          ? 'Sous-categorie mise a jour avec succes.'
          : 'Categorie principale mise a jour avec succes.'
        : isSubcategoryMode
          ? 'Sous-categorie creee avec succes.'
          : 'Categorie principale creee avec succes.';
      setCategorySuccessMessage(message);
      showToast(message, 'success');

      setEditingCategoryId(null);
      setCategoryEditorOpen(false);
      setCategoryForm(buildDefaultCategoryForm(isSubcategoryMode ? 'subcategories' : 'categories'));
      // clear any selected file preview
      setCategoryImageFile(null);
      if (categoryImagePreview) {
        try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
      }
      setCategoryImagePreview(null);
      await loadLookups();
    } catch (error) {
      const message = parseApiError(error, 'Echec de la sauvegarde de la categorie.');
      setCategoryErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setSavingCategory(false);
    }
  };

  const handleDeleteCategory = async (id) => {
    if (!window.confirm('Supprimer cette categorie ?')) return;

    setCategoryActionLoadingId(id);
    setCategoryErrorMessage('');
    setCategorySuccessMessage('');

    try {
      await deleteCategory(id);
      const message = 'Categorie supprimee avec succes.';
      setCategorySuccessMessage(message);
      showToast(message, 'success');

      if (Number(editingCategoryId) === Number(id)) {
        handleCancelCategoryEdit();
      }

      await loadLookups();
    } catch (error) {
      const message = parseApiError(error, 'Suppression de la categorie impossible.');
      setCategoryErrorMessage(message);
      showToast(message, 'error');
    } finally {
      setCategoryActionLoadingId(null);
    }
  };

  const renderTable = () => {
    if (loading) {
      return <div className="admin-products-empty">Chargement des produits...</div>;
    }

    if (!products || products.length === 0) {
      return <div className="admin-products-empty">Aucun produit trouve.</div>;
    }

    return (
      <div className="admin-products-table-wrap">
        <table className="admin-products-table">
          <thead>
            <tr>
              <th>Produit</th>
              <th>Categorie</th>
              <th>Prix / Stock</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const id = Number(product.id ?? product.id_produit);
              const isTrashed = isTrashedProduct(product);
              const isSelected = Number(currentProductId) === id;
              const categoryName =
                categoriesById.get(Number(product.category_id ?? product.id_categorie))?.nom ||
                product.category_name ||
                product.categorie?.nom ||
                '-';

              const status = String(product.statut || 'indisponible').toLowerCase();
              const statusClass = isTrashed ? 'admin-products-status admin-products-status--trashed' : `admin-products-status admin-products-status--${status}`;

              return (
                <tr key={id} className={`${isTrashed ? 'is-trashed' : ''} ${isSelected ? 'is-selected' : ''}`}>
                  <td>
                    <div className="admin-products-product-cell">
                      <img src={getProductImage(product)} alt={product.title || product.titre || 'Produit'} loading="lazy" onError={handleImageError} />
                      <div>
                        <strong>{product.title || product.titre || 'Sans titre'}</strong>
                        <span>#{id}</span>
                        <small>{product.reference || 'Reference N/A'}</small>
                        <small>{product.modele || 'Modele N/A'}</small>
                      </div>
                    </div>
                  </td>
                  <td>{categoryName}</td>
                  <td>
                    <div className="admin-products-price-cell">
                      <strong>{formatPrice(product.price ?? product.prix)}</strong>
                      {product.prix_promo ? <span>Promo: {formatPrice(product.prix_promo)}</span> : <span>Aucune promo</span>}
                    </div>
                    <div className="admin-products-stock-cell">
                      <strong>Stock: {Number(product.stock ?? 0)}</strong>
                      <span>Alerte: {Number(product.stock_alert ?? product.stock_alerte ?? 0)}</span>
                      {isLowStockProduct(product) ? <span className="admin-products-stock-warning">Stock faible</span> : null}
                    </div>
                  </td>
                  <td>
                    <span className={statusClass}>{status}</span>
                    <div className="admin-products-badges">
                      {product.est_en_vedette ? <span>Vedette</span> : null}
                      {product.est_nouveau ? <span>Nouveau</span> : null}
                      {product.en_promo ? <span>Promo</span> : null}
                    </div>
                  </td>
                  <td>
                    <div className="admin-products-row-actions">
                      {!isTrashed ? (
                        <button type="button" className="admin-products-btn" disabled={actionLoadingId === id} onClick={() => handleStartEdit(product)}>
                          Editer
                        </button>
                      ) : null}

                      {!isTrashed ? (
                        <button type="button" className="admin-products-btn" disabled={actionLoadingId === id} onClick={() => handleToggleVedette(id)}>
                          Vedette
                        </button>
                      ) : null}

                      {!isTrashed ? (
                        <button type="button" className="admin-products-btn admin-products-danger" disabled={actionLoadingId === id} onClick={() => handleDelete(id)}>
                          Supprimer
                        </button>
                      ) : null}

                      {isTrashed ? (
                        <button type="button" className="admin-products-btn" disabled={actionLoadingId === id} onClick={() => handleRestore(id)}>
                          Restaurer
                        </button>
                      ) : null}

                      {isTrashed ? (
                        <button type="button" className="admin-products-btn admin-products-danger" disabled={actionLoadingId === id} onClick={() => handleForceDelete(id)}>
                          Suppr. definitive
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="admin-products-page">
      <header className="admin-products-hero">
        <div className="admin-products-hero-copy">
          <h1>Gestion des produits</h1>
        </div>
        <div className="admin-products-hero-actions">
          <span className="admin-products-count">{loading ? 'Chargement...' : `${productStats.total} produit(s)`}</span>
          <div className="admin-products-hero-buttons">
            <button type="button" className="admin-products-btn" onClick={loadProducts} disabled={loading || lookupsLoading}>
              Actualiser
            </button>
            <button type="button" className="admin-products-btn" onClick={handleStartCreate} disabled={saving || lookupsLoading}>
              Nouveau produit
            </button>
          </div>
        </div>
      </header>

      <section className="admin-products-stats">
        <article className="admin-products-stat-card">
          <span>Total (filtre courant)</span>
          <strong>{productStats.total}</strong>
          <small>Produits charges</small>
        </article>
        <article className="admin-products-stat-card">
          <span>Vedette</span>
          <strong>{productStats.vedette}</strong>
          <small>Sur la page courante</small>
        </article>
        <article className="admin-products-stat-card">
          <span>Stock faible</span>
          <strong>{productStats.lowStock}</strong>
          <small>Action recommandee</small>
        </article>
      </section>

      <section className="admin-products-workspace">
        <div className="admin-products-list-panel">
          {activeTab === 'products' && (
            <section className="admin-products-card">
            <div className="admin-products-card-head">
              <h2>Liste des produits</h2>
              <span className="admin-products-count">{meta?.total || 0} au total</span>
            </div>

              <section className="admin-catalogue-tabs admin-products-tabs admin-products-tabs--primary">
                <button
                  type="button"
                  className={activeTab === 'products' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('products')}
                >
                  Produits
                </button>

                <button
                  type="button"
                  className={activeTab === 'categories' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('categories')}
                >
                  Catégories
                </button>

                <button
                  type="button"
                  className={activeTab === 'subcategories' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('subcategories')}
                >
                  Sous-catégories
                </button>
              </section>

            <div className="admin-products-searchbar">
              <input
                placeholder="Rechercher titre, reference, modele..."
                value={filters.q}
                onChange={(event) => setFilter('q', event.target.value)}
              />
              <button type="button" className="admin-products-btn" onClick={loadProducts} disabled={loading}>
                Recharger
              </button>
              <button type="button" className="admin-products-btn" onClick={handleResetFilters} disabled={loading}>
                Reinitialiser
              </button>
            </div>

            <div className="admin-products-filters">
              <select value={filters.id_categorie} onChange={(event) => setFilter('id_categorie', event.target.value)}>
                <option value="all">Toutes categories</option>
                {categories.map((category) => {
                  const id = category.id ?? category.id_categorie;
                  return (
                    <option key={id} value={id}>
                      {category.nom}
                    </option>
                  );
                })}
              </select>

              <select value={filters.statut} onChange={(event) => setFilter('statut', event.target.value)}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status === 'all' ? 'Tous statuts' : status}
                  </option>
                ))}
              </select>

              <select value={filters.per_page} onChange={(event) => setFilter('per_page', Number(event.target.value))}>
                <option value={10}>10 / page</option>
                <option value={20}>20 / page</option>
                <option value={50}>50 / page</option>
              </select>
            </div>

            <AdminNotice type="error" message={errorMessage} className="admin-products-notice" />
            {renderTable()}

            <div className="admin-products-pagination-controls">
              <button
                type="button"
                className="admin-products-btn"
                disabled={loading || Number(meta?.current_page || 1) <= 1}
                onClick={() => setFilter('page', Math.max(1, Number(meta?.current_page || 1) - 1))}
              >
                Precedent
              </button>
              <span>
                Page {Number(meta?.current_page || 1)} / {Number(meta?.last_page || 1)}
              </span>
              <button
                type="button"
                className="admin-products-btn"
                disabled={loading || Number(meta?.current_page || 1) >= Number(meta?.last_page || 1)}
                onClick={() => setFilter('page', Number(meta?.current_page || 1) + 1)}
              >
                Suivant
              </button>
            </div>
            </section>
          )}

          {isCategoryManagementTab && (
            <section id="admin-products-categories" className="admin-products-card admin-products-categories-card">
              <section className="admin-catalogue-tabs admin-products-tabs">
                <button
                  type="button"
                  className={activeTab === 'products' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('products')}
                >
                  Produits
                </button>

                <button
                  type="button"
                  className={activeTab === 'categories' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('categories')}
                >
                  Catégories
                </button>

                <button
                  type="button"
                  className={activeTab === 'subcategories' ? 'is-active' : ''}
                  onClick={() => handleOpenCategoryManagement('subcategories')}
                >
                  Sous-catégories
                </button>
              </section>
            <div className="admin-products-card-head">
              <h2>{categoryManagementTitle}</h2>
              <div className="admin-products-category-toolbar">
                <button
                  type="button"
                  className="admin-products-btn admin-products-btn--outline"
                  onClick={loadLookups}
                  disabled={lookupsLoading || savingCategory}
                >
                  {isSubcategoryTab ? 'Actualiser sous-categories' : 'Actualiser categories'}
                </button>
                <button
                  type="button"
                  className="admin-products-btn admin-products-btn--outline"
                  onClick={handleStartCreateCategory}
                  disabled={lookupsLoading || savingCategory}
                >
                  {isSubcategoryTab ? 'Nouvelle sous-categorie' : 'Nouvelle categorie'}
                </button>
                {categoryEditorOpen ? (
                  <button
                    type="button"
                    className="admin-products-btn admin-products-btn--outline"
                    onClick={handleCancelCategoryEdit}
                    disabled={savingCategory}
                  >
                    Fermer formulaire
                  </button>
                ) : null}
              </div>
            </div>

            {!isSubcategoryTab ? (
              <p className="admin-products-note admin-products-note--compact">
                Catalogue parent: <strong>{technicalRootCategory?.nom || 'Non trouve en base'}</strong>
              </p>
            ) : null}

            <div className="admin-products-searchbar admin-products-category-searchbar">
              <input
                placeholder={isSubcategoryTab ? 'Rechercher sous-categorie, slug, description...' : 'Rechercher categorie, slug, description...'}
                value={categoryQuery}
                onChange={(event) => setCategoryQuery(event.target.value)}
              />
            </div>

            <AdminNotice type="error" message={categoryErrorMessage} className="admin-products-notice" />
            <AdminNotice type="success" message={categorySuccessMessage} className="admin-products-notice" />

            {lookupsLoading ? (
              <div className="admin-products-empty">{isSubcategoryTab ? 'Chargement des sous-categories...' : 'Chargement des categories...'}</div>
            ) : !technicalRootId ? (
              <div className="admin-products-empty">Racine catalogue introuvable dans la base de donnees.</div>
            ) : managedCategories.length === 0 ? (
              <div className="admin-products-empty">{isSubcategoryTab ? 'Aucune sous-categorie trouvee.' : 'Aucune categorie trouvee.'}</div>
            ) : (
              <div className="admin-products-table-wrap">
                <table className="admin-products-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      {isSubcategoryTab ? <th>Image</th> : null}
                      <th>{isSubcategoryTab ? 'Sous-categorie' : 'Categorie'}</th>
                      {isSubcategoryTab ? <th>Parent</th> : null}
                      <th>Produits</th>
                      <th>Ordre</th>
                      <th>Actif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {managedCategories.map((category) => {
                      const id = Number(category.id ?? category.id_categorie);
                      const parentName = category.parent?.nom || categoriesById.get(Number(category.parent_id || 0))?.nom || '-';
                      const categoryThumb = getCategoryImage(category);

                      return (
                        <tr key={id}>
                          <td>#{id}</td>
                          {isSubcategoryTab ? (
                            <td>
                              <img
                                className="admin-products-category-thumb"
                                src={categoryThumb}
                                alt={category.nom || 'Categorie'}
                                loading="lazy"
                                onError={(event) => handleImageError(event, '/images/produits/proj.webp')}
                              />
                            </td>
                          ) : null}
                          <td>
                            <div className="admin-products-product-cell">
                              <div>
                                <strong>{category.nom || 'Sans nom'}</strong>
                                <small>{category.slug || 'slug auto'}</small>
                                <small>{category.description || 'Sans description'}</small>
                              </div>
                            </div>
                          </td>
                          {isSubcategoryTab ? <td>{parentName}</td> : null}
                          <td>{Number(category.produits_count ?? 0)}</td>
                          <td>{Number(category.ordre ?? 0)}</td>
                          <td>
                            <span className={`admin-products-status ${category.actif === false ? 'admin-products-status--indisponible' : 'admin-products-status--disponible'}`}>
                              {category.actif === false ? 'Non' : 'Oui'}
                            </span>
                          </td>
                          <td>
                            <div className="admin-products-category-actions">
                              <button
                                type="button"
                                className="admin-products-btn admin-products-btn--outline"
                                disabled={categoryActionLoadingId === id}
                                onClick={() => handleStartEditCategory(category)}
                              >
                                Editer
                              </button>
                              <button
                                type="button"
                                className="admin-products-btn admin-products-btn--outline admin-products-danger"
                                disabled={categoryActionLoadingId === id}
                                onClick={() => handleDeleteCategory(id)}
                              >
                                Supprimer
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            </section>
          )}
        </div>

        {isCategoryManagementTab && categoryEditorOpen ? (
          <div className="admin-modal-overlay admin-products-modal-overlay" onClick={handleCancelCategoryEdit}>
            <div className="admin-products-modal-shell admin-products-category-modal-shell" onClick={(event) => event.stopPropagation()}>
              <section className="admin-products-card admin-modal admin-products-modal admin-products-category-modal" role="dialog" aria-modal="true" aria-label="Edition categorie">
                <div className="admin-products-card-head">
                  <h2>{editingCategoryId ? categoryManagementTitle : isSubcategoryTab ? 'Creer une sous-categorie' : 'Creer une categorie principale'}</h2>
                  <button
                    type="button"
                    className="admin-products-btn admin-products-btn--outline"
                    onClick={handleCancelCategoryEdit}
                    disabled={savingCategory}
                  >
                    Fermer
                  </button>
                </div>

                {isSubcategoryTab ? (
                  <div className="admin-products-summary admin-products-summary--compact">
                    <img
                      src={categoryImagePreview || getCategoryImage(categoryForm)}
                      alt={categoryForm.nom || 'Categorie'}
                      loading="lazy"
                      onError={(event) => handleImageError(event, '/images/produits/proj.webp')}
                    />
                    <div>
                      <p className="admin-products-summary-kicker">Apercu image</p>
                      <h3>{categoryForm.nom || 'Nouvelle sous-categorie'}</h3>
                      <p>
                        {categoryForm.description || 'Ajoutez une description et televersez une image pour faciliter la gestion depuis la base de donnees.'}
                      </p>
                    </div>
                  </div>
                ) : null}

                <form className="admin-products-category-form" onSubmit={handleSaveCategory}>
                  <label>
                    Nom
                    <input
                      value={categoryForm.nom}
                      onChange={(event) => setCategoryForm((previous) => ({ ...previous, nom: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Slug
                    <input
                      value={categoryForm.slug}
                      onChange={(event) => setCategoryForm((previous) => ({ ...previous, slug: event.target.value }))}
                      placeholder="optionnel"
                    />
                  </label>
                  {isSubcategoryTab ? (
                    <label>
                      Categorie parente
                      <select
                        value={categoryForm.parent_id}
                        onChange={(event) => setCategoryForm((previous) => ({ ...previous, parent_id: event.target.value }))}
                        required
                      >
                        <option value="">Selectionner une categorie</option>
                        {subcategoryParentCategories.map((category) => {
                          const id = category.id ?? category.id_categorie;
                          return (
                            <option key={id} value={id}>
                              {category.nom}
                            </option>
                          );
                        })}
                      </select>
                    </label>
                  ) : (
                    <label>
                      Type
                      <input value="Categorie principale" readOnly />
                    </label>
                  )}
                  <label>
                    Ordre
                    <input
                      type="number"
                      min="0"
                      value={categoryForm.ordre}
                      onChange={(event) => setCategoryForm((previous) => ({ ...previous, ordre: event.target.value }))}
                    />
                  </label>

                  {isSubcategoryTab ? (
                    <label className="admin-products-image-field">
                      Image
                      <div className="admin-products-image-input">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(event) => {
                            const file = event.target.files && event.target.files[0];
                            if (!file) {
                              if (categoryImagePreview) {
                                try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
                              }
                              setCategoryImageFile(null);
                              setCategoryImagePreview(null);
                              return;
                            }
                            if (categoryImagePreview) {
                              try { URL.revokeObjectURL(categoryImagePreview); } catch (e) {}
                            }
                            setCategoryImageFile(file);
                            setCategoryImagePreview(URL.createObjectURL(file));
                          }}
                        />

                        <div className="admin-products-image-preview" aria-hidden>
                          {categoryImagePreview ? (
                            <img src={categoryImagePreview} alt={categoryForm.nom || 'Apercu'} onError={(event) => handleImageError(event, '/images/produits/proj.webp')} />
                          ) : categoryForm.image_url ? (
                            <img src={getCategoryImage(categoryForm)} alt={categoryForm.nom || 'Image actuelle'} onError={(event) => handleImageError(event, '/images/produits/proj.webp')} />
                          ) : (
                            <div className="admin-products-image-placeholder" />
                          )}
                        </div>
                      </div>

                      <small className="admin-products-image-meta">
                        {categoryImageFile ? categoryImageFile.name : categoryForm.image_url ? 'Image actuelle' : ''}
                      </small>
                    </label>
                  ) : null}
                  <label className="admin-products-category-checkbox">
                    <span className="admin-products-checkbox-label-text">Categorie active</span>
                    <input
                      type="checkbox"
                      checked={Boolean(categoryForm.actif)}
                      onChange={(event) => setCategoryForm((previous) => ({ ...previous, actif: event.target.checked }))}
                    />
                  </label>
                  <label className="admin-products-category-full">
                    Description
                    <textarea
                      rows={3}
                      value={categoryForm.description}
                      onChange={(event) => setCategoryForm((previous) => ({ ...previous, description: event.target.value }))}
                    />
                  </label>

                  <div className="admin-products-actions admin-products-category-actions-bar">
                    <button
                      type="button"
                      className="admin-products-btn admin-products-btn--outline"
                      onClick={handleCancelCategoryEdit}
                      disabled={savingCategory}
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      className="admin-products-btn admin-products-btn--outline"
                      disabled={savingCategory || lookupsLoading}
                    >
                      {savingCategory
                        ? 'Sauvegarde...'
                        : editingCategoryId
                          ? isSubcategoryTab
                            ? 'Enregistrer sous-categorie'
                            : 'Enregistrer categorie'
                          : isSubcategoryTab
                            ? 'Creer sous-categorie'
                            : 'Creer categorie'}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        ) : null}

        {(editorMode === 'create' || editorMode === 'edit') ? (
          <div className="admin-modal-overlay admin-products-modal-overlay" onClick={handleCancelEdit}>
            <div className="admin-products-modal-shell" onClick={(event) => event.stopPropagation()}>
              <section className="admin-products-card admin-modal admin-products-modal" role="dialog" aria-modal="true" aria-label="Edition produit">
            <div className="admin-products-card-head">
              <h2>
                {editorMode === 'create' ? 'Creer un produit' : editorMode === 'edit' ? 'Modifier le produit' : 'Editeur produit'}
              </h2>
              <div className="admin-products-inline-actions">
                <button type="button" className="admin-products-btn" onClick={handleStartCreate} disabled={saving || lookupsLoading}>
                  Nouveau
                </button>
                {editorMode !== 'idle' ? (
                  <button type="button" className="admin-products-btn" onClick={handleCancelEdit} disabled={saving}>
                    Annuler
                  </button>
                ) : null}
              </div>
            </div>

            {selectedProduct ? (
              <div className="admin-products-summary">
                <img src={getProductImage(selectedProduct)} alt={selectedProduct.title || selectedProduct.titre || 'Produit'} loading="lazy" onError={handleImageError} />
                <div>
                  <p className="admin-products-summary-kicker">Selection courante</p>
                  <h3>{selectedProduct.title || selectedProduct.titre || 'Sans titre'}</h3>
                  <p>{selectedProduct.description_courte || selectedProduct.description || 'Aucune description.'}</p>
                  <div className="admin-products-summary-tags">
                    <span>{categoriesById.get(Number(selectedProduct.category_id ?? selectedProduct.id_categorie))?.nom || selectedProduct.category_name || 'Categorie inconnue'}</span>
                    <span>{countriesById.get(Number(selectedProduct.id_pays))?.nom || 'Pays inconnu'}</span>
                    <span>{formatPrice(selectedProduct.price ?? selectedProduct.prix)}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="admin-products-summary admin-products-summary--empty">Selectionnez un produit dans la liste ou cliquez sur Nouveau.</div>
            )}

            <AdminNotice type="success" message={successMessage} className="admin-products-notice" />

            {(editorMode === 'create' || editorMode === 'edit') && (
              <form className="admin-products-form" onSubmit={handleSave}>
                <div className="admin-products-grid">
                  <label>
                    Titre
                    <input
                      value={form.title}
                      onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Reference
                    <input
                      value={form.reference}
                      onChange={(event) => setForm((previous) => ({ ...previous, reference: event.target.value }))}
                    />
                  </label>
                  <label>
                    Marque
                    <input
                      value={form.marque}
                      onChange={(event) => setForm((previous) => ({ ...previous, marque: event.target.value }))}
                    />
                  </label>
                  <label>
                    Modele
                    <input
                      value={form.modele}
                      onChange={(event) => setForm((previous) => ({ ...previous, modele: event.target.value }))}
                    />
                  </label>

                  <label>
                    Prix (FCFA)
                    <input
                      type="number"
                      min="0"
                      value={form.price}
                      onChange={(event) => setForm((previous) => ({ ...previous, price: event.target.value }))}
                      required
                    />
                  </label>
                  <label>
                    Prix promo
                    <input
                      type="number"
                      min="0"
                      value={form.prix_promo}
                      onChange={(event) => setForm((previous) => ({ ...previous, prix_promo: event.target.value }))}
                    />
                  </label>
                  <label>
                    Stock
                    <input
                      type="number"
                      min="0"
                      value={form.stock}
                      onChange={(event) => setForm((previous) => ({ ...previous, stock: event.target.value }))}
                    />
                  </label>
                  <label>
                    Seuil alerte stock
                    <input
                      type="number"
                      min="0"
                      value={form.stock_alerte}
                      onChange={(event) => setForm((previous) => ({ ...previous, stock_alerte: event.target.value }))}
                    />
                  </label>

                  <label>
                    Statut
                    <select
                      value={form.statut}
                      onChange={(event) => setForm((previous) => ({ ...previous, statut: event.target.value }))}
                    >
                      {STATUS_OPTIONS.filter((status) => status !== 'all').map((status) => (
                        <option key={status} value={status}>
                          {status}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Categorie
                    <select
                      value={form.id_categorie}
                      onChange={(event) => setForm((previous) => ({ ...previous, id_categorie: event.target.value }))}
                      required
                    >
                      <option value="">Selectionner...</option>
                      {categories.map((category) => {
                        const id = category.id ?? category.id_categorie;
                        return (
                          <option key={id} value={id}>
                            {category.nom}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label>
                    Pays
                    <select
                      value={form.id_pays}
                      onChange={(event) => setForm((previous) => ({ ...previous, id_pays: event.target.value }))}
                      required
                    >
                      <option value="">Selectionner...</option>
                      {countries.map((country) => {
                        const id = country.id ?? country.id_pays;
                        return (
                          <option key={id} value={id}>
                            {country.nom}
                          </option>
                        );
                      })}
                    </select>
                  </label>
                  <label>
                    Garantie
                    <input
                      value={form.garantie}
                      onChange={(event) => setForm((previous) => ({ ...previous, garantie: event.target.value }))}
                    />
                  </label>

                  <label>
                    Poids (kg)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.poids}
                      onChange={(event) => setForm((previous) => ({ ...previous, poids: event.target.value }))}
                    />
                  </label>
                  <label>
                    Slug
                    <input
                      value={form.slug}
                      onChange={(event) => setForm((previous) => ({ ...previous, slug: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="admin-products-textareas">
                  <label>
                    Description courte
                    <textarea
                      rows={4}
                      value={form.description_courte}
                      onChange={(event) => setForm((previous) => ({ ...previous, description_courte: event.target.value }))}
                    />
                  </label>
                  <label>
                    Description complete
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(event) => setForm((previous) => ({ ...previous, description: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="admin-products-textareas">
                  <label>
                    Overview produit
                    <textarea
                      rows={3}
                      value={form.overview}
                      onChange={(event) => setForm((previous) => ({ ...previous, overview: event.target.value }))}
                    />
                  </label>
                  <label>
                    Tags (1 par ligne)
                    <textarea
                      rows={3}
                      value={form.tags}
                      onChange={(event) => setForm((previous) => ({ ...previous, tags: event.target.value }))}
                    />
                  </label>
                  <label>
                    Caracteristiques (1 par ligne)
                    <textarea
                      rows={3}
                      value={form.features}
                      onChange={(event) => setForm((previous) => ({ ...previous, features: event.target.value }))}
                    />
                  </label>
                  <label>
                    Specs techniques (Label: Valeur)
                    <textarea
                      rows={3}
                      value={form.technical_specs}
                      onChange={(event) => setForm((previous) => ({ ...previous, technical_specs: event.target.value }))}
                    />
                  </label>
                  <label>
                    Plateformes (1 par ligne)
                    <textarea
                      rows={3}
                      value={form.platforms}
                      onChange={(event) => setForm((previous) => ({ ...previous, platforms: event.target.value }))}
                    />
                  </label>
                  <label>
                    Cas d usage (1 par ligne)
                    <textarea
                      rows={3}
                      value={form.use_cases}
                      onChange={(event) => setForm((previous) => ({ ...previous, use_cases: event.target.value }))}
                    />
                  </label>
                </div>

                <div className="admin-products-upload-block">
                  <label>
                    URLs images (1 par ligne, optionnel)
                    <textarea
                      rows={3}
                      value={form.image_urls}
                      onChange={(event) => setForm((previous) => ({ ...previous, image_urls: event.target.value }))}
                    />
                  </label>
                  <label>
                    Televerser des images
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => setUploadFiles(Array.from(event.target.files || []))}
                    />
                  </label>
                  {uploadFiles.length > 0 ? (
                    <ul className="admin-products-upload-list">
                      {uploadFiles.map((file) => (
                        <li key={`${file.name}-${file.size}`}>{file.name}</li>
                      ))}
                    </ul>
                  ) : null}
                  <small>
                    Astuce: les images televersees seront ajoutees apres la sauvegarde du produit.
                  </small>
                </div>

                <div className="admin-products-checkboxes">
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(form.est_en_vedette)}
                      onChange={(event) => setForm((previous) => ({ ...previous, est_en_vedette: event.target.checked }))}
                    />
                    En vedette
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(form.est_nouveau)}
                      onChange={(event) => setForm((previous) => ({ ...previous, est_nouveau: event.target.checked }))}
                    />
                    Nouveau
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={Boolean(form.en_promo)}
                      onChange={(event) => setForm((previous) => ({ ...previous, en_promo: event.target.checked }))}
                    />
                    En promo
                  </label>
                </div>

                <div className="admin-products-actions">
                  <button type="submit" className="admin-products-btn" disabled={saving || lookupsLoading}>
                    {saving ? 'Sauvegarde...' : editorMode === 'edit' ? 'Enregistrer modifications' : 'Creer produit'}
                  </button>
                </div>
              </form>
            )}

            {editorMode === 'edit' && selectedProduct && (
              <div className="admin-products-image-gallery">
                <div className="admin-products-section-head">
                  <h3>Images existantes</h3>
                  <p>Vous pouvez supprimer une image sans supprimer le produit.</p>
                </div>

                {selectedProductImages.length > 0 ? (
                  <div className="admin-products-image-grid">
                    {selectedProductImages.map((image) => (
                      <figure key={`${image.id}-${image.url}`} className="admin-products-image-card">
                        <img src={image.url} alt={image.alt || 'Image produit'} loading="lazy" onError={handleImageError} />
                        <figcaption>
                          <span>{image.alt || 'Image produit'}</span>
                          {typeof image.id === 'number' ? (
                            <button
                              type="button"
                              className="admin-products-btn admin-products-danger"
                              disabled={actionLoadingId === Number(selectedProduct.id ?? selectedProduct.id_produit)}
                              onClick={() => handleDeleteImage(Number(selectedProduct.id ?? selectedProduct.id_produit), image.id)}
                            >
                              Supprimer
                            </button>
                          ) : null}
                        </figcaption>
                      </figure>
                    ))}
                  </div>
                ) : (
                  <div className="admin-products-image-empty">Aucune image enregistree.</div>
                )}
              </div>
            )}
              </section>
            </div>
          </div>
        ) : null}
      </section>

      <AdminToast toast={toast} />
    </div>
  );
}
