import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getHomeTestimonialsAdmin,
  createHomeTestimonial,
  updateHomeTestimonial,
  deleteHomeTestimonial,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import Modal from '../components/Modal';
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
  const [showModal, setShowModal] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const itemSelectionRef = useRef(null);
  const itemHeaderSelectionRef = useRef(null);


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
      toastError('Impossible de charger les avis clients');
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
    setShowModal(true);
  }

  function closeModal() {
    resetForm();
    setShowModal(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.name?.trim()) {
      toastError('Le nom du client est obligatoire');
      return;
    }

    if (!form.text?.trim()) {
      toastError('Le temoignage est obligatoire');
      return;
    }

    if (!editingId && !form.avatar) {
      toastError('Veuillez ajouter un avatar/logo');
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

      closeModal();
      await loadData();
      toastSuccess(editing ? 'Avis mis a jour.' : 'Avis cree.');
      notifyMutation();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Erreur enregistrement avis');
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
      toastSuccess(
        failedCount > 0
          ? `${deletedCount} avis supprimee(s).`
          : `${deletedCount} avis supprimee(s) avec succes.`
      );
      notifyMutation();
    }

    if (failedCount > 0) {
      toastError(lastErrorMessage || `${failedCount} avis non supprimee(s).`);
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
      toastSuccess('Avis supprime.');
      notifyMutation();
    } catch (err) {
      toastError('Erreur suppression avis');
    }
  }

  return (
    <div className="admin-testimonials-page">
      <div className="admin-testimonials-header">
        <div>
          <h1>Avis Clients</h1>
          <p>
            Gere la section <strong>Ce que disent nos clients</strong> affichee sur la page d'accueil.
          </p>
        </div>
        <button className="admin-open-modal-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <span className="material-symbols-outlined">add</span>
          Nouvel avis
        </button>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Modifier un avis' : 'Nouvel avis'} size="lg">
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Nom / organisation
              <input type="text" placeholder="Nom / organisation" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Fonction
              <input type="text" placeholder="Fonction" value={form.role} onChange={(e) => setField('role', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Entreprise (court)
              <input type="text" placeholder="Entreprise (court)" value={form.company} onChange={(e) => setField('company', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Note
              <input type="number" min={1} max={5} placeholder="Note" value={form.rating} onChange={(e) => setField('rating', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Ordre
              <input type="number" min={0} placeholder="Ordre" value={form.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'end' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
              Actif
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Temoignage
            <textarea rows={4} placeholder="Temoignage" value={form.text} onChange={(e) => setField('text', e.target.value)} required />
          </label>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Avatar / logo
            <input type="file" accept="image/*" onChange={(e) => setField('avatar', e.target.files?.[0] || null)} />
          </label>

          <div className="admin-modal-actions">
            {form.existing_avatar ? (
              <img src={form.existing_avatar} alt="Avatar actuel" style={{ width: '64px', height: '64px', objectFit: 'cover', borderRadius: '999px', border: '1px solid #e5e7eb' }} />
            ) : null}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
            </button>
            <button className="btn-secondary" type="button" onClick={closeModal} disabled={saving}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <div className="admin-testimonials-card">
        <h2 className="admin-testimonials-card-title">Avis configures ({items.length})</h2>
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
            <button type="button" className="admin-bulk-icon-btn" onClick={clearItemSelection} disabled={selectedItemCount === 0 || bulkDeleting} aria-label="Effacer la selection"><span className="material-symbols-outlined">close</span></button>
            <button type="button" className="admin-bulk-icon-btn admin-bulk-icon-btn--danger" onClick={handleBulkDeleteItems} disabled={isBulkActionDisabled} aria-label="Supprimer la selection"><span className="material-symbols-outlined">delete</span></button>
          </div>
        </div>
        {(
          <div className="admin-testimonials-table-wrap">
            <table className="admin-testimonials-table">
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
                      <td>{String(item.id).substring(0, 8)}…</td>
                      <td>
                        {avatarSrc(item) ? (
                          <img
                            src={avatarSrc(item)}
                            alt={item.name}
                            className="admin-testimonials-avatar"
                          />
                        ) : <span className="admin-testimonials-no-avatar">—</span>}
                      </td>
                      <td>{item.name}</td>
                      <td>{item.role || '—'}</td>
                      <td>{item.company || '—'}</td>
                      <td><span className="admin-testimonials-rating">{item.rating || 0}/5</span></td>
                      <td>{item.sort_order ?? 0}</td>
                      <td>
                        <span className={`admin-testimonials-status ${item.is_active ? 'is-active' : 'is-inactive'}`}>
                          {item.is_active ? 'Actif' : 'Inactif'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-testimonials-actions">
                          <button
                            type="button"
                            className="admin-bulk-icon-btn"
                            onClick={() => startEdit(item)}
                            aria-label={`Editer l'avis ${item?.name || item.id}`}
                          >
                            <span className="material-symbols-outlined">edit</span>
                          </button>
                          <DeleteIconButton
                            onClick={() => handleDelete(item.id)}
                            className="admin-bulk-icon-btn admin-bulk-icon-btn--danger"
                            style={{ width: 32, height: 32 }}
                            title="Supprimer"
                            ariaLabel={`Supprimer l'avis ${item?.name || item.id}`}
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
      </div>


    </div>
  );
}
