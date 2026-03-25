import React, { useEffect, useMemo, useState } from 'react';
import { getProducts, createProduct, deleteProduct, updateProduct, getCategories, uploadProductImages } from '../api';
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import './products.css';

const INITIAL_FORM = {
  title: '',
  price: '',
  prix_promo: '',
  id_categorie: '',
  statut: 'disponible',
  stock: '0',
  stock_alerte: '5',
  reference: '',
  marque: '',
  modele: '',
  garantie: '',
  poids: '',
  slug: '',
  description_courte: '',
  description: '',
  spec_overview: '',
  spec_rows: '',
  images: [],
  est_nouveau: false,
  est_en_vedette: false,
  en_promo: false,
};

const formatPrice = (value) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return '0';
  return numeric.toLocaleString('fr-FR');
};

const specsToRowsText = (specs) => {
  const rows = Array.isArray(specs?.technical_specs) ? specs.technical_specs : [];
  return rows
    .map((row) => {
      const label = String(row?.label || '').trim();
      const value = String(row?.value || '').trim();
      if (!label && !value) return '';
      return `${label}: ${value}`;
    })
    .filter(Boolean)
    .join('\n');
};

const rowsTextToSpecs = (value) => {
  const rows = String(value || '')
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [labelPart, ...rest] = line.split(':');
      return {
        label: String(labelPart || '').trim(),
        value: String(rest.join(':') || '').trim(),
      };
    })
    .filter((row) => row.label || row.value);

  return rows;
};

const toFormValues = (item) => ({
  title: item.title || item.titre || '',
  price: item.price ?? item.prix ?? '',
  prix_promo: item.promo_price ?? item.prix_promo ?? '',
  id_categorie: item.category_id ?? item.id_categorie ?? '',
  statut: item.statut || 'disponible',
  stock: item.stock ?? 0,
  stock_alerte: item.stock_alert ?? item.stock_alerte ?? 5,
  reference: item.reference || '',
  marque: item.marque || '',
  modele: item.modele || '',
  garantie: item.garantie || '',
  poids: item.poids ?? '',
  slug: item.slug || '',
  description_courte: item.short_description || item.description_courte || '',
  description: item.description || '',
  spec_overview: item?.specifications?.overview || '',
  spec_rows: specsToRowsText(item.specifications || {}),
  images: [],
  est_nouveau: Boolean(item.est_nouveau),
  est_en_vedette: Boolean(item.est_en_vedette),
  en_promo: Boolean(item.en_promo),
});

