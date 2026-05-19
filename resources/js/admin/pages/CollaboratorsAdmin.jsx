import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getHomeCollaboratorsAdmin,
  createHomeCollaborator,
  updateHomeCollaborator,
  deleteHomeCollaborator,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import '../styles/collaborators.css';

const INITIAL_FORM = {
  name: '',
  object_position: '',
  sort_order: 0,
  is_active: true,
  image: null,
  existing_image: '',
};

export default function CollaboratorsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
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
      const res = await getHomeCollaboratorsAdmin();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
      toastError('Impossible de charger les collaborateurs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
      if (visibleItemIds.length === 0) {
        return new Set();
      }

      const next = new Set();
      visibleItemIds.forEach((id) => {
        if (previous.has(id)) {
          next.add(id);
        }
      });

      return next;
    });
  }, [visibleItemIds]);

  useEffect(() => {
    const isIndeterminate = selectedItemCount > 0 && !allItemsSelected;
    if (itemSelectionRef.current) {
      itemSelectionRef.current.indeterminate = isIndeterminate;
    }
    if (itemHeaderSelectionRef.current) {
      itemHeaderSelectionRef.current.indeterminate = isIndeterminate;
    }
  }, [selectedItemCount, allItemsSelected]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM });
  }

  function startEdit(item) {
    setEditingId(item.id);
    setForm({
      name: item.name || '',
      object_position: item.object_position || '',
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active),
      image: null,
      existing_image: imageSrc(item),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.name?.trim()) {
      toastError('Le nom est obligatoire');
      return;
    }

    if (!editingId && !form.image) {
      toastError('Veuillez ajouter une image');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        object_position: form.object_position,
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };

      if (form.image) payload.image = form.image;

      if (editingId) {
        await updateHomeCollaborator(editingId, payload);
      } else {
        await createHomeCollaborator(payload);
      }

      resetForm();
      await loadData();
      toastSuccess(editing ? 'Collaborateur mis a jour.' : 'Collaborateur cree.');
      notifyMutation();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Erreur enregistrement collaborateur');
    } finally {
      setSaving(false);
    }
  }

  const toggleItemSelection = (id) => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllItemSelection = () => {
    setSelectedItemIds((previous) => {
      const next = new Set(previous);
      if (visibleItemIds.length === 0) {
        return next;
      }

      const allSelected = visibleItemIds.every((id) => next.has(id));
      if (allSelected) {
        visibleItemIds.forEach((id) => next.delete(id));
      } else {
        visibleItemIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearItemSelection = () => {
    setSelectedItemIds(new Set());
  };

  const handleBulkDeleteItems = async () => {
    if (bulkDeleting || selectedVisibleItemIds.length === 0) return;

    const baseLabel = selectedVisibleItemIds.length > 1
      ? `${selectedVisibleItemIds.length} collaborateurs`
      : '1 collaborateur';

    if (!confirm(`Supprimer ${baseLabel} selectionnee(s) ?`)) return;

    setBulkDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const id of selectedVisibleItemIds) {
      try {
        await deleteHomeCollaborator(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression collaborateur';
      }
    }

    if (editingId && selectedVisibleItemIds.includes(Number(editingId))) {
      resetForm();
    }

    await loadData();
    setSelectedItemIds(new Set());

    if (deletedCount > 0) {
      toastSuccess(
        failedCount > 0
          ? `${deletedCount} collaborateur(s) supprimee(s).`
          : `${deletedCount} collaborateur(s) supprimee(s) avec succes.`
      );
      notifyMutation();
    }

    if (failedCount > 0) {
      toastError(lastErrorMessage || `${failedCount} collaborateur(s) non supprimee(s).`);
    }

    setBulkDeleting(false);
  };

  async function handleDelete(id) {
    if (bulkDeleting) return;
    if (!confirm('Supprimer ce collaborateur ?')) return;
    try {
      await deleteHomeCollaborator(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelectedItemIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      if (editingId === id) resetForm();
      toastSuccess('Collaborateur supprime.');
      notifyMutation();
    } catch (err) {
      toastError('Erreur suppression collaborateur');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.6rem' }}>Collaborateurs</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem' }}>
        Gere la section <strong>Nos collaborateurs prestigieux</strong> affichee sur la page d'accueil.
      </p>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier collaborateur' : 'Ajouter un collaborateur'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Nom
              <input
                type="text"
                placeholder="Nom"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Object position
              <input
                type="text"
                placeholder="Object position (ex: center 0%)"
                value={form.object_position}
                onChange={(e) => setField('object_position', e.target.value)}
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Ordre
              <input
                type="number"
                min={0}
                placeholder="Ordre"
                value={form.sort_order}
                onChange={(e) => setField('sort_order', e.target.value)}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'end' }}>
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setField('is_active', e.target.checked)}
              />
              Actif
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Image collaborateur
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setField('image', e.target.files?.[0] || null)}
              />
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {form.existing_image ? (
                <img
                  src={form.existing_image}
                  alt="Image actuelle"
                  style={{ width: '90px', height: '58px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb' }}
                />
              ) : null}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
              </button>
              {editingId ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  height="24px"
                  viewBox="0 -960 960 960"
                  width="24px"
                  fill="#000000"
                  role="button"
                  tabIndex={0}
                  onMouseDown={(e) => e.preventDefault()}
                  aria-label="Annuler"
                  onClick={() => { if (!saving) resetForm(); }}
                  onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !saving) resetForm(); }}
                  style={{ cursor: saving ? 'default' : 'pointer', verticalAlign: 'middle', border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
                >
                  <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                </svg>
              ) : null}
            </div>
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Collaborateurs configures ({items.length})</h2>
        <div className="admin-bulk-bar">
          <label className="admin-bulk-select">
            <input
              type="checkbox"
              ref={itemSelectionRef}
              checked={allItemsSelected}
              onChange={toggleAllItemSelection}
              disabled={visibleItemIds.length === 0 || bulkDeleting}
            />
            <span>{selectedItemCount} selectionnee(s)</span>
          </label>
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={clearItemSelection}
              disabled={selectedItemCount === 0 || bulkDeleting}
            >
              Effacer la selection
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBulkDeleteItems}
              disabled={isBulkActionDisabled}
            >
              Supprimer la selection
            </button>
          </div>
        </div>
        {(
          <table className="admin-bulk-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    ref={itemHeaderSelectionRef}
                    checked={allItemsSelected}
                    onChange={toggleAllItemSelection}
                    disabled={visibleItemIds.length === 0 || bulkDeleting}
                    aria-label="Selectionner tous les collaborateurs"
                  />
                </th>
                <th>ID</th>
                <th>Image</th>
                <th>Nom</th>
                <th>Position image</th>
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
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItemSelection(id)}
                        disabled={bulkDeleting}
                        aria-label={`Selectionner le collaborateur ${item?.name || id}`}
                      />
                    </td>
                    <td>{item.id}</td>
                  <td>
                    {imageSrc(item) ? (
                      <img
                        src={imageSrc(item)}
                        alt={item.name}
                        style={{ width: '90px', height: '58px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #e5e7eb', objectPosition: item.object_position || 'center center' }}
                      />
                    ) : '—'}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.object_position || '—'}</td>
                  <td>{item.sort_order ?? 0}</td>
                  <td>{item.is_active ? 'Actif' : 'Inactif'}</td>
                  <td>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="24px"
                      viewBox="0 -960 960 960"
                      width="24px"
                      fill="#274483"
                      role="button"
                      tabIndex={0}
                      aria-label={`Editer le collaborateur ${item?.name || item.id}`}
                      onClick={() => startEdit(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(item); }}
                      style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                    >
                      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                    </svg>
                    <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer le collaborateur ${item?.name || item.id}`} />
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
