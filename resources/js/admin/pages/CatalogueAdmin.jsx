import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  uploadProductImages,
} from '../api';
import { useLivePolling } from '../../hooks/useLivePolling';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import DeleteIconButton from '../components/DeleteIconButton';
import '../styles/admin-shared.css';
import '../styles/catalogue-admin.css';

const GEOVISION_SEGMENT = 'geovision';

const INITIAL_CATEGORY_FORM = {
  nom: '',
  slug: '',
  description: '',
  parent_id: '',
  ordre: 10,
  image_url: '',
  image_file: null,
  existing_image: '',
  actif: true,
};

const INITIAL_MODEL_FORM = {
  title: '',
  reference: '',
  modele: '',
  id_categorie: '',
  statut: 'actif',
  marque: 'GeoVision',
  garantie: 'Garantie constructeur',
  price: 0,
  stock: 999,
  stock_alerte: 5,
  description_courte: '',
  description: '',
  overview: '',
  tags: '',
  features: '',
  platforms: '',
  use_cases: '',
  detail_notes: '',
  technical_specs: '',
  taxonomy_family: '',
  taxonomy_category: '',
  taxonomy_subcategory: '',
  taxonomy_series: '',
  source_url: '',
  est_en_vedette: false,
  est_nouveau: true,
};

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

const buildSpecsPayload = (form) => ({
  overview: form.overview || '',
  tags: linesToArray(form.tags),
  features: linesToArray(form.features),
  platforms: linesToArray(form.platforms),
  use_cases: linesToArray(form.use_cases),
  detail_notes: linesToArray(form.detail_notes),
  source_url: form.source_url || null,
  technical_specs: linesToTechnicalSpecs(form.technical_specs),
  taxonomy: {
    family: form.taxonomy_family || null,
    category: form.taxonomy_category || null,
    subcategory: form.taxonomy_subcategory || null,
    series: form.taxonomy_series || null,
  },
});

const toModelForm = (item) => {
  const specs = item?.specifications && typeof item.specifications === 'object' ? item.specifications : {};
  const taxonomy = specs.taxonomy && typeof specs.taxonomy === 'object' ? specs.taxonomy : {};

  return {
    title: item?.title || item?.titre || '',
    reference: item?.reference || '',
    modele: item?.modele || '',
    id_categorie: item?.category_id ?? item?.id_categorie ?? '',
    statut: item?.statut || 'actif',
    marque: item?.marque || 'GeoVision',
    garantie: item?.garantie || 'Garantie constructeur',
    price: item?.price ?? item?.prix ?? 0,
    stock: item?.stock ?? 999,
    stock_alerte: item?.stock_alert ?? item?.stock_alerte ?? 5,
    description_courte: item?.short_description || item?.description_courte || '',
    description: item?.description || '',
    overview: specs.overview || '',
    tags: arrayToLines(specs.tags),
    features: arrayToLines(specs.features),
    platforms: arrayToLines(specs.platforms),
    use_cases: arrayToLines(specs.use_cases),
    detail_notes: arrayToLines(specs.detail_notes),
    technical_specs: technicalSpecsToLines(specs.technical_specs),
    taxonomy_family: taxonomy.family || '',
    taxonomy_category: taxonomy.category || '',
    taxonomy_subcategory: taxonomy.subcategory || '',
    taxonomy_series: taxonomy.series || '',
    source_url: specs.source_url || '',
    est_en_vedette: Boolean(item?.est_en_vedette),
    est_nouveau: Boolean(item?.est_nouveau),
  };
};

const resolveTotalFromMeta = (meta) => {
  const total = Number(meta?.total);
  return Number.isFinite(total) ? total : 0;
};

const normalizeSearchText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const buildSearchTokens = (value) => normalizeSearchText(value).split(/\s+/).filter(Boolean);

const matchesSearchQuery = (query, values) => {
  const tokens = buildSearchTokens(query);
  if (tokens.length === 0) return true;

  const haystack = normalizeSearchText(
    (Array.isArray(values) ? values : [values]).filter(Boolean).join(' ')
  );

  return tokens.every((token) => haystack.includes(token));
};

const getCategoryId = (category) => Number(category?.id || category?.id_categorie || 0);
const getCategoryParentId = (category) => Number(category?.parent_id || category?.parent?.id || category?.parent?.id_categorie || 0);

const normalizeImageSrc = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';

  if (raw.startsWith('/storage/')) return raw;

  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      const parsed = new URL(raw);
      const isLocal = /^(localhost|127\.0\.0\.1|::1)$/i.test(window.location.hostname);
      if (parsed.pathname.startsWith('/storage/') && (parsed.origin === window.location.origin || isLocal)) {
        return parsed.pathname;
      }
    } catch (_error) {
      // keep original
    }
  }

  return raw;
};

