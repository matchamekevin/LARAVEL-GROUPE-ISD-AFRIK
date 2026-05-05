import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getHomeTestimonialsAdmin,
  createHomeTestimonial,
  updateHomeTestimonial,
  deleteHomeTestimonial,
} from '../api';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import DeleteIconButton from '../components/DeleteIconButton';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import '../styles/testimonials.css';

const INITIAL_FORM = {
  name: '',
  role: '',
  company: '',
  text: '',
  rating: 5,
  sort_order: 0,
  is_active: true,
  avatar: null,
  existing_avatar: '',
};

export default function TestimonialsAdmin() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const [selectedItemIds, setSelectedItemIds] = useState(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const itemSelectionRef = useRef(null);
  const itemHeaderSelectionRef = useRef(null);
  const { toast, showToast } = useAdminToast();

  function avatarSrc(item) {
    return pickDisplayMediaUrl([item?.avatar_url, item?.avatar_path], '');
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await getHomeTestimonialsAdmin();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
      showToast('Impossible de charger les avis clients', 'error');
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
      role: item.role || '',
      company: item.company || '',
      text: item.text || '',
      rating: item.rating || 5,
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active),
      avatar: null,
      existing_avatar: avatarSrc(item),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.name?.trim()) {
      showToast('Le nom du client est obligatoire', 'error');
      return;
    }

    if (!form.text?.trim()) {
      showToast('Le temoignage est obligatoire', 'error');
      return;
    }

    if (!editingId && !form.avatar) {
      showToast('Veuillez ajouter un avatar/logo', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        role: form.role,
        company: form.company,
        text: form.text,
        rating: Number(form.rating || 5),
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };

      if (form.avatar) payload.avatar = form.avatar;

      if (editingId) {
        await updateHomeTestimonial(editingId, payload);
      } else {
        await createHomeTestimonial(payload);
      }

      resetForm();
      await loadData();
      showToast(editing ? 'Avis mis a jour.' : 'Avis cree.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur enregistrement avis', 'error');
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
      ? `${selectedVisibleItemIds.length} avis`
      : '1 avis';

    if (!confirm(`Supprimer ${baseLabel} selectionnee(s) ?`)) return;

    setBulkDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const id of selectedVisibleItemIds) {
      try {
        await deleteHomeTestimonial(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression avis';
      }
    }

    if (editingId && selectedVisibleItemIds.includes(Number(editingId))) {
      resetForm();
    }

    await loadData();
    setSelectedItemIds(new Set());

    if (deletedCount > 0) {
      showToast(
        failedCount > 0
          ? `${deletedCount} avis supprimee(s).`
          : `${deletedCount} avis supprimee(s) avec succes.`,
        'success'
      );
    }

    if (failedCount > 0) {
      showToast(lastErrorMessage || `${failedCount} avis non supprimee(s).`, 'error');
    }

    setBulkDeleting(false);
  };

  async function handleDelete(id) {
    if (bulkDeleting) return;
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      await deleteHomeTestimonial(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelectedItemIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      if (editingId === id) resetForm();
      showToast('Avis supprime.', 'success');
    } catch (err) {
      showToast('Erreur suppression avis', 'error');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.6rem' }}>Avis Clients</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem' }}>
        Gere la section <strong>Ce que disent nos clients</strong> affichee sur la page d'accueil.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier un avis' : 'Nouvel avis'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Nom / organisation
              <input
                type="text"
                placeholder="Nom / organisation"
                value={form.name}
                onChange={(e) => setField('name', e.target.value)}
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Fonction
              <input
                type="text"
                placeholder="Fonction"
                value={form.role}
                onChange={(e) => setField('role', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Entreprise (court)
              <input
                type="text"
                placeholder="Entreprise (court)"
                value={form.company}
                onChange={(e) => setField('company', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Note
              <input
                type="number"
                min={1}
                max={5}
                placeholder="Note"
                value={form.rating}
                onChange={(e) => setField('rating', e.target.value)}
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
          </div>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Temoignage
            <textarea
              rows={4}
              placeholder="Temoignage"
              value={form.text}
              onChange={(e) => setField('text', e.target.value)}
              required
            />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Avatar / logo
            <input
              type="file"
              accept="image/*"
              onChange={(e) => setField('avatar', e.target.files?.[0] || null)}
            />
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {form.existing_avatar ? (
              <img
                src={form.existing_avatar}
                alt="Avatar actuel"
                style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '999px', border: '1px solid #e5e7eb' }}
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
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Avis configures ({items.length})</h2>
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
        {loading ? <Loader /> : (
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
                    aria-label="Selectionner tous les avis"
                  />
                </th>
                <th>ID</th>
                <th>Avatar</th>
                <th>Nom</th>
                <th>Role</th>
                <th>Entreprise</th>
                <th>Note</th>
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
                        aria-label={`Selectionner l'avis ${item?.name || id}`}
                      />
                    </td>
                    <td>{item.id}</td>
                  <td>
                    {avatarSrc(item) ? (
                      <img
                        src={avatarSrc(item)}
                        alt={item.name}
                        style={{ width: '52px', height: '52px', objectFit: 'cover', borderRadius: '999px', border: '1px solid #e5e7eb' }}
                      />
                    ) : '—'}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.role || '—'}</td>
                  <td>{item.company || '—'}</td>
                  <td>{item.rating || 0}/5</td>
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
                      aria-label={`Editer l'avis ${item?.name || item.id}`}
                      onClick={() => startEdit(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(item); }}
                      style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                    >
                      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                    </svg>
                    <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer l'avis ${item?.name || item.id}`} />
                  </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <AdminToast toast={toast} />
    </div>
  );
}
