import React, { useEffect, useMemo, useState } from 'react';
import {
  getHomeGeovisionSectionsAdmin,
  createHomeGeovisionSection,
  updateHomeGeovisionSection,
  deleteHomeGeovisionSection,
} from '../api';
import Loader from '../../components/Loader';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import '../styles/home-geovision.css';

const EMPTY_FORM = { title: '', description: '', link: '', sort_order: 0, is_active: true, image: null };

export default function GeovisionHomeAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const imageSrc = (item) => pickDisplayMediaUrl([item?.image_url, item?.image_path], '');

  async function loadData() {
    setLoading(true);
    try {
      const res = await getHomeGeovisionSectionsAdmin();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch {
      setItems([]);
      toastError('Impossible de charger les sections GeoVision');
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
    if (visibleItemIds.length === 0) { setSelectedItemIds(new Set()); return; }
    setSelectedItemIds((prev) => {
      const next = new Set();
      visibleItemIds.forEach((id) => { if (prev.has(id)) next.add(id); });
      return next;
    });
  }, [visibleItemIds]);

  function toggleSelectAll() {
    setSelectedItemIds((prev) => {
      if (prev.size === visibleItemIds.length && visibleItemIds.length > 0) return new Set();
      return new Set(visibleItemIds);
    });
  }

  function toggleSelectItem(id) {
    setSelectedItemIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    if (selectedItemCount === 0 || !window.confirm(`Supprimer ${selectedItemCount} section(s) GeoVision ?`)) return;
    setBulkDeleting(true);
    let success = 0;
    for (const id of selectedVisibleItemIds) {
      try { await deleteHomeGeovisionSection(id); success++; } catch { /* skip */ }
    }
    if (success > 0) {
      toastSuccess(`${success} section(s) supprimée(s)`);
      notifyMutation('home-geovision-section');
      loadData();
    }
    setBulkDeleting(false);
  }

  function openCreate() {
    setEditingId(null);
    setForm({ ...EMPTY_FORM, sort_order: items.reduce((max, i) => Math.max(max, i.sort_order || 0), 0) + 10 });
    setShowForm(true);
  }

  function openEdit(item) {
    setEditingId(item.id);
    setForm({
      title: item.title || '',
      description: item.description || '',
      link: item.link || '',
      sort_order: item.sort_order ?? 0,
      is_active: item.is_active !== false,
      image: null,
      existing_image: imageSrc(item),
    });
    setShowForm(true);
  }

  function closeForm() {
    setEditingId(null);
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  async function handleSave(e) {
    e.preventDefault();
    if (!form.title.trim()) { toastError('Le titre est obligatoire'); return; }
    setSaving(true);
    try {
      if (editingId) {
        await updateHomeGeovisionSection(editingId, form);
        toastSuccess('Section GeoVision mise à jour');
      } else {
        await createHomeGeovisionSection(form);
        toastSuccess('Section GeoVision créée');
      }
      notifyMutation('home-geovision-section');
      closeForm();
      loadData();
    } catch {
      toastError('Erreur lors de la sauvegarde');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Supprimer cette section GeoVision ?')) return;
    try {
      await deleteHomeGeovisionSection(id);
      toastSuccess('Section GeoVision supprimée');
      notifyMutation('home-geovision-section');
      loadData();
    } catch {
      toastError('Erreur lors de la suppression');
    }
  }

  return (
    <div className="admin-geovision-page">
      <div className="admin-geovision-hero">
        <h1>🏠 Sections GeoVision (Accueil)</h1>
        <p>Gérez les cartes GeoVision affichées sur la page d'accueil (Caméras, Contrôle d'accès, etc.).</p>
      </div>

      <div className="admin-geovision-toolbar">
        <button className="btn-primary" onClick={openCreate}>+ Nouvelle section</button>
        <button className="btn-danger" disabled={isBulkActionDisabled} onClick={handleBulkDelete}>
          Supprimer ({selectedItemCount})
        </button>
      </div>

      {loading ? (
        <Loader />
      ) : (
        <div className="admin-geovision-card">
          <table className="admin-table">
            <thead>
              <tr>
                <th className="admin-geovision-checkbox-cell">
                  <input type="checkbox" checked={allItemsSelected} onChange={toggleSelectAll} />
                </th>
                <th>Image</th>
                <th>Titre</th>
                <th>Description</th>
                <th>Ordre</th>
                <th>Lien</th>
                <th>Actif</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr><td colSpan={8} className="admin-empty">Aucune section GeoVision</td></tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id}>
                    <td className="admin-geovision-checkbox-cell">
                      <input type="checkbox" checked={selectedItemIds.has(Number(item.id))}
                        onChange={() => toggleSelectItem(Number(item.id))} />
                    </td>
                    <td>
                      {imageSrc(item) ? (
                        <img src={imageSrc(item)} alt={item.title} className="admin-geovision-thumb" />
                      ) : (
                        <span className="admin-geovision-no-thumb">—</span>
                      )}
                    </td>
                    <td><strong>{item.title}</strong></td>
                    <td className="admin-geovision-desc-cell">{item.description}</td>
                    <td>{item.sort_order}</td>
                    <td className="admin-geovision-link-cell">{item.link}</td>
                    <td>{item.is_active ? '✅' : '❌'}</td>
                    <td>
                      <div className="admin-geovision-action-btns">
                        <button className="admin-geovision-btn-sm" onClick={() => openEdit(item)}>✏️</button>
                        <DeleteIconButton onDelete={() => handleDelete(item.id)} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showForm && (
        <div className="admin-modal-overlay" onClick={closeForm}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingId ? 'Modifier' : 'Nouvelle'} section GeoVision</h2>
              <button className="admin-modal-close" onClick={closeForm}>×</button>
            </div>
            <form onSubmit={handleSave} className="admin-form">
              <div className="admin-form-grid">
                <div className="admin-form-field">
                  <label>Titre *</label>
                  <input type="text" value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Caméras" required />
                </div>
                <div className="admin-form-field">
                  <label>Ordre</label>
                  <input type="number" value={form.sort_order}
                    onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })} />
                </div>
                <div className="admin-form-field admin-form-grid-full">
                  <label>Description</label>
                  <textarea rows={2} value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Description courte affichée sur la carte" />
                </div>
                <div className="admin-form-field admin-form-grid-full">
                  <label>Lien</label>
                  <input type="text" value={form.link}
                    onChange={(e) => setForm({ ...form, link: e.target.value })}
                    placeholder="/geovision?famille=geovision-cameras" />
                </div>
                <div className="admin-form-field">
                  <label>Image</label>
                  <input type="file" accept="image/*"
                    onChange={(e) => setForm({ ...form, image: e.target.files?.[0] || null })} />
                  {form.existing_image && !form.image && (
                    <img src={form.existing_image} alt="Prévisualisation" className="admin-geovision-thumb-preview" />
                  )}
                </div>
                <div className="admin-form-field">
                  <label>Actif</label>
                  <select value={form.is_active ? '1' : '0'}
                    onChange={(e) => setForm({ ...form, is_active: e.target.value === '1' })}>
                    <option value="1">Oui</option>
                    <option value="0">Non</option>
                  </select>
                </div>
              </div>
              <div className="admin-form-actions">
                <button type="button" className="admin-btn admin-btn-secondary" onClick={closeForm}>Annuler</button>
                <button type="submit" className="admin-btn admin-btn-primary" disabled={saving}>
                  {saving ? 'Enregistrement...' : 'Enregistrer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