export default function Products() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(INITIAL_FORM);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [filters, setFilters] = useState({
    q: '',
    statut: 'all',
    id_categorie: 'all',
  });

  const categoriesById = useMemo(() => {
    const map = new Map();
    categories.forEach((category) => {
      const id = Number(category.id || category.id_categorie);
      if (id) {
        map.set(id, category.nom || category.name || 'Sans nom');
      }
    });
    return map;
  }, [categories]);

  const isEditing = editingId !== null;
  const formTitle = isEditing ? 'Modifier le produit' : 'Creer un produit';
  const displayedItems = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    if (!q) return items;

    return items.filter((item) => {
      const values = [
        item.title,
        item.reference,
        item.marque,
        item.modele,
        item.description,
        item.description_courte,
      ];

      return values.some((value) => String(value || '').toLowerCase().includes(q));
    });
  }, [items, filters.q]);

  async function loadCategories() {
    try {
      const res = await getCategories({ segment: 'general' });
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setCategories([]);
    }
  }

  async function loadProducts() {
    setLoading(true);
    try {
      const params = {
        segment: 'general',
      };

      if (filters.statut !== 'all') {
        params.statut = filters.statut;
      }

      if (filters.id_categorie !== 'all') {
        params.id_categorie = Number(filters.id_categorie);
      }

      const res = await getProducts(params);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadCategories();
  }, []);

  useEffect(() => {
    loadProducts();
  }, [filters.statut, filters.id_categorie]);

  function handleSearchSubmit(e) {
    e.preventDefault();
    setFilters((prev) => ({ ...prev, q: searchInput }));
  }

  function handleSearchReset() {
    setSearchInput('');
    setFilters((prev) => ({ ...prev, q: '' }));
  }

  async function handleSave(e) {
    e.preventDefault();

    if (!form.title.trim()) {
      alert('Le titre est obligatoire.');
      return;
    }
    if (!form.price && form.price !== 0) {
      alert('Le prix est obligatoire.');
      return;
    }
    if (!form.id_categorie) {
      alert('La categorie est obligatoire.');
      return;
    }

    setSaving(true);
    try {
      const specifications = {
        overview: form.spec_overview || '',
        technical_specs: rowsTextToSpecs(form.spec_rows),
      };

      const payload = {
        ...form,
        specifications,
      };

      delete payload.images;
      delete payload.spec_overview;
      delete payload.spec_rows;

      let savedProductId = null;
      if (isEditing) {
        const res = await updateProduct(editingId, payload);
        savedProductId = Number(res?.data?.data?.id_produit || editingId);
      } else {
        const res = await createProduct(payload);
        savedProductId = Number(res?.data?.data?.id_produit || res?.data?.id_produit || 0);
      }

      const files = Array.isArray(form.images) ? form.images : [];
      if (savedProductId && files.length > 0) {
        await uploadProductImages(savedProductId, files);
      }

      setForm(INITIAL_FORM);
      setEditingId(null);
      await loadProducts();
    } catch (err) {
      console.error('Save product error', err);
      alert(err?.response?.data?.message || 'Erreur de sauvegarde produit');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce produit ?')) return;

    try {
      await deleteProduct(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      if (editingId === id) {
        setEditingId(null);
        setForm(INITIAL_FORM);
      }
    } catch (err) {
      console.error('Delete error', err);
      alert('Erreur suppression');
    }
  }

  function handleStartEdit(item) {
    setEditingId(item.id);
    setForm(toFormValues(item));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCancelEdit() {
    setEditingId(null);
    setForm(INITIAL_FORM);
  }

  return (
    <div className="admin-products-page">
      <header className="admin-products-hero">
        <div>
          <h1>Produits boutique (segment general)</h1>
          <p>
            Cette interface admin gere uniquement les produits affiches sur la page Produits publique.
            Tous les champs utiles (categorie, image, prix, descriptions, stock, badges) sont geres ici.
          </p>
        </div>
        <span className="admin-products-count">{items.length} produit(s)</span>
      </header>

      <section className="admin-products-card">
        <div className="admin-products-card-head">
          <h2>{formTitle}</h2>
          {isEditing && (
            <button type="button" className="btn-secondary" onClick={handleCancelEdit}>
              Annuler l'edition
            </button>
          )}
        </div>

        <form onSubmit={handleSave} className="admin-products-form">
          <div className="admin-products-grid">
            <label>
              Titre
              <input
                placeholder="Ex: Camera IP 4MP"
                value={form.title}
                onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                required
              />
            </label>

            <label>
              Categorie
              <select
                value={form.id_categorie}
                onChange={(e) => setForm((prev) => ({ ...prev, id_categorie: e.target.value }))}
                required
              >
                <option value="">Selectionner une categorie</option>
                {categories.map((category) => {
                  const id = category.id || category.id_categorie;
                  return (
                    <option key={id} value={id}>
                      {category.nom}
                    </option>
                  );
                })}
              </select>
            </label>

            <label>
              Prix (FCFA)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                required
              />
            </label>

            <label>
              Prix promo (FCFA)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.prix_promo}
                onChange={(e) => setForm((prev) => ({ ...prev, prix_promo: e.target.value }))}
              />
            </label>

            <label>
              Statut
              <select
                value={form.statut}
                onChange={(e) => setForm((prev) => ({ ...prev, statut: e.target.value }))}
              >
                <option value="disponible">Disponible</option>
                <option value="indisponible">Indisponible</option>
                <option value="rupture">Rupture</option>
                <option value="actif">Actif</option>
              </select>
            </label>

            <label>
              Reference
              <input
                placeholder="Ex: CAM-4MP-2026"
                value={form.reference}
                onChange={(e) => setForm((prev) => ({ ...prev, reference: e.target.value }))}
              />
            </label>

            <label>
              Marque
              <input
                placeholder="Ex: Samsung"
                value={form.marque}
                onChange={(e) => setForm((prev) => ({ ...prev, marque: e.target.value }))}
              />
            </label>

            <label>
              Modele
              <input
                placeholder="Ex: SmartCam S4"
                value={form.modele}
                onChange={(e) => setForm((prev) => ({ ...prev, modele: e.target.value }))}
              />
            </label>

            <label>
              Stock
              <input
                type="number"
                min="0"
                value={form.stock}
                onChange={(e) => setForm((prev) => ({ ...prev, stock: e.target.value }))}
              />
            </label>

            <label>
              Seuil alerte stock
              <input
                type="number"
                min="0"
                value={form.stock_alerte}
                onChange={(e) => setForm((prev) => ({ ...prev, stock_alerte: e.target.value }))}
              />
            </label>

            <label>
              Garantie
              <input
                placeholder="Ex: 2 ans"
                value={form.garantie}
                onChange={(e) => setForm((prev) => ({ ...prev, garantie: e.target.value }))}
              />
            </label>

            <label>
              Poids (kg)
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.poids}
                onChange={(e) => setForm((prev) => ({ ...prev, poids: e.target.value }))}
              />
            </label>

            <label>
              Slug (optionnel)
              <input
                placeholder="camera-ip-smartcam-s4"
                value={form.slug}
                onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))}
              />
            </label>
          </div>

          <div className="admin-products-textareas">
            <label>
              Description courte
              <textarea
                rows={2}
                placeholder="Resume court affiche sur les cartes produit"
                value={form.description_courte}
                onChange={(e) => setForm((prev) => ({ ...prev, description_courte: e.target.value }))}
              />
            </label>

            <label>
              Description detaillee
              <textarea
                rows={4}
                placeholder="Description complete du produit"
                value={form.description}
                onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              />
            </label>

            <label>
              Resume technique
              <textarea
                rows={2}
                placeholder="Ex: Camera IP 4MP, vision nocturne, ONVIF"
                value={form.spec_overview}
                onChange={(e) => setForm((prev) => ({ ...prev, spec_overview: e.target.value }))}
              />
            </label>

            <label>
              Specifications detaillees (1 ligne par spec: Libelle: Valeur)
              <textarea
                rows={4}
                placeholder={'Resolution: 4MP\nObjectif: 2.8mm\nIR: 30m'}
                value={form.spec_rows}
                onChange={(e) => setForm((prev) => ({ ...prev, spec_rows: e.target.value }))}
              />
            </label>
          </div>

          <div className="admin-products-upload-block">
            <label>
              Images produit (televersement depuis le PC)
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => setForm((prev) => ({ ...prev, images: Array.from(e.target.files || []) }))}
              />
            </label>
            <small>
              {form.images?.length > 0
                ? `${form.images.length} image(s) selectionnee(s) pour ${isEditing ? 'ajout' : 'creation'}.`
                : 'Aucune nouvelle image selectionnee. Les images existantes restent inchangees en edition.'}
            </small>
          </div>

          <div className="admin-products-checkboxes">
            <label>
              <input
                type="checkbox"
                checked={form.est_nouveau}
                onChange={(e) => setForm((prev) => ({ ...prev, est_nouveau: e.target.checked }))}
              />
              Marquer comme nouveau
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.est_en_vedette}
                onChange={(e) => setForm((prev) => ({ ...prev, est_en_vedette: e.target.checked }))}
              />
              Afficher en vedette
            </label>
            <label>
              <input
                type="checkbox"
                checked={form.en_promo}
                onChange={(e) => setForm((prev) => ({ ...prev, en_promo: e.target.checked }))}
              />
              Produit en promo
            </label>
          </div>

          <div className="admin-products-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Sauvegarde...' : isEditing ? 'Enregistrer les modifications' : 'Creer le produit'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-products-card">
        <div className="admin-products-card-head">
          <h2>Produits enregistres</h2>
          <button type="button" className="btn-secondary" onClick={loadProducts}>
            Actualiser
          </button>
        </div>

        <form className="admin-products-searchbar" onSubmit={handleSearchSubmit}>
          <input
            placeholder="Rechercher un produit (titre, reference, marque, modele...)"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
          <button type="submit" className="btn-primary">
            Rechercher
          </button>
          <button type="button" className="btn-secondary" onClick={handleSearchReset}>
            Effacer
          </button>
        </form>

        <div className="admin-products-filters">
          <select
            value={filters.id_categorie}
            onChange={(e) => setFilters((prev) => ({ ...prev, id_categorie: e.target.value }))}
          >
            <option value="all">Toutes les categories</option>
            {categories.map((category) => {
              const id = category.id || category.id_categorie;
              return (
                <option key={id} value={id}>
                  {category.nom}
                </option>
              );
            })}
          </select>

          <select
            value={filters.statut}
            onChange={(e) => setFilters((prev) => ({ ...prev, statut: e.target.value }))}
          >
            <option value="all">Tous les statuts</option>
            <option value="disponible">Disponible</option>
            <option value="indisponible">Indisponible</option>
            <option value="rupture">Rupture</option>
            <option value="actif">Actif</option>
          </select>
        </div>

        {loading ? (
          <Loader text="Chargement des produits..." />
        ) : displayedItems.length === 0 ? (
          <div className="admin-products-empty">Aucun produit trouve pour ce filtre.</div>
        ) : (
          <div className="admin-products-table-wrap">
            <table className="admin-products-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Produit</th>
                  <th>Categorie</th>
                  <th>Prix</th>
                  <th>Stock</th>
                  <th>Statut</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {displayedItems.map((item) => {
                  const categoryName = categoriesById.get(Number(item.category_id || item.id_categorie)) || '—';
                  const image = item.image_url || (Array.isArray(item.image_urls) ? item.image_urls[0] : null) || '/images/default.webp';

                  return (
                    <tr key={item.id}>
                      <td>#{item.id}</td>
                      <td>
                        <div className="admin-products-product-cell">
                          <img src={image} alt={item.title || 'Produit'} />
                          <div>
                            <strong>{item.title || 'Sans titre'}</strong>
                            <span>{item.reference || 'Reference non definie'}</span>
                            <small>
                              {item.marque || 'Marque N/A'}
                              {item.modele ? ` · ${item.modele}` : ''}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td>{categoryName}</td>
                      <td>
                        <div className="admin-products-price-cell">
                          <strong>{formatPrice(item.price)} FCFA</strong>
                          {item.promo_price ? <span>{formatPrice(item.promo_price)} FCFA (promo)</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="admin-products-stock-cell">
                          <strong>{item.stock ?? 0}</strong>
                          <span>seuil {item.stock_alert ?? item.stock_alerte ?? 0}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`admin-products-status admin-products-status--${item.statut || 'indisponible'}`}>
                          {item.statut || 'indisponible'}
                        </span>
                        <div className="admin-products-badges">
                          {item.est_nouveau ? <span>Nouveau</span> : null}
                          {item.est_en_vedette ? <span>Vedette</span> : null}
                          {item.en_promo ? <span>Promo</span> : null}
                        </div>
                      </td>
                      <td>
                        <div className="admin-products-row-actions">
                          <button type="button" className="btn-secondary" onClick={() => handleStartEdit(item)}>
                            Editer
                          </button>
                          <button type="button" className="admin-products-danger" onClick={() => handleDelete(item.id)}>
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
    </div>
  );
}
