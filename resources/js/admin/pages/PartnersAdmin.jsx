import React, { useEffect, useState } from 'react';
import {
  getHomePartnersAdmin,
  createHomePartner,
  updateHomePartner,
  deleteHomePartner,
} from '../api';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
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
  const { toast, showToast } = useAdminToast();

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
      showToast('Impossible de charger les partenaires', 'error');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

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
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.name?.trim()) {
      showToast('Le nom est obligatoire', 'error');
      return;
    }

    if (!editingId && !form.image) {
      showToast('Veuillez ajouter une image', 'error');
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

      resetForm();
      await loadData();
      showToast(editing ? 'Partenaire mis a jour.' : 'Partenaire cree.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur enregistrement partenaire', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce partenaire ?')) return;
    try {
      await deleteHomePartner(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
      showToast('Partenaire supprime.', 'success');
    } catch (err) {
      showToast('Erreur suppression partenaire', 'error');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.6rem' }}>Partenaires technologiques</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem' }}>
        Gere la section <strong>Nos partenaires technologiques</strong> affichee sur la page d'accueil.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier un partenaire' : 'Nouveau partenaire'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
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
            Logo partenaire
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
                style={{ width: '90px', height: '58px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff' }}
              />
            ) : null}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
            </button>
            {editingId ? (
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Partenaires configures ({items.length})</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Logo</th>
                <th>Nom</th>
                <th>Ordre</th>
                <th>Statut</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>
                  <td>
                    {imageSrc(item) ? (
                      <img
                        src={imageSrc(item)}
                        alt={item.name}
                        style={{ width: '100px', height: '48px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #e5e7eb', background: '#fff', padding: '4px' }}
                      />
                    ) : '—'}
                  </td>
                  <td>{item.name}</td>
                  <td>{item.sort_order ?? 0}</td>
                  <td>{item.is_active ? 'Actif' : 'Inactif'}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => startEdit(item)}>Editer</button>
                    <button className="btn-secondary" onClick={() => handleDelete(item.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <AdminToast toast={toast} />
    </div>
  );
}
