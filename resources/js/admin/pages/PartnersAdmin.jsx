import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  getHomePartnersAdmin,
  createHomePartner,
  updateHomePartner,
  deleteHomePartner,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import Modal from '../components/Modal';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import '../styles/partners.css';

const INITIAL_FORM = {
  name: '',
  sort_order: 0,
  is_active: true,
  image: null,
  existing_image: '',
};

export default function PartnersAdmin() {
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


  function imageSrc(item) {
    return pickDisplayMediaUrl([item?.image_url, item?.image_path], '');
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await getHomePartnersAdmin();
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setItems([]);
      toastError('Impossible de charger les partenaires');
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
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active),
      image: null,
      existing_image: imageSrc(item),
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
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };

      if (form.image) payload.image = form.image;

      if (editingId) {
        await updateHomePartner(editingId, payload);
      } else {
        await createHomePartner(payload);
      }

      closeModal();
      await loadData();
      toastSuccess(editing ? 'Partenaire mis a jour.' : 'Partenaire cree.');
      notifyMutation();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Erreur enregistrement partenaire');
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
      ? `${selectedVisibleItemIds.length} partenaires`
      : '1 partenaire';

    if (!confirm(`Supprimer ${baseLabel} selectionnee(s) ?`)) return;

    setBulkDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const id of selectedVisibleItemIds) {
      try {
        await deleteHomePartner(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression partenaire';
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
          ? `${deletedCount} partenaire(s) supprimee(s).`
          : `${deletedCount} partenaire(s) supprimee(s) avec succes.`
      );
      notifyMutation();
    }

    if (failedCount > 0) {
      toastError(lastErrorMessage || `${failedCount} partenaire(s) non supprimee(s).`);
    }

    setBulkDeleting(false);
  };

  async function handleDelete(id) {
    if (bulkDeleting) return;
    if (!confirm('Supprimer ce partenaire ?')) return;
    try {
      await deleteHomePartner(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      setSelectedItemIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      if (editingId === id) resetForm();
      toastSuccess('Partenaire supprime.');
      notifyMutation();
    } catch (err) {
      toastError('Erreur suppression partenaire');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.4rem', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '2rem', color: '#172243', margin: 0 }}>Partenaires technologiques</h1>
          <p style={{ color: '#4b5563', margin: '0.3rem 0 0' }}>
            Gere la section <strong>Nos partenaires technologiques</strong> affichee sur la page d'accueil.
          </p>
        </div>
        <button className="admin-open-modal-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Ajouter un partenaire
        </button>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Modifier partenaire' : 'Ajouter un partenaire'}>
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Nom
              <input type="text" placeholder="Nom" value={form.name} onChange={(e) => setField('name', e.target.value)} required />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Ordre
              <input type="number" min={0} placeholder="Ordre" value={form.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'end' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
              Actif
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Logo partenaire
              <input type="file" accept="image/*" onChange={(e) => setField('image', e.target.files?.[0] || null)} />
            </label>

            <div className="admin-modal-actions">
              {form.existing_image ? (
                <img src={form.existing_image} alt="Image actuelle" style={{ width: '90px', height: '58px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' }} />
              ) : null}
              <button className="btn-primary" type="submit" disabled={saving}>
                {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
              </button>
              <button className="btn-secondary" type="button" onClick={closeModal} disabled={saving}>
                Annuler
              </button>
            </div>
          </div>
        </form>
      </Modal>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Partenaires configures ({items.length})</h2>
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
          <div className="admin-bulk-table-wrap">
          <table className="admin-bulk-table">
            <thead>
              <tr>
                <th className="col-cb">
                  <input
                    type="checkbox"
                    ref={itemHeaderSelectionRef}
                    checked={allItemsSelected}
                    onChange={toggleAllItemSelection}
                    disabled={visibleItemIds.length === 0 || bulkDeleting}
                    aria-label="Selectionner tous les partenaires"
                  />
                </th>
                <th className="col-id">ID</th>
                <th className="col-img">Logo</th>
                <th className="col-title">Nom</th>
                <th className="col-order">Ordre</th>
                <th className="col-status">Statut</th>
                <th className="col-actions">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const id = Number(item.id);
                const isChecked = selectedItemIds.has(id);
                return (
                  <tr key={item.id}>
                    <td className="col-cb">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleItemSelection(id)}
                        disabled={bulkDeleting}
                        aria-label={`Selectionner le partenaire ${item?.name || id}`}
                      />
                    </td>
                    <td className="col-id">{item.id}</td>
                  <td className="col-img">
                    {imageSrc(item) ? (
                      <img
                        src={imageSrc(item)}
                        alt={item.name}
                        className="admin-table-thumb"
                        style={{ objectFit: 'contain', background: '#fff', padding: '4px' }}
                      />
                    ) : '—'}
                  </td>
                  <td className="col-title"><div className="admin-table-cell-title">{item.name}</div></td>
                  <td className="col-order">{item.sort_order ?? 0}</td>
                  <td className="col-status"><span className={`admin-badge ${item.is_active ? 'admin-badge-success' : 'admin-badge-gray'}`}>{item.is_active ? 'Actif' : 'Inactif'}</span></td>
                  <td className="col-actions">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#274483"
                      role="button"
                      tabIndex={0}
                      aria-label={`Editer le partenaire ${item?.name || item.id}`}
                      onClick={() => startEdit(item)}
                      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(item); }}
                      className="admin-table-btn-edit"
                    >
                      <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                    </svg>
                    <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer le partenaire ${item?.name || item.id}`} />
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
