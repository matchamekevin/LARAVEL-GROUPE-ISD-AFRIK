import React, { useEffect, useState } from 'react';
import {
  getHomeCollaboratorsAdmin,
  createHomeCollaborator,
  updateHomeCollaborator,
  deleteHomeCollaborator,
} from '../api';
import Loader from '../components/Loader';
import { pickDisplayMediaUrl } from '../../utils/mediaUrl';
import '../styles/admin-shared.css';
import './collaborators.css';

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
      alert('Impossible de charger les collaborateurs');
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
      object_position: item.object_position || '',
      sort_order: item.sort_order || 0,
      is_active: Boolean(item.is_active),
      image: null,
      existing_image: imageSrc(item),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.name?.trim()) {
      alert('Le nom est obligatoire');
      return;
    }

    if (!editingId && !form.image) {
      alert('Veuillez ajouter une image');
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
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur enregistrement collaborateur');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer ce collaborateur ?')) return;
    try {
      await deleteHomeCollaborator(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
    } catch (err) {
      alert('Erreur suppression collaborateur');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.6rem' }}>Collaborateurs</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem' }}>
        Gere la section <strong>Nos collaborateurs prestigieux</strong> affichee sur la page d'accueil.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier un collaborateur' : 'Nouveau collaborateur'}</h2>
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
          </div>

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
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Collaborateurs configures ({items.length})</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr>
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
              {items.map((item) => (
                <tr key={item.id}>
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
                    <button className="btn-secondary" onClick={() => startEdit(item)}>Editer</button>
                    <button className="btn-secondary" onClick={() => handleDelete(item.id)}>Supprimer</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
