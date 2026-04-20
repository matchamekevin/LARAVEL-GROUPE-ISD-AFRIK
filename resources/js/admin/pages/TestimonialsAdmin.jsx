import React, { useEffect, useState } from 'react';
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

  async function handleDelete(id) {
    if (!confirm('Supprimer cet avis ?')) return;
    try {
      await deleteHomeTestimonial(id);
      setItems((prev) => prev.filter((x) => x.id !== id));
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
              <button className="btn-secondary" type="button" onClick={resetForm}>
                Annuler
              </button>
            ) : null}
          </div>
        </form>
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Avis configures ({items.length})</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr>
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
              {items.map((item) => (
                <tr key={item.id}>
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
                    <button className="btn-secondary" onClick={() => startEdit(item)}>Editer</button>
                    <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer l'avis ${item?.name || item.id}`} />
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
