import React, { useEffect, useMemo, useRef, useState } from 'react';
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
  syncGeovisionCatalog,
} from '../api';
import { useLivePolling } from '../../hooks/useLivePolling';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
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

export default function CatalogueAdmin() {
  const [categories, setCategories] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingModels, setLoadingModels] = useState(true);
  const [savingCategory, setSavingCategory] = useState(false);
  const [savingModel, setSavingModel] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [categoryForm, setCategoryForm] = useState(INITIAL_CATEGORY_FORM);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [modelForm, setModelForm] = useState(INITIAL_MODEL_FORM);
  const [editingModelId, setEditingModelId] = useState(null);
  const [modelImageFiles, setModelImageFiles] = useState([]);

  const [categoryQuery, setCategoryQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');
  const [modelCategoryFilter, setModelCategoryFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('categories');
  const categoriesSectionRef = useRef(null);
  const modelsSectionRef = useRef(null);
  const { toast, showToast } = useAdminToast();

  const scrollToTabSection = (tab, behavior = 'smooth') => {
    const target = tab === 'models' ? modelsSectionRef.current : categoriesSectionRef.current;
    if (!target) return;
    target.scrollIntoView({ behavior, block: 'start' });
  };

  const handleTabClick = (tab) => {
    setActiveTab(tab);
    scrollToTabSection(tab);
  };

  const isEditingCategory = editingCategoryId !== null;
  const isEditingModel = editingModelId !== null;

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((cat) => {
      const id = Number(cat.id || cat.id_categorie);
      if (id) map.set(id, cat);
    });
    return map;
  }, [categories]);

  const filteredCategories = useMemo(() => {
    const q = categoryQuery.trim().toLowerCase();
    if (!q) return categories;
    return categories.filter((cat) => {
      const values = [cat.nom, cat.slug, cat.description, cat.segment, cat.parent?.nom];
      return values.some((val) => String(val || '').toLowerCase().includes(q));
    });
  }, [categories, categoryQuery]);

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    return models.filter((model) => {
      const categoryOk = modelCategoryFilter === 'all' || Number(model.category_id || model.id_categorie) === Number(modelCategoryFilter);
      if (!categoryOk) return false;
      if (!q) return true;
      const values = [
        model.title,
        model.reference,
        model.modele,
        model.marque,
        model.description,
        model.short_description,
      ];
      return values.some((val) => String(val || '').toLowerCase().includes(q));
    });
  }, [models, modelQuery, modelCategoryFilter]);

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

  const editingModel = useMemo(
    () => models.find((model) => Number(model.id) === Number(editingModelId)),
    [models, editingModelId]
  );

  const existingModelImages = useMemo(() => {
    if (!editingModel) return [];
    return Array.isArray(editingModel.image_urls)
      ? editingModel.image_urls.filter(Boolean)
      : [];
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

  async function loadModels() {
    setLoadingModels(true);
    try {
      const params = { segment: GEOVISION_SEGMENT };
      if (modelCategoryFilter !== 'all') {
        params.id_categorie = Number(modelCategoryFilter);
      }
      if (modelQuery.trim()) {
        params.q = modelQuery.trim();
      }
      const res = await getProducts(params);
      setModels(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setModels([]);
    } finally {
      setLoadingModels(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadModels();
  }, [modelCategoryFilter]);

  useLivePolling(
    () => Promise.all([loadCategories(), loadModels()]),
    {
      intervalMs: 8000,
      enabled: !savingCategory && !savingModel && !syncing,
    }
  );

  useEffect(() => {
    const categoriesSection = categoriesSectionRef.current;
    const modelsSection = modelsSectionRef.current;

    if (!categoriesSection || !modelsSection || typeof IntersectionObserver === 'undefined') {
      return undefined;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible.length === 0) return;

        const nextTab = visible[0].target.getAttribute('data-tab');
        if (nextTab === 'categories' || nextTab === 'models') {
          setActiveTab((prev) => (prev === nextTab ? prev : nextTab));
        }
      },
      {
        root: null,
        threshold: [0.2, 0.35, 0.55],
        rootMargin: '-16% 0px -55% 0px',
      }
    );

    observer.observe(categoriesSection);
    observer.observe(modelsSection);

    return () => observer.disconnect();
  }, []);

  async function handleSaveCategory(e) {
    e.preventDefault();
    setSavingCategory(true);
    try {
      const payload = {
        nom: categoryForm.nom,
        slug: categoryForm.slug || undefined,
        description: categoryForm.description || null,
        parent_id: categoryForm.parent_id ? Number(categoryForm.parent_id) : null,
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
      await loadCategories();
      showToast(isEditingCategory ? 'Categorie GeoVision mise a jour.' : 'Categorie GeoVision creee.', 'success');
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

  function startEditCategory(category) {
    setEditingCategoryId(category.id || category.id_categorie);
    setCategoryForm({
      nom: category.nom || '',
      slug: category.slug || '',
      description: category.description || '',
      parent_id: category.parent_id || '',
      ordre: category.ordre ?? 10,
      image_url: category.image_url || category.image || '',
      image_file: null,
      existing_image: category.image_url || category.image || '',
      actif: category.actif !== false,
    });
    setActiveTab('categories');
    scrollToTabSection('categories');
  }

  async function handleDeleteCategory(id) {
    if (!confirm('Supprimer cette categorie GeoVision ?')) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
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
        await uploadProductImages(targetProductId, modelImageFiles);
      }

      setModelForm(INITIAL_MODEL_FORM);
      setEditingModelId(null);
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

  function startEditModel(model) {
    setEditingModelId(model.id);
    setModelForm(toModelForm(model));
    setModelImageFiles([]);
    setActiveTab('models');
    scrollToTabSection('models');
  }

  async function handleDeleteModel(id) {
    if (!confirm('Supprimer ce modele GeoVision ?')) return;
    try {
      await deleteProduct(id);
      setModels((prev) => prev.filter((m) => m.id !== id));
      showToast('Modele GeoVision supprime.', 'success');
    } catch (err) {
      showToast('Erreur suppression modele GeoVision', 'error');
    }
  }

  async function handleSyncGeovision() {
    setSyncing(true);
    try {
      await syncGeovisionCatalog({ replace: false, fetch_details: true });
      await Promise.all([loadCategories(), loadModels()]);
      showToast('Synchronisation GeoVision terminee.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur de synchronisation GeoVision', 'error');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="admin-catalogue-page">
      <header className="admin-catalogue-hero">
        <div>
          <h1>Catalogue GeoVision</h1>
          <p>
            Cette page admin gere uniquement le catalogue GeoVision stocke en base: categories, modeles, images,
            descriptions, details techniques, caracteristiques et taxonomie.
          </p>
        </div>
        <div className="admin-catalogue-hero-actions">
          <button type="button" className="btn-secondary" onClick={handleSyncGeovision} disabled={syncing}>
            {syncing ? 'Synchronisation...' : 'Synchroniser officiel GeoVision'}
          </button>
          <span className="admin-catalogue-count">{categories.length} categories · {models.length} modeles</span>
        </div>
      </header>

      <section className="admin-catalogue-tabs">
        <button type="button" className={activeTab === 'categories' ? 'is-active' : ''} onClick={() => handleTabClick('categories')}>
          Categories GeoVision
        </button>
        <button type="button" className={activeTab === 'models' ? 'is-active' : ''} onClick={() => handleTabClick('models')}>
          Modeles GeoVision
        </button>
      </section>

      <section className="admin-catalogue-scroll-section" ref={categoriesSectionRef} data-tab="categories">
          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>{isEditingCategory ? 'Modifier categorie GeoVision' : 'Creer categorie GeoVision'}</h2>
              {isEditingCategory && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingCategoryId(null); setCategoryForm(INITIAL_CATEGORY_FORM); }}>
                  Annuler edition
                </button>
              )}
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
              <label>
                Parent
                <select
                  value={categoryForm.parent_id}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, parent_id: e.target.value }))}
                >
                  <option value="">Aucun parent</option>
                  {categories.map((cat) => {
                    const id = cat.id || cat.id_categorie;
                    return (
                      <option key={id} value={id}>{cat.nom}</option>
                    );
                  })}
                </select>
              </label>
              <label>
                Ordre
                <input
                  type="number"
                  min="0"
                  value={categoryForm.ordre}
                  onChange={(e) => setCategoryForm((prev) => ({ ...prev, ordre: e.target.value }))}
                />
              </label>
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
              <div className="admin-catalogue-actions">
                <button type="submit" className="btn-primary" disabled={savingCategory}>
                  {savingCategory ? 'Sauvegarde...' : isEditingCategory ? 'Enregistrer categorie' : 'Creer categorie'}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>Liste categories GeoVision</h2>
              <button type="button" className="btn-secondary" onClick={loadCategories}>Actualiser</button>
            </div>
            <div className="admin-catalogue-filters">
              <input
                placeholder="Rechercher categorie, slug, description..."
                value={categoryQuery}
                onChange={(e) => setCategoryQuery(e.target.value)}
              />
            </div>

            {loading ? (
              <Loader text="Chargement des categories GeoVision..." />
            ) : filteredCategories.length === 0 ? (
              <div className="admin-catalogue-empty">Aucune categorie GeoVision trouvee.</div>
            ) : (
              <div className="admin-catalogue-table-wrap">
                <table className="admin-catalogue-table">
                  <thead>
                    <tr>
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
                      return (
                        <tr key={id}>
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
                              <img className="admin-catalogue-thumb" src={cat.image_url || cat.image} alt={cat.nom} />
                            ) : (
                              <span className="admin-catalogue-muted">Aucune</span>
                            )}
                          </td>
                          <td>{cat.ordre ?? 0}</td>
                          <td>{cat.actif === false ? 'Non' : 'Oui'}</td>
                          <td>
                            <div className="admin-catalogue-row-actions">
                              <button type="button" className="btn-secondary" onClick={() => startEditCategory(cat)}>Editer</button>
                              <button type="button" className="admin-catalogue-danger" onClick={() => handleDeleteCategory(id)}>Supprimer</button>
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

      <section className="admin-catalogue-scroll-section" ref={modelsSectionRef} data-tab="models">
          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>{isEditingModel ? 'Modifier modele GeoVision' : 'Creer modele GeoVision'}</h2>
              {isEditingModel && (
                <button type="button" className="btn-secondary" onClick={() => { setEditingModelId(null); setModelForm(INITIAL_MODEL_FORM); setModelImageFiles([]); }}>
                  Annuler edition
                </button>
              )}
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
                  {categories.map((cat) => {
                    const id = cat.id || cat.id_categorie;
                    return <option key={id} value={id}>{cat.nom}</option>;
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
                Images du modele (televersement)
                <div style={{ display: 'grid', gap: '0.45rem' }}>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => setModelImageFiles(Array.from(e.target.files || []))}
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
                  {modelUploadPreviews.length === 0 && existingModelImages.length > 0 ? (
                    <div className="admin-catalogue-upload-preview-grid">
                      {existingModelImages.slice(0, 6).map((url, idx) => (
                        <img key={`${url}-${idx}`} src={url} alt={`Image existante ${idx + 1}`} className="admin-catalogue-thumb" />
                      ))}
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

              <div className="admin-catalogue-actions admin-catalogue-grid-span-2">
                <button type="submit" className="btn-primary" disabled={savingModel}>
                  {savingModel ? 'Sauvegarde...' : isEditingModel ? 'Enregistrer modele' : 'Creer modele'}
                </button>
              </div>
            </form>
          </section>

          <section className="admin-catalogue-card">
            <div className="admin-catalogue-card-head">
              <h2>Liste modeles GeoVision</h2>
              <button type="button" className="btn-secondary" onClick={loadModels}>Actualiser</button>
            </div>

            <div className="admin-catalogue-filters admin-catalogue-filters-3">
              <input placeholder="Rechercher titre, reference, modele..." value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} />
              <select value={modelCategoryFilter} onChange={(e) => setModelCategoryFilter(e.target.value)}>
                <option value="all">Toutes categories</option>
                {categories.map((cat) => {
                  const id = cat.id || cat.id_categorie;
                  return <option key={id} value={id}>{cat.nom}</option>;
                })}
              </select>
              <button type="button" className="btn-secondary" onClick={loadModels}>Rechercher</button>
            </div>

            {loadingModels ? (
              <Loader text="Chargement des modeles GeoVision..." />
            ) : filteredModels.length === 0 ? (
              <div className="admin-catalogue-empty">Aucun modele GeoVision trouve.</div>
            ) : (
              <div className="admin-catalogue-table-wrap">
                <table className="admin-catalogue-table">
                  <thead>
                    <tr>
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
                      const categoryName = categoriesById.get(Number(model.category_id || model.id_categorie))?.nom || model.category_name || '—';
                      const thumb = model.image_url || (Array.isArray(model.image_urls) ? model.image_urls[0] : null);
                      const features = Array.isArray(model.specifications?.features) ? model.specifications.features : [];

                      return (
                        <tr key={model.id}>
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
                              <button type="button" className="btn-secondary" onClick={() => startEditModel(model)}>Editer</button>
                              <button type="button" className="admin-catalogue-danger" onClick={() => handleDeleteModel(model.id)}>Supprimer</button>
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

      <AdminToast toast={toast} />
      </div>
  );
}