export default function CatalogueAdmin() {
  const navigate = useNavigate();
  const { section } = useParams();
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [modelsMeta, setModelsMeta] = useState({ total: 0 });
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingModel, setSavingModel] = useState(false);

  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [categoryEditorOpen, setCategoryEditorOpen] = useState(false);
  const [categoryEditorKind, setCategoryEditorKind] = useState('categorie');
  const [modelForm, setModelForm] = useState(INITIAL_MODEL_FORM);
  const [editingModelId, setEditingModelId] = useState(null);
  const [modelEditorOpen, setModelEditorOpen] = useState(false);
  const [modelImageFiles, setModelImageFiles] = useState([]);

  const [selectedFamilyIds, setSelectedFamilyIds] = useState(new Set());
  const [selectedCategoryIds, setSelectedCategoryIds] = useState(new Set());
  const [selectedModelIds, setSelectedModelIds] = useState(new Set());
  const [bulkFamilyDeleting, setBulkFamilyDeleting] = useState(false);
  const [bulkCategoryDeleting, setBulkCategoryDeleting] = useState(false);
  const [bulkModelDeleting, setBulkModelDeleting] = useState(false);
  const familySelectionRef = useRef(null);
  const familyHeaderSelectionRef = useRef(null);
  const categorySelectionRef = useRef(null);
  const categoryHeaderSelectionRef = useRef(null);
  const modelSelectionRef = useRef(null);
  const modelHeaderSelectionRef = useRef(null);

  const [categoryQuery, setCategoryQuery] = useState('');
  const [familyQuery, setFamilyQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [modelCategoryFilter, setModelCategoryFilter] = useState('all');
  const { toast, showToast } = useAdminToast();

  const activeTab = section === 'modeles' || section === 'categories' || section === 'familles' ? section : null;

  const handleTabClick = (tab) => {
    navigate(`/catalogue/${tab}`);
  };

  if (!activeTab) {
    return <Navigate to="/catalogue/familles" replace />;
  }

  const isEditingCategory = editingCategoryId !== null;
  const isEditingModel = editingModelId !== null;
  const isFamilyEditor = categoryEditorKind === 'famille';

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      const id = getCategoryId(cat);
      if (id) map.set(id, cat);
    });
    return map;
  }, [categories]);

  const categoryChildIds = useMemo(() => {
    const parentIds = new Set();
    categories.forEach((cat) => {
      const parentId = getCategoryParentId(cat);
      if (parentId) parentIds.add(parentId);
    });
    return parentIds;
  }, [categories]);

  const geovisionFamilies = useMemo(
    () => categories.filter((cat) => !getCategoryParentId(cat)),
    [categories]
  );

  const geovisionCategories = useMemo(
    () => categories.filter((cat) => Boolean(getCategoryParentId(cat))),
    [categories]
  );

  const geovisionLeafCategories = useMemo(
    () =>
      categories.filter((cat) => {
        const id = getCategoryId(cat);
        return getCategoryParentId(cat) && id && !categoryChildIds.has(id);
      }),
    [categories, categoryChildIds]
  );

  const modelCategoryOptions = useMemo(
    () =>
      geovisionLeafCategories.map((cat) => {
        const id = getCategoryId(cat);
        const parent = categoriesById.get(getCategoryParentId(cat));
        const pathLabel = parent ? `${parent.nom} / ${cat.nom}` : cat.nom;
        return {
          id,
          label: pathLabel,
          parentName: parent?.nom || '',
        };
      }),
    [geovisionLeafCategories, categoriesById]
  );

  const filteredCategories = useMemo(() => {
    return geovisionCategories.filter((cat) => {
      const values = [
        cat.id,
        cat.id_categorie,
        cat.nom,
        cat.slug,
        cat.description,
        cat.segment,
        cat.parent?.nom,
      ];
      return matchesSearchQuery(categoryQuery, values);
    });
  }, [geovisionCategories, categoryQuery]);

  const filteredFamilies = useMemo(() => {
    return geovisionFamilies.filter((cat) => {
      const values = [
        cat.id,
        cat.id_categorie,
        cat.nom,
        cat.slug,
        cat.description,
      ];
      return matchesSearchQuery(familyQuery, values);
    });
  }, [geovisionFamilies, familyQuery]);

  const filteredModels = useMemo(() => {
    return models.filter((model) => {
      const categoryOk = modelCategoryFilter === 'all' || Number(model.category_id || model.id_categorie) === Number(modelCategoryFilter);
      if (!categoryOk) return false;
      const values = [
        model.id,
        model.title,
        model.reference,
        model.modele,
        model.marque,
        model.description,
        model.short_description,
        model.category_name,
      ];
      return matchesSearchQuery(modelQuery, values);
    });
  }, [models, modelQuery, modelCategoryFilter]);

  const familyIds = useMemo(
    () => filteredFamilies.map((cat) => getCategoryId(cat)).filter(Boolean),
    [filteredFamilies]
  );
  const selectedFamilyIdList = useMemo(
    () => familyIds.filter((id) => selectedFamilyIds.has(id)),
    [familyIds, selectedFamilyIds]
  );
  const selectedFamilyCount = selectedFamilyIdList.length;
  const allFamiliesSelected = familyIds.length > 0 && selectedFamilyCount === familyIds.length;
  const isBulkFamilyActionDisabled = bulkFamilyDeleting || selectedFamilyCount === 0;

  const categoryIds = useMemo(
    () => filteredCategories.map((cat) => getCategoryId(cat)).filter(Boolean),
    [filteredCategories]
  );
  const selectedCategoryIdList = useMemo(
    () => categoryIds.filter((id) => selectedCategoryIds.has(id)),
    [categoryIds, selectedCategoryIds]
  );
  const selectedCategoryCount = selectedCategoryIdList.length;
  const allCategoriesSelected = categoryIds.length > 0 && selectedCategoryCount === categoryIds.length;
  const isBulkCategoryActionDisabled = bulkCategoryDeleting || selectedCategoryCount === 0;

  const modelIds = useMemo(
    () => filteredModels.map((model) => Number(model.id || model.id_produit)).filter(Boolean),
    [filteredModels]
  );
  const selectedModelIdList = useMemo(
    () => modelIds.filter((id) => selectedModelIds.has(id)),
    [modelIds, selectedModelIds]
  );
  const selectedModelCount = selectedModelIdList.length;
  const allModelsSelected = modelIds.length > 0 && selectedModelCount === modelIds.length;
  const isBulkModelActionDisabled = bulkModelDeleting || selectedModelCount === 0;

  const modelUploadPreviews = useMemo(
    () => modelImageFiles.map((file) => ({
      name: file.name,
      size: file.size,
      url: URL.createObjectURL(file),
    })),
    [modelImageFiles]
  );

  useEffect(() => {
    return () => {
      modelUploadPreviews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [modelUploadPreviews]);

  useEffect(() => {
    setSelectedFamilyIds((previous) => {
      if (familyIds.length === 0) {
        return new Set();
      }

      const next = new Set();
      familyIds.forEach((id) => {
        if (previous.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [familyIds]);

  useEffect(() => {
    const isIndeterminate = selectedFamilyCount > 0 && !allFamiliesSelected;
    if (familySelectionRef.current) {
      familySelectionRef.current.indeterminate = isIndeterminate;
    }
    if (familyHeaderSelectionRef.current) {
      familyHeaderSelectionRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedFamilyCount, allFamiliesSelected]);

  useEffect(() => {
    setSelectedCategoryIds((previous) => {
      if (categoryIds.length === 0) {
        return new Set();
      }

      const next = new Set();
      categoryIds.forEach((id) => {
        if (previous.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [categoryIds]);

  useEffect(() => {
    const isIndeterminate = selectedCategoryCount > 0 && !allCategoriesSelected;
    if (categorySelectionRef.current) {
      categorySelectionRef.current.indeterminate = isIndeterminate;
    }
    if (categoryHeaderSelectionRef.current) {
      categoryHeaderSelectionRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedCategoryCount, allCategoriesSelected]);

  useEffect(() => {
    setSelectedModelIds((previous) => {
      if (modelIds.length === 0) {
        return new Set();
      }

      const next = new Set();
      modelIds.forEach((id) => {
        if (previous.has(id)) {
          next.add(id);
        }
      });
      return next;
    });
  }, [modelIds]);

  useEffect(() => {
    const isIndeterminate = selectedModelCount > 0 && !allModelsSelected;
    if (modelSelectionRef.current) {
      modelSelectionRef.current.indeterminate = isIndeterminate;
    }
    if (modelHeaderSelectionRef.current) {
      modelHeaderSelectionRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedModelCount, allModelsSelected]);

  const editingModel = useMemo(
    () => models.find((model) => Number(model.id) === Number(editingModelId)),
    [models, editingModelId]
  );

  const existingModelImage = useMemo(() => {
    if (!editingModel) return null;
    const urls = Array.isArray(editingModel.image_urls)
      ? editingModel.image_urls.filter(Boolean)
      : [];
    return urls[0] || editingModel.image_url || null;
  }, [editingModel]);

  async function loadCategories() {
    setLoading(true);
    try {
      const res = await getCategories({ segment: GEOVISION_SEGMENT });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  async function backgroundLoadCategories() {
    try {
      const res = await getCategories({ segment: GEOVISION_SEGMENT });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      // silent background refresh
    }
  }

  async function loadModels() {
    setLoadingModels(true);
    try {
      const params = { segment: GEOVISION_SEGMENT, per_page: 50 };
      if (modelCategoryFilter !== 'all') {
        params.id_categorie = Number(modelCategoryFilter);
      }
      const res = await getProducts(params);
      setModels(Array.isArray(res.data) ? res.data : []);
      setModelsMeta(res.meta || { total: 0 });
    } catch (err) {
      console.error(err);
      setModels([]);
      setModelsMeta({ total: 0 });
    } finally {
      setLoadingModels(false);
    }
  }

  async function backgroundLoadModels() {
    try {
      const params = { segment: GEOVISION_SEGMENT, per_page: 50 };
      if (modelCategoryFilter !== 'all') {
        params.id_categorie = Number(modelCategoryFilter);
      }
      const res = await getProducts(params);
      setModels(Array.isArray(res.data) ? res.data : []);
      setModelsMeta(res.meta || { total: 0 });
    } catch (err) {
      // silent background refresh
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadModels();
  }, [modelCategoryFilter]);

  useEffect(() => {
    if (modelCategoryFilter === 'all') {
      return;
    }

    const stillValid = modelCategoryOptions.some(
      (option) => String(option.id) === String(modelCategoryFilter)
    );

    if (!stillValid) {
      setModelCategoryFilter('all');
    }
  }, [modelCategoryFilter, modelCategoryOptions]);

  useLivePolling(
    () => Promise.all([backgroundLoadCategories(), backgroundLoadModels()]),
    {
      intervalMs: 8000,
      enabled: !savingCategory && !savingModel,
    }
  );

  async function handleSaveCategory(e) {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const payload = {
        nom: categoryForm.nom,
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || null,
        parent_id: isFamilyEditor ? null : (categoryForm.parent_id ? Number(categoryForm.parent_id) : null),
        ordre: Number(categoryForm.ordre || 0),
        image_url: categoryForm.image_url || null,
        actif: Boolean(categoryForm.actif),
        segment: GEOVISION_SEGMENT,
      };

      if (categoryForm.image_file) {
        payload.image = categoryForm.image_file;
      }

      if (isEditingCategory) {
        await updateCategory(editingCategoryId, payload);
      } else {
        await createCategory(payload);
      }

      setCategoryForm(INITIAL_CATEGORY_FORM);
      setEditingCategoryId(null);
      setCategoryEditorOpen(false);
      setCategoryEditorKind('categorie');
      await loadCategories();
      showToast(
        isEditingCategory
          ? (isFamilyEditor ? 'Famille GeoVision mise a jour.' : 'Categorie GeoVision mise a jour.')
          : (isFamilyEditor ? 'Famille GeoVision creee.' : 'Categorie GeoVision creee.'),
        'success'
      );
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const details = errors
        ? Object.values(errors).flat().join('\n')
        : '';
      showToast(details || err?.response?.data?.message || 'Erreur sauvegarde categorie GeoVision', 'error');
    } finally {
      setSavingCategory(false);
    }
  }

  function handleOpenCreateCategory() {
    setEditingCategoryId(null);
    setCategoryForm(INITIAL_CATEGORY_FORM);
    setCategoryEditorKind('categorie');
    setCategoryEditorOpen(true);
  }

  function handleOpenCreateFamily() {
    setEditingCategoryId(null);
    setCategoryForm(INITIAL_CATEGORY_FORM);
    setCategoryEditorKind('famille');
    setCategoryEditorOpen(true);
  }

  function handleOpenEditCategory(category, kind = 'categorie') {
    setEditingCategoryId(category.id || category.id_categorie);
    setCategoryForm({
      nom: category.nom || '',
      slug: category.slug || '',
      description: category.description || '',
      parent_id: kind === 'famille' ? '' : (category.parent_id || ''),
      ordre: category.ordre ?? 10,
      image_url: normalizeImageSrc(category.image_url || category.image || ''),
      image_file: null,
      existing_image: normalizeImageSrc(category.image_url || category.image || ''),
      actif: category.actif !== false,
    });
    setCategoryEditorKind(kind);
    setCategoryEditorOpen(true);
  }

  function handleCloseCategoryModal() {
    setCategoryEditorOpen(false);
    setEditingCategoryId(null);
    setCategoryEditorKind('categorie');
    setCategoryForm(INITIAL_CATEGORY_FORM);
  }

  function startEditCategory(category) {
    handleOpenEditCategory(category, 'categorie');
  }

  function startEditFamily(category) {
    handleOpenEditCategory(category, 'famille');
  }

  const toggleFamilySelection = (id) => {
    setSelectedFamilyIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFamilySelection = () => {
    setSelectedFamilyIds((previous) => {
      const next = new Set(previous);
      if (familyIds.length === 0) {
        return next;
      }

      const allSelected = familyIds.every((id) => next.has(id));
      if (allSelected) {
        familyIds.forEach((id) => next.delete(id));
      } else {
        familyIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearFamilySelection = () => {
    setSelectedFamilyIds(new Set());
  };

  const toggleCategorySelection = (id) => {
    setSelectedCategoryIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCategorySelection = () => {
    setSelectedCategoryIds((previous) => {
      const next = new Set(previous);
      if (categoryIds.length === 0) {
        return next;
      }

      const allSelected = categoryIds.every((id) => next.has(id));
      if (allSelected) {
        categoryIds.forEach((id) => next.delete(id));
      } else {
        categoryIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearCategorySelection = () => {
    setSelectedCategoryIds(new Set());
  };

  const toggleModelSelection = (id) => {
    setSelectedModelIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllModelSelection = () => {
    setSelectedModelIds((previous) => {
      const next = new Set(previous);
      if (modelIds.length === 0) {
        return next;
      }

      const allSelected = modelIds.every((id) => next.has(id));
      if (allSelected) {
        modelIds.forEach((id) => next.delete(id));
      } else {
        modelIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearModelSelection = () => {
    setSelectedModelIds(new Set());
  };

  const handleBulkDeleteFamilies = async () => {
    if (bulkFamilyDeleting || selectedFamilyIdList.length === 0) return;

    const selectedFamilies = selectedFamilyIdList
      .map((id) => categoriesById.get(id))
      .filter(Boolean);

    if (selectedFamilies.length === 0) {
      setSelectedFamilyIds(new Set());
      return;
    }

    const familiesWithProducts = selectedFamilies.filter(
      (cat) => Number(cat?.produits_count ?? 0) > 0
    );
    const totalProducts = familiesWithProducts.reduce(
      (sum, cat) => sum + Number(cat?.produits_count ?? 0),
      0
    );
    const baseLabel = selectedFamilies.length > 1 ? `${selectedFamilies.length} familles` : '1 famille';
    const confirmMessage = familiesWithProducts.length > 0
      ? `Vous allez supprimer ${baseLabel} dont ${familiesWithProducts.length} avec ${totalProducts} produit(s). Confirmer la suppression ?`
      : `Supprimer ${baseLabel} selectionnee(s) ?`;

    if (!confirm(confirmMessage)) return;

    setBulkFamilyDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const family of selectedFamilies) {
      const id = getCategoryId(family);
      if (!id) continue;
      const hasProducts = Number(family?.produits_count ?? 0) > 0;

      try {
        await deleteCategory(id, { force: hasProducts });
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression famille.';
      }
    }

    if (editingCategoryId && selectedFamilyIdList.includes(Number(editingCategoryId))) {
      handleCloseCategoryModal();
    }

    await loadCategories();
    setSelectedFamilyIds(new Set());

    if (deletedCount > 0) {
      showToast(
        failedCount > 0
          ? `${deletedCount} famille(s) supprimee(s).`
          : `${deletedCount} famille(s) supprimee(s) avec succes.`,
        'success'
      );
    }

    if (failedCount > 0) {
      showToast(lastErrorMessage || `${failedCount} famille(s) non supprimee(s).`, 'error');
    }

    setBulkFamilyDeleting(false);
  };

  const handleBulkDeleteCategories = async () => {
    if (bulkCategoryDeleting || selectedCategoryIdList.length === 0) return;

    const selectedCategories = selectedCategoryIdList
      .map((id) => categoriesById.get(id))
      .filter(Boolean);

    if (selectedCategories.length === 0) {
      setSelectedCategoryIds(new Set());
      return;
    }

    const categoriesWithProducts = selectedCategories.filter(
      (cat) => Number(cat?.produits_count ?? 0) > 0
    );
    const totalProducts = categoriesWithProducts.reduce(
      (sum, cat) => sum + Number(cat?.produits_count ?? 0),
      0
    );
    const baseLabel = selectedCategories.length > 1 ? `${selectedCategories.length} categories` : '1 categorie';
    const confirmMessage = categoriesWithProducts.length > 0
      ? `Vous allez supprimer ${baseLabel} dont ${categoriesWithProducts.length} avec ${totalProducts} produit(s). Confirmer la suppression ?`
      : `Supprimer ${baseLabel} selectionnee(s) ?`;

    if (!confirm(confirmMessage)) return;

    setBulkCategoryDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const category of selectedCategories) {
      const id = getCategoryId(category);
      if (!id) continue;
      const hasProducts = Number(category?.produits_count ?? 0) > 0;

      try {
        await deleteCategory(id, { force: hasProducts });
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression categorie.';
      }
    }

    if (editingCategoryId && selectedCategoryIdList.includes(Number(editingCategoryId))) {
      handleCloseCategoryModal();
    }

    await loadCategories();
    setSelectedCategoryIds(new Set());

    if (deletedCount > 0) {
      showToast(
        failedCount > 0
          ? `${deletedCount} categorie(s) supprimee(s).`
          : `${deletedCount} categorie(s) supprimee(s) avec succes.`,
        'success'
      );
    }

    if (failedCount > 0) {
      showToast(lastErrorMessage || `${failedCount} categorie(s) non supprimee(s).`, 'error');
    }

    setBulkCategoryDeleting(false);
  };

  const handleBulkDeleteModels = async () => {
    if (bulkModelDeleting || selectedModelIdList.length === 0) return;

    const modelsById = new Map();
    models.forEach((model) => {
      const id = Number(model.id || model.id_produit);
      if (id) {
        modelsById.set(id, model);
      }
    });

    const selectedModels = selectedModelIdList
      .map((id) => modelsById.get(id))
      .filter(Boolean);

    if (selectedModels.length === 0) {
      setSelectedModelIds(new Set());
      return;
    }

    const baseLabel = selectedModels.length > 1 ? `${selectedModels.length} modeles` : '1 modele';
    if (!confirm(`Supprimer ${baseLabel} selectionne(s) ?`)) return;

    setBulkModelDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const model of selectedModels) {
      const id = Number(model.id || model.id_produit);
      if (!id) continue;

      try {
        await deleteProduct(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression modele.';
      }
    }

    if (editingModelId && selectedModelIdList.includes(Number(editingModelId))) {
      handleCloseModelModal();
    }

    await loadModels();
    setSelectedModelIds(new Set());

    if (deletedCount > 0) {
      showToast(
        failedCount > 0
          ? `${deletedCount} modele(s) supprime(s).`
          : `${deletedCount} modele(s) supprime(s) avec succes.`,
        'success'
      );
    }

    if (failedCount > 0) {
      showToast(lastErrorMessage || `${failedCount} modele(s) non supprime(s).`, 'error');
    }

    setBulkModelDeleting(false);
  };

  async function handleDeleteCategory(id) {
    if (bulkFamilyDeleting || bulkCategoryDeleting) return;
    if (!confirm('Supprimer cette categorie GeoVision ?')) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      setSelectedCategoryIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      setSelectedFamilyIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      showToast('Categorie GeoVision supprimee.', 'success');
    } catch (err) {
      showToast('Erreur suppression categorie', 'error');
    }
  }

  async function handleSaveModel(e) {
    e.preventDefault();
    const editing = Boolean(editingModelId);

    if (!modelForm.title.trim()) {
      showToast('Le titre du modele est obligatoire.', 'error');
      return;
    }
    if (!modelForm.id_categorie) {
      showToast('La categorie GeoVision est obligatoire.', 'error');
      return;
    }

    const selectedCategoryId = Number(modelForm.id_categorie);
    const selectedCategory = categoriesById.get(selectedCategoryId);
    const selectedCategoryHasChildren = categoryChildIds.has(selectedCategoryId);
    if (!selectedCategory || !getCategoryParentId(selectedCategory) || selectedCategoryHasChildren) {
      showToast('Selectionnez une sous-categorie finale (pas une famille parent).', 'error');
      return;
    }

    setSavingModel(true);
    try {
      const payload = {
        ...modelForm,
        segment: GEOVISION_SEGMENT,
        id_categorie: Number(modelForm.id_categorie),
        price: Number(modelForm.price || 0),
        stock: Number(modelForm.stock || 0),
        stock_alerte: Number(modelForm.stock_alerte || 0),
        specifications: buildSpecsPayload(modelForm),
      };

      let targetProductId = editingModelId;

      if (isEditingModel) {
        await updateProduct(editingModelId, payload);
      } else {
        const response = await createProduct(payload);
        targetProductId = response?.data?.data?.id || response?.data?.data?.id_produit || null;
      }

      if (targetProductId && modelImageFiles.length > 0) {
        await uploadProductImages(targetProductId, modelImageFiles[0], { replace: true });
      }

      setModelForm(INITIAL_MODEL_FORM);
      setEditingModelId(null);
      setModelEditorOpen(false);
      setModelImageFiles([]);
      await loadModels();
      showToast(editing ? 'Modele GeoVision mis a jour.' : 'Modele GeoVision cree.', 'success');
    } catch (err) {
      const errors = err?.response?.data?.errors;
      const details = errors
        ? Object.values(errors).flat().join('\n')
        : '';
      showToast(details || err?.response?.data?.message || 'Erreur sauvegarde modele GeoVision', 'error');
    } finally {
      setSavingModel(false);
    }
  }

  function handleOpenCreateModel() {
    setEditingModelId(null);
    setModelForm(INITIAL_MODEL_FORM);
    setModelImageFiles([]);
    setModelEditorOpen(true);
  }

  function handleOpenEditModel(model) {
    setEditingModelId(model.id);
    setModelForm(toModelForm(model));
    setModelImageFiles([]);
    setModelEditorOpen(true);
  }

  function handleCloseModelModal() {
    setModelEditorOpen(false);
    setEditingModelId(null);
    setModelForm(INITIAL_MODEL_FORM);
    setModelImageFiles([]);
  }

  function startEditModel(model) {
    handleOpenEditModel(model);
  }

  async function handleDeleteModel(id) {
    if (bulkModelDeleting) return;
    if (!confirm('Supprimer ce modele GeoVision ?')) return;
    try {
      await deleteProduct(id);
      await loadModels();
      setSelectedModelIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      showToast('Modele GeoVision supprime.', 'success');
    } catch (err) {
      showToast('Erreur suppression modele GeoVision', 'error');
    }
  }

  return (
    <div className="admin-catalogue-page">
      <header className="admin-catalogue-hero">
        <div>
          <h1>Catalogue GeoVision</h1>
        </div>
        <div className="admin-catalogue-hero-actions">
          <span className="admin-catalogue-count">
            {categories.length} categories · {loadingModels ? 'Chargement...' : `${resolveTotalFromMeta(modelsMeta)} modeles`}
          </span>
        </div>
      </header>

      <section className="admin-catalogue-tabs">
        <button type="button" className={activeTab === 'familles' ? 'is-active' : ''} onClick={() => handleTabClick('familles')}>
          Familles GeoVision
        </button>
        <button type="button" className={activeTab === 'categories' ? 'is-active' : ''} onClick={() => handleTabClick('categories')}>
          Categories GeoVision
        </button>
        <button type="button" className={activeTab === 'modeles' ? 'is-active' : ''} onClick={() => handleTabClick('modeles')}>
          Modeles GeoVision
        </button>
      </section>

      {activeTab === 'categories' && (
      <section className="admin-catalogue-scroll-section">
          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>Liste categories GeoVision (sous-categories)</h2>
              <div className="admin-catalogue-row-actions">
                    <button type="button" className="btn-secondary" onClick={handleOpenCreateCategory}>Nouvelle categorie</button>
                  </div>
            </div>
            <div className="admin-catalogue-filters">
              <input
                placeholder="Rechercher categorie, slug, description..."
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
              />
            </div>

            <div className="admin-bulk-bar">
              <label className="admin-bulk-select">
                <input
                  type="checkbox"
                  ref={categorySelectionRef}
                  checked={allCategoriesSelected}
                  onChange={toggleAllCategorySelection}
                  disabled={categoryIds.length === 0 || bulkCategoryDeleting}
                />
                <span>{selectedCategoryCount} selectionnee(s)</span>
              </label>
              <div className="admin-bulk-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearCategorySelection}
                  disabled={selectedCategoryCount === 0 || bulkCategoryDeleting}
                >
                  Effacer la selection
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBulkDeleteCategories}
                  disabled={isBulkCategoryActionDisabled}
                >
                  Supprimer la selection
                </button>
              </div>
            </div>

            {loading ? (
              <Loader text="Chargement des categories GeoVision..." />
            ) : filteredCategories.length === 0 ? (
              <div className="admin-catalogue-empty">Aucune categorie GeoVision trouvee.</div>
            ) : (
              <div className="admin-catalogue-table-wrap">
                <table className="admin-catalogue-table admin-bulk-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          ref={categoryHeaderSelectionRef}
                          checked={allCategoriesSelected}
                          onChange={toggleAllCategorySelection}
                          disabled={categoryIds.length === 0 || bulkCategoryDeleting}
                          aria-label="Selectionner toutes les categories"
                        />
                      </th>
                      <th>ID</th>
                      <th>Categorie</th>
                      <th>Parent</th>
                      <th>Image</th>
                      <th>Ordre</th>
                      <th>Actif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCategories.map((cat) => {
                      const id = cat.id || cat.id_categorie;
                      const isChecked = selectedCategoryIds.has(Number(id));
                      return (
                        <tr key={id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCategorySelection(Number(id))}
                              disabled={bulkCategoryDeleting}
                              aria-label={`Selectionner la categorie ${cat?.nom || id}`}
                            />
                          </td>
                          <td>#{id}</td>
                          <td>
                            <div className="admin-catalogue-title-cell">
                              <strong>{cat.nom}</strong>
                              <small>{cat.slug}</small>
                              <small>{cat.description || 'Sans description'}</small>
                            </div>
                          </td>
                          <td>{cat.parent?.nom || '—'}</td>
                          <td>
                            {cat.image_url || cat.image ? (
                              <img className="admin-catalogue-thumb" src={normalizeImageSrc(cat.image_url || cat.image)} alt={cat.nom} />
                            ) : (
                              <span className="admin-catalogue-muted">Aucune</span>
                            )}
                          </td>
                          <td>{cat.ordre ?? 0}</td>
                          <td>{cat.actif === false ? 'Non' : 'Oui'}</td>
                          <td>
                            <div className="admin-catalogue-row-actions">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#274483"
                                role="button"
                                tabIndex={0}
                                aria-label={`Editer la categorie ${cat?.nom || cat.id}`}
                                onClick={() => startEditCategory(cat)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditCategory(cat); }}
                                style={{ cursor: 'pointer' }}
                              >
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                              </svg>
                              <DeleteIconButton
                                onClick={() => handleDeleteCategory(id)}
                                className="admin-catalogue-danger"
                                title="Supprimer"
                                ariaLabel={`Supprimer la categorie ${cat?.nom || id}`}
                              />
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
      </section>
      )}

      {activeTab === 'modeles' && (
      <section className="admin-catalogue-scroll-section">
          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>Liste modeles GeoVision</h2>
                <div className="admin-catalogue-row-actions">
                <button type="button" className="btn-secondary" onClick={handleOpenCreateModel}>Nouveau modele</button>
              </div>
            </div>

            <div className="admin-catalogue-filters admin-catalogue-filters-2">
              <input placeholder="Rechercher titre, reference, modele..." value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} />
              <select value={modelCategoryFilter} onChange={(e) => setModelCategoryFilter(e.target.value)}>
                <option value="all">Toutes categories</option>
                {modelCategoryOptions.map((cat) => {
                  return <option key={cat.id} value={cat.id}>{cat.label}</option>;
                })}
              </select>
            </div>

            <div className="admin-bulk-bar">
              <label className="admin-bulk-select">
                <input
                  type="checkbox"
                  ref={modelSelectionRef}
                  checked={allModelsSelected}
                  onChange={toggleAllModelSelection}
                  disabled={modelIds.length === 0 || bulkModelDeleting}
                />
                <span>{selectedModelCount} selectionnee(s)</span>
              </label>
              <div className="admin-bulk-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearModelSelection}
                  disabled={selectedModelCount === 0 || bulkModelDeleting}
                >
                  Effacer la selection
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBulkDeleteModels}
                  disabled={isBulkModelActionDisabled}
                >
                  Supprimer la selection
                </button>
              </div>
            </div>

            {loadingModels ? (
              <Loader text="Chargement des modeles GeoVision..." />
            ) : filteredModels.length === 0 ? (
              <div className="admin-catalogue-empty">Aucun modele GeoVision trouve.</div>
            ) : (
              <div className="admin-catalogue-table-wrap">
                <table className="admin-catalogue-table admin-bulk-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          ref={modelHeaderSelectionRef}
                          checked={allModelsSelected}
                          onChange={toggleAllModelSelection}
                          disabled={modelIds.length === 0 || bulkModelDeleting}
                          aria-label="Selectionner tous les modeles"
                        />
                      </th>
                      <th>ID</th>
                      <th>Modele</th>
                      <th>Categorie</th>
                      <th>Image</th>
                      <th>Statut</th>
                      <th>Caracteristiques</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredModels.map((model) => {
                      const isChecked = selectedModelIds.has(Number(model.id || model.id_produit));
                      const categoryName = categoriesById.get(Number(model.category_id || model.id_categorie))?.nom || model.category_name || '—';
                      const thumb = model.image_url || (Array.isArray(model.image_urls) ? model.image_urls[0] : null);
                      const features = Array.isArray(model.specifications?.features) ? model.specifications.features : [];

                      return (
                        <tr key={model.id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleModelSelection(Number(model.id || model.id_produit))}
                              disabled={bulkModelDeleting}
                              aria-label={`Selectionner le modele ${model?.title || model.id}`}
                            />
                          </td>
                          <td>#{model.id}</td>
                          <td>
                            <div className="admin-catalogue-title-cell">
                              <strong>{model.title}</strong>
                              <small>{model.reference || 'Reference N/A'}</small>
                              <small>{model.modele || 'Modele N/A'}</small>
                            </div>
                          </td>
                          <td>{categoryName}</td>
                          <td>
                            {thumb ? <img className="admin-catalogue-thumb" src={thumb} alt={model.title} /> : <span className="admin-catalogue-muted">Aucune</span>}
                          </td>
                          <td>
                            <span className={`admin-catalogue-status admin-catalogue-status--${model.statut || 'indisponible'}`}>{model.statut || 'indisponible'}</span>
                          </td>
                          <td>
                            {features.length > 0 ? (
                              <ul className="admin-catalogue-mini-list">
                                {features.slice(0, 3).map((item) => <li key={`${model.id}-${item}`}>{item}</li>)}
                              </ul>
                            ) : (
                              <span className="admin-catalogue-muted">Non renseigne</span>
                            )}
                          </td>
                          <td>
                            <div className="admin-catalogue-row-actions">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#274483"
                                role="button"
                                tabIndex={0}
                                aria-label={`Editer le modele ${model?.title || model.id}`}
                                onClick={() => startEditModel(model)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditModel(model); }}
                                style={{ cursor: 'pointer' }}
                              >
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                              </svg>
                              <DeleteIconButton
                                onClick={() => handleDeleteModel(model.id)}
                                className="admin-catalogue-danger"
                                title="Supprimer"
                                ariaLabel={`Supprimer le modele ${model?.title || model.id}`}
                              />
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
      </section>
      )}

      {activeTab === 'familles' && (
      <section className="admin-catalogue-scroll-section">
          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>Liste familles GeoVision (categories parent)</h2>
                <div className="admin-catalogue-row-actions">
                <button type="button" className="btn-secondary" onClick={handleOpenCreateFamily}>Nouvelle famille</button>
              </div>
            </div>

            <div className="admin-catalogue-filters">
              <input
                placeholder="Rechercher famille, slug, description..."
                value={familyQuery}
                onChange={(e) => setFamilyQuery(e.target.value)}
              />
            </div>

            <div className="admin-bulk-bar">
              <label className="admin-bulk-select">
                <input
                  type="checkbox"
                  ref={familySelectionRef}
                  checked={allFamiliesSelected}
                  onChange={toggleAllFamilySelection}
                  disabled={familyIds.length === 0 || bulkFamilyDeleting}
                />
                <span>{selectedFamilyCount} selectionnee(s)</span>
              </label>
              <div className="admin-bulk-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={clearFamilySelection}
                  disabled={selectedFamilyCount === 0 || bulkFamilyDeleting}
                >
                  Effacer la selection
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleBulkDeleteFamilies}
                  disabled={isBulkFamilyActionDisabled}
                >
                  Supprimer la selection
                </button>
              </div>
            </div>

            {loading ? (
              <Loader text="Chargement des familles GeoVision..." />
            ) : filteredFamilies.length === 0 ? (
              <div className="admin-catalogue-empty">Aucune famille GeoVision trouvee.</div>
            ) : (
              <div className="admin-catalogue-table-wrap">
                <table className="admin-catalogue-table admin-bulk-table">
                  <thead>
                    <tr>
                      <th style={{ width: '40px' }}>
                        <input
                          type="checkbox"
                          ref={familyHeaderSelectionRef}
                          checked={allFamiliesSelected}
                          onChange={toggleAllFamilySelection}
                          disabled={familyIds.length === 0 || bulkFamilyDeleting}
                          aria-label="Selectionner toutes les familles"
                        />
                      </th>
                      <th>ID</th>
                      <th>Famille parent</th>
                      <th>Ordre</th>
                      <th>Sous-categories</th>
                      <th>Actif</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFamilies.map((cat) => {
                      const id = getCategoryId(cat);
                      const isChecked = selectedFamilyIds.has(id);
                      const childCount = categories.filter(
                        (entry) => getCategoryParentId(entry) === id
                      ).length;
                      return (
                        <tr key={id}>
                          <td>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleFamilySelection(id)}
                              disabled={bulkFamilyDeleting}
                              aria-label={`Selectionner la famille ${cat?.nom || id}`}
                            />
                          </td>
                          <td>#{id}</td>
                          <td>
                            <div className="admin-catalogue-title-cell">
                              <strong>{cat.nom}</strong>
                              <small>{cat.slug}</small>
                              <small>{cat.description || 'Sans description'}</small>
                            </div>
                          </td>
                          <td>{cat.ordre ?? 0}</td>
                          <td>{childCount}</td>
                          <td>{cat.actif === false ? 'Non' : 'Oui'}</td>
                          <td>
                            <div className="admin-catalogue-row-actions">
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                height="24px"
                                viewBox="0 -960 960 960"
                                width="24px"
                                fill="#274483"
                                role="button"
                                tabIndex={0}
                                aria-label={`Editer la famille ${cat?.nom || cat.id}`}
                                onClick={() => startEditFamily(cat)}
                                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEditFamily(cat); }}
                                style={{ cursor: 'pointer' }}
                              >
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                              </svg>
                              <DeleteIconButton
                                onClick={() => handleDeleteCategory(id)}
                                className="admin-catalogue-danger"
                                title="Supprimer"
                                ariaLabel={`Supprimer la famille ${cat?.nom || id}`}
                              />
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
      </section>
      )}

      {categoryEditorOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={handleCloseCategoryModal}>
          <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--tagged" aria-label={isEditingCategory ? 'Edition categorie GeoVision' : 'Creation categorie GeoVision'}>
              <div className="admin-catalogue-card-head">
                <h2>
                  {isEditingCategory
                    ? (isFamilyEditor ? 'Modifier famille GeoVision' : 'Modifier categorie GeoVision')
                    : (isFamilyEditor ? 'Creer famille GeoVision' : 'Creer categorie GeoVision')}
                </h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000000"
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Fermer"
                  onClick={handleCloseCategoryModal}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !savingCategory) handleCloseCategoryModal(); }}
                  style={{ cursor: savingCategory ? 'default' : 'pointer', verticalAlign: 'middle', border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </div>

              <form onSubmit={handleSaveCategory} className="admin-catalogue-form admin-catalogue-grid-4">
                <label>
                  Nom
                  <input
                    value={categoryForm.nom}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, nom: e.target.value }))}
                    required
                  />
                </label>
                <label>
                  Slug
                  <input
                    value={categoryForm.slug}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, slug: e.target.value }))}
                    placeholder="auto si vide"
                  />
                </label>
                {!isFamilyEditor ? (
                  <label>
                    Parent
                    <select
                      value={categoryForm.parent_id}
                      onChange={(e) => setCategoryForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                    >
                      <option value="">Aucun parent</option>
                      {geovisionFamilies.map((cat) => {
                        const id = getCategoryId(cat);
                        if (editingCategoryId && Number(editingCategoryId) === Number(id)) {
                          return null;
                        }
                        return <option key={id} value={id}>{cat.nom}</option>;
                      })}
                    </select>
                  </label>
                ) : (
                  <label>
                    Type
                    <input value="Famille parent (filtre plateforme)" disabled />
                  </label>
                )}
                <label>
                  Ordre
                  <input
                    type="number"
                    min="0"
                    value={categoryForm.ordre}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, ordre: e.target.value }))}
                  />
                </label>
                {!isFamilyEditor ? (
                  <label className="admin-catalogue-grid-span-2">
                    Image categorie
                    <div style={{ display: 'grid', gap: '0.45rem' }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setCategoryForm((prev) => ({ ...prev, image_file: e.target.files?.[0] || null }))}
                      />
                      {(categoryForm.existing_image || categoryForm.image_url) ? (
                        <img
                          src={categoryForm.image_url || categoryForm.existing_image}
                          alt="Apercu categorie"
                          style={{ width: '120px', height: '72px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                        />
                      ) : null}
                    </div>
                  </label>
                ) : null}
                <label className="admin-catalogue-grid-span-2">
                  Description
                  <textarea
                    rows={3}
                    value={categoryForm.description}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, description: e.target.value }))}
                  />
                </label>
                <label className="admin-catalogue-checkbox">
                  <input
                    type="checkbox"
                    checked={Boolean(categoryForm.actif)}
                    onChange={(e) => setCategoryForm((prev) => ({ ...prev, actif: e.target.checked }))}
                  />
                  Categorie active
                </label>
                <div className="admin-catalogue-actions admin-catalogue-actions--tagged">
                  <button type="button" className="btn-secondary" onClick={handleCloseCategoryModal} disabled={savingCategory}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingCategory}>
                    {savingCategory
                      ? 'Sauvegarde...'
                      : isEditingCategory
                        ? (isFamilyEditor ? 'Enregistrer famille' : 'Enregistrer categorie')
                        : (isFamilyEditor ? 'Creer famille' : 'Creer categorie')}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      {modelEditorOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={handleCloseModelModal}>
          <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--model" aria-label={isEditingModel ? 'Edition modele GeoVision' : 'Creation modele GeoVision'}>
              <div className="admin-catalogue-card-head">
                <h2>{isEditingModel ? 'Modifier modele GeoVision' : 'Creer modele GeoVision'}</h2>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#172243"
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Fermer"
                  onClick={() => { if (!savingModel) handleCloseModelModal(); }}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !savingModel) handleCloseModelModal(); }}
                  style={{ cursor: savingModel ? 'default' : 'pointer', verticalAlign: 'middle', border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              </div>

              <form onSubmit={handleSaveModel} className="admin-catalogue-form admin-catalogue-grid-4">
                <label>
                  Titre modele
                  <input value={modelForm.title} onChange={(e) => setModelForm((p) => ({ ...p, title: e.target.value }))} required />
                </label>
                <label>
                  Reference
                  <input value={modelForm.reference} onChange={(e) => setModelForm((p) => ({ ...p, reference: e.target.value }))} />
                </label>
                <label>
                  Modele / Serie
                  <input value={modelForm.modele} onChange={(e) => setModelForm((p) => ({ ...p, modele: e.target.value }))} />
                </label>
                <label>
                  Categorie GeoVision
                  <select value={modelForm.id_categorie} onChange={(e) => setModelForm((p) => ({ ...p, id_categorie: e.target.value }))} required>
                    <option value="">Selectionner</option>
                    {modelCategoryOptions.map((cat) => {
                      return <option key={cat.id} value={cat.id}>{cat.label}</option>;
                    })}
                  </select>
                </label>

                <label>
                  Marque
                  <input value={modelForm.marque} onChange={(e) => setModelForm((p) => ({ ...p, marque: e.target.value }))} />
                </label>
                <label>
                  Statut
                  <select value={modelForm.statut} onChange={(e) => setModelForm((p) => ({ ...p, statut: e.target.value }))}>
                    <option value="actif">Actif</option>
                    <option value="disponible">Disponible</option>
                    <option value="indisponible">Indisponible</option>
                    <option value="rupture">Rupture</option>
                  </select>
                </label>
                <label>
                  Garantie
                  <input value={modelForm.garantie} onChange={(e) => setModelForm((p) => ({ ...p, garantie: e.target.value }))} />
                </label>
                <label>
                  Prix (FCFA)
                  <input type="number" min="0" value={modelForm.price} onChange={(e) => setModelForm((p) => ({ ...p, price: e.target.value }))} />
                </label>

                <label>
                  Stock
                  <input type="number" min="0" value={modelForm.stock} onChange={(e) => setModelForm((p) => ({ ...p, stock: e.target.value }))} />
                </label>
                <label>
                  Seuil alerte
                  <input type="number" min="0" value={modelForm.stock_alerte} onChange={(e) => setModelForm((p) => ({ ...p, stock_alerte: e.target.value }))} />
                </label>
                <label className="admin-catalogue-grid-span-2">
                  Image du modele (televersement)
                  <div style={{ display: 'grid', gap: '0.45rem' }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setModelImageFiles(file ? [file] : []);
                      }}
                    />
                    {modelUploadPreviews.length > 0 ? (
                      <div className="admin-catalogue-upload-preview-grid">
                        {modelUploadPreviews.map((preview) => (
                          <figure key={preview.url} className="admin-catalogue-upload-preview-card">
                            <img src={preview.url} alt={preview.name} className="admin-catalogue-thumb" />
                            <figcaption>
                              <small>{preview.name}</small>
                            </figcaption>
                          </figure>
                        ))}
                      </div>
                    ) : null}
                    {modelUploadPreviews.length === 0 && existingModelImage ? (
                      <div className="admin-catalogue-upload-preview-grid">
                        <img src={existingModelImage} alt="Image existante" className="admin-catalogue-thumb" />
                      </div>
                    ) : null}
                  </div>
                </label>

                <label className="admin-catalogue-grid-span-2">
                  Description courte
                  <textarea rows={2} value={modelForm.description_courte} onChange={(e) => setModelForm((p) => ({ ...p, description_courte: e.target.value }))} />
                </label>
                <label className="admin-catalogue-grid-span-2">
                  Description detaillee du modele
                  <textarea rows={3} value={modelForm.description} onChange={(e) => setModelForm((p) => ({ ...p, description: e.target.value }))} />
                </label>

                <label className="admin-catalogue-grid-span-2">
                  Overview constructeur
                  <textarea rows={3} value={modelForm.overview} onChange={(e) => setModelForm((p) => ({ ...p, overview: e.target.value }))} />
                </label>
                <label className="admin-catalogue-grid-span-2">
                  URL source constructeur
                  <input value={modelForm.source_url} onChange={(e) => setModelForm((p) => ({ ...p, source_url: e.target.value }))} />
                </label>

                <label>
                  Tags (1 par ligne)
                  <textarea rows={3} value={modelForm.tags} onChange={(e) => setModelForm((p) => ({ ...p, tags: e.target.value }))} />
                </label>
                <label>
                  Caracteristiques (1 par ligne)
                  <textarea rows={3} value={modelForm.features} onChange={(e) => setModelForm((p) => ({ ...p, features: e.target.value }))} />
                </label>
                <label>
                  Plateformes (1 par ligne)
                  <textarea rows={3} value={modelForm.platforms} onChange={(e) => setModelForm((p) => ({ ...p, platforms: e.target.value }))} />
                </label>
                <label>
                  Cas d usage (1 par ligne)
                  <textarea rows={3} value={modelForm.use_cases} onChange={(e) => setModelForm((p) => ({ ...p, use_cases: e.target.value }))} />
                </label>

                <label className="admin-catalogue-grid-span-2">
                  Details du modele (1 par ligne)
                  <textarea rows={4} value={modelForm.detail_notes} onChange={(e) => setModelForm((p) => ({ ...p, detail_notes: e.target.value }))} />
                </label>
                <label className="admin-catalogue-grid-span-2">
                  Specifications techniques (format: Label: Valeur, une ligne)
                  <textarea rows={4} value={modelForm.technical_specs} onChange={(e) => setModelForm((p) => ({ ...p, technical_specs: e.target.value }))} />
                </label>

                <label>
                  Taxonomy family
                  <input value={modelForm.taxonomy_family} onChange={(e) => setModelForm((p) => ({ ...p, taxonomy_family: e.target.value }))} />
                </label>
                <label>
                  Taxonomy category
                  <input value={modelForm.taxonomy_category} onChange={(e) => setModelForm((p) => ({ ...p, taxonomy_category: e.target.value }))} />
                </label>
                <label>
                  Taxonomy subcategory
                  <input value={modelForm.taxonomy_subcategory} onChange={(e) => setModelForm((p) => ({ ...p, taxonomy_subcategory: e.target.value }))} />
                </label>
                <label>
                  Taxonomy series
                  <input value={modelForm.taxonomy_series} onChange={(e) => setModelForm((p) => ({ ...p, taxonomy_series: e.target.value }))} />
                </label>

                <label className="admin-catalogue-checkbox">
                  <input type="checkbox" checked={modelForm.est_nouveau} onChange={(e) => setModelForm((p) => ({ ...p, est_nouveau: e.target.checked }))} />
                  Marquer nouveau
                </label>
                <label className="admin-catalogue-checkbox">
                  <input type="checkbox" checked={modelForm.est_en_vedette} onChange={(e) => setModelForm((p) => ({ ...p, est_en_vedette: e.target.checked }))} />
                  Mettre en vedette
                </label>

                <div className="admin-catalogue-actions admin-catalogue-grid-span-2 admin-catalogue-actions--model">
                  <button type="button" className="btn-secondary" onClick={handleCloseModelModal} disabled={savingModel}>
                    Annuler
                  </button>
                  <button type="submit" className="btn-primary" disabled={savingModel}>
                    {savingModel ? 'Sauvegarde...' : isEditingModel ? 'Enregistrer modele' : 'Creer modele'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      <AdminToast toast={toast} />
      </div>
  );
}
