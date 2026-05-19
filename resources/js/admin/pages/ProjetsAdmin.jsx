import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getProjetsAdmin,
  createProjet,
  updateProjet,
  deleteProjet,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import '../styles/projets-admin.css';

const INITIAL_FORM = {
  title: '',
  category: '',
  description: '',
  long_desc: '',
  url: '',
  slug: '',
  sort_order: 0,
  is_active: true,
  image: null,
  existing_image: '',
};

export default function ProjetsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const itemSelectionRef = useRef(null);
  const itemHeaderSelectionRef = useRef(null);

  function imageSrc(item) {
    return pickDisplayMediaUrl([item?.image_url, item?.image_path], '');
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await getProjetsAdmin();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
      toastError('Impossible de charger les projets');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadData(); }, []);

  const visibleItemIds = useMemo(
    () => items.map((item) => Number(item.id)).filter(Boolean),
    [items]
  );
  const selectedVisibleItemIds = useMemo(
    () => visibleItemIds.filter((id) => selectedItemIds.has(id)),
    [visibleItemIds, selectedItemIds]
  );
  const selectedItemCount = selectedVisibleItemIds.length;
  const allItemsSelected = visibleItemIds.length > 0 && selectedItemCount === visibleItemIds.length;
  const isBulkActionDisabled = bulkDeleting || selectedItemCount === 0;

  useEffect(() => {
    setSelectedItemIds((previous) => {
      if (visibleItemIds.length === 0) return new Set();
      const next = new Set();
      visibleItemIds.forEach((id) => { if (previous.has(id)) next.add(id); });
      return next;
    });
  }, [visibleItemIds]);

  useEffect(() => {
    const isIndeterminate = selectedItemCount > 0 && !allItemsSelected;
    if (itemSelectionRef.current) itemSelectionRef.current.indeterminate = isIndeterminate;
    if (itemHeaderSelectionRef.current) itemHeaderSelectionRef.current.indeterminate = isIndeterminate;
  }, [selectedItemCount, allItemsSelected]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    resetForm();
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
    setModalOpen(true);
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      category: item.category || '',
      description: item.description || '',
      long_desc: item.long_desc || '',
      url: item.url || '',
      slug: item.slug || '',
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active),
      image: null,
      existing_image: imageSrc(item),
    });
    setModalOpen(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.title?.trim()) { toastError('Le titre est obligatoire'); return; }
    if (!form.slug?.trim()) { toastError('Le slug est obligatoire'); return; }

    setSaving(true);
    try {
      const payload = {
        title: form.title,
        category: form.category,
        description: form.description,
        long_desc: form.long_desc,
        url: form.url,
        slug: form.slug,
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };

      if (form.image) payload.image = form.image;

      if (editingId) {
        await updateProjet(editingId, payload);
      } else {
        await createProjet(payload);
      }

      closeModal();
      await loadData();
      toastSuccess(editing ? 'Projet mis a jour.' : 'Projet cree.');
      notifyMutation();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Erreur enregistrement projet');
    } finally {
      setSaving(false);
    }
  }

  const toggleItemSelection = (id) => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAllItemSelection = () => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      if (visibleItemIds.length === 0) return next;
      const allSelected = visibleItemIds.every((id) => next.has(id));
      if (allSelected) visibleItemIds.forEach((id) => next.delete(id));
      else visibleItemIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const clearItemSelection = () => setSelectedItemIds(new Set());

  const handleBulkDeleteItems = async () => {
    if (bulkDeleting || selectedVisibleItemIds.length === 0) return;

    const baseLabel = selectedVisibleItemIds.length > 1
      ? `${selectedVisibleItemIds.length} projets`
      : '1 projet';

    if (!confirm(`Supprimer ${baseLabel} selectionnee(s) ?`)) return;

    setBulkDeleting(true);
    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const id of selectedVisibleItemIds) {
      try {
        await deleteProjet(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression projet';
      }
    }

    if (editingId && selectedVisibleItemIds.includes(Number(editingId))) closeModal();

    await loadData();
    setSelectedItemIds(new Set());

    if (deletedCount > 0) {
      toastSuccess(
        failedCount > 0
          ? `${deletedCount} projet(s) supprimee(s).`
          : `${deletedCount} projet(s) supprimee(s) avec succes.`
      );
      notifyMutation();
    }

    if (failedCount > 0) toastError(lastErrorMessage || `${failedCount} projet(s) non supprimee(s).`);

    setBulkDeleting(false);
  };

  async function handleDelete(id) {
    if (bulkDeleting) return;
    if (!confirm('Supprimer ce projet ?')) return;
    try {
      await deleteProjet(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelectedItemIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      if (editingId === id) closeModal();
      toastSuccess('Projet supprime.');
      notifyMutation();
    } catch (err) {
      toastError('Erreur suppression projet');
    }
  }

  return (
    <div className="projets-admin-page">
      <div className="projets-admin-header">
        <div>
          <h1>Projets</h1>
          <p>Gere les projets affiches sur la page <strong>Nos Projets</strong>.</p>
        </div>
        <button type="button" className="btn-primary" onClick={openCreateModal}>
          + Nouveau projet
        </button>
      </div>

      {modalOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
          <div className="admin-catalogue-modal-shell" onClick={(e) => e.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal" aria-label={editingId ? 'Edition projet' : 'Creation projet'}>
              <div className="admin-catalogue-card-head">
                <h2>{editingId ? 'Modifier le projet' : 'Nouveau projet'}</h2>
                <button type="button" className="projets-modal-close" onClick={closeModal} disabled={saving} aria-label="Fermer">
                  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#172243">
                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit} className="projets-modal-form">
                <label>
                  Titre
                  <input type="text" placeholder="Titre" value={form.title} onChange={(e) => setField('title', e.target.value)} required />
                </label>
                <label>
                  Catégorie
                  <input type="text" placeholder="Categorie" value={form.category} onChange={(e) => setField('category', e.target.value)} required />
                </label>
                <label>
                  Slug
                  <input type="text" placeholder="slug-du-projet" value={form.slug} onChange={(e) => setField('slug', e.target.value)} required />
                </label>
                <label>
                  URL du site
                  <input type="url" placeholder="https://..." value={form.url} onChange={(e) => setField('url', e.target.value)} />
                </label>
                <label className="projets-modal-full">
                  Description (courte)
                  <textarea placeholder="Description courte pour la grille" value={form.description} onChange={(e) => setField('description', e.target.value)} required rows={3} />
                </label>
                <label className="projets-modal-full">
                  Description (détaillée)
                  <textarea placeholder="Description détaillée pour la page de présentation" value={form.long_desc} onChange={(e) => setField('long_desc', e.target.value)} rows={5} />
                </label>
                <label>
                  Ordre
                  <input type="number" min={0} placeholder="Ordre" value={form.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
                </label>
                <label className="projets-modal-check">
                  <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
                  Actif
                </label>
                <label className="projets-modal-full">
                  Image
                  <input type="file" accept="image/*" onChange={(e) => setField('image', e.target.files?.[0] || null)} />
                  {form.existing_image ? (
                    <img src={form.existing_image} alt="Image actuelle" className="projets-admin-preview" />
                  ) : null}
                </label>
                <div className="projets-modal-actions">
                  <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={saving}>
                    {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      <div className="card">
        <h2>Projets configures ({items.length})</h2>
        <div className="admin-bulk-bar">
          <label className="admin-bulk-select">
            <input type="checkbox" ref={itemSelectionRef} checked={allItemsSelected} onChange={toggleAllItemSelection} disabled={visibleItemIds.length === 0 || bulkDeleting} />
            <span>{selectedItemCount} selectionnee(s)</span>
          </label>
          <div className="admin-bulk-actions">
            <button type="button" className="btn-secondary" onClick={clearItemSelection} disabled={selectedItemCount === 0 || bulkDeleting}>Effacer la selection</button>
            <button type="button" className="btn-secondary" onClick={handleBulkDeleteItems} disabled={isBulkActionDisabled}>Supprimer la selection</button>
          </div>
        </div>
        {(
          <table className="admin-bulk-table">
            <thead>
              <tr>
                <th>
                  <input type="checkbox" ref={itemHeaderSelectionRef} checked={allItemsSelected} onChange={toggleAllItemSelection} disabled={visibleItemIds.length === 0 || bulkDeleting} aria-label="Selectionner tous les projets" />
                </th>
                <th>ID</th>
                <th>Image</th>
                <th>Titre</th>
                <th>Catégorie</th>
                <th>Slug</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = Number(item.id);
                const isChecked = selectedItemIds.has(id);
                return (
                  <tr key={item.id}>
                    <td>
                      <input type="checkbox" checked={isChecked} onChange={() => toggleItemSelection(id)} disabled={bulkDeleting} aria-label={`Selectionner le projet ${item?.title || id}`} />
                    </td>
                    <td>{item.id}</td>
                    <td>
                      {imageSrc(item) ? (
                        <img src={imageSrc(item)} alt={item.title} className="projets-admin-thumb" />
                      ) : '—'}
                    </td>
                    <td className="projets-admin-cell-title">{item.title}</td>
                    <td><span className="projets-admin-cat">{item.category}</span></td>
                    <td><code className="projets-admin-slug">{item.slug}</code></td>
                    <td>{item.sort_order ?? 0}</td>
                    <td><span className={`projets-admin-status ${item.is_active ? 'projets-admin-status--active' : 'projets-admin-status--inactive'}`}>{item.is_active ? 'Actif' : 'Inactif'}</span></td>
                    <td>
                      <button type="button" className="projets-admin-btn-edit" onClick={() => startEdit(item)} aria-label={`Editer le projet ${item?.title || item.id}`}>
                        <svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="#274483">
                          <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                        </svg>
                      </button>
                      <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer le projet ${item?.title || item.id}`} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
