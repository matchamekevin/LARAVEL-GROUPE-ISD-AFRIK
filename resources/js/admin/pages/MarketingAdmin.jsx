import React, { useEffect, useMemo, useState } from 'react';
import {
  getHomeMarketingCardsAdmin,
  createHomeMarketingCard,
  updateHomeMarketingCard,
  deleteHomeMarketingCard,
} from '../api';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import DeleteIconButton from '../components/DeleteIconButton';
import '../styles/admin-shared.css';
import '../styles/marketing.css';

const INITIAL_FORM = {
  section: 'offer',
  title: '',
  description: '',
  badge_text: '',
  meta_text: '',
  cta_label: '',
  target_url: '',
  sort_order: 0,
  is_active: true,
  image: null,
  existing_image: '',
};

export default function MarketingAdmin() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const { toast, showToast } = useAdminToast();

  function cardImageSrc(card) {
    if (card?.image_url) return card.image_url;
    if (/^https?:\/\//i.test(card?.image_path || '') || String(card?.image_path || '').startsWith('/')) {
      return card.image_path;
    }

    return '';
  }

  async function loadData() {
    setLoading(true);
    try {
      const res = await getHomeMarketingCardsAdmin();
      setCards(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCards([]);
      showToast('Impossible de charger les cartes marketing', 'error');
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

  function startEdit(card) {
    setEditingId(card.id);
    setForm({
      section: card.section || 'offer',
      title: card.title || '',
      description: card.description || '',
      badge_text: card.badge_text || '',
      meta_text: card.meta_text || '',
      cta_label: card.cta_label || '',
      target_url: card.target_url || '',
      sort_order: card.sort_order || 0,
      is_active: Boolean(card.is_active),
      image: null,
      existing_image: cardImageSrc(card),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.title?.trim()) {
      showToast('Le titre est obligatoire', 'error');
      return;
    }
    if (!editingId && !form.image) {
      showToast('Veuillez ajouter une image', 'error');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        section: form.section,
        title: form.title,
        description: form.description,
        badge_text: form.badge_text,
        meta_text: form.meta_text,
        cta_label: form.cta_label,
        target_url: form.target_url,
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };
      if (form.image) payload.image = form.image;

      if (editingId) {
        await updateHomeMarketingCard(editingId, payload);
      } else {
        await createHomeMarketingCard(payload);
      }
      resetForm();
      await loadData();
      showToast(editing ? 'Carte marketing mise a jour.' : 'Carte marketing creee.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur enregistrement carte', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette carte ?')) return;
    try {
      await deleteHomeMarketingCard(id);
      setCards((prev) => prev.filter((x) => x.id !== id));
      if (editingId === id) resetForm();
      showToast('Carte marketing supprimee.', 'success');
    } catch (err) {
      showToast('Erreur suppression carte', 'error');
    }
  }

  const grouped = useMemo(() => {
    return {
      offer: cards.filter((x) => x.section === 'offer'),
      featured_product: cards.filter((x) => x.section === 'featured_product'),
    };
  }, [cards]);

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.6rem' }}>Marketing Accueil</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem' }}>
        Gérez les cartes de <strong>Nos Offres</strong> et <strong>Produits phares</strong> affichées sur la page d'accueil.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier une carte' : 'Nouvelle carte'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.8rem' }}>
          <div style={{ display: 'grid', gap: '0.8rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Section
              <select value={form.section} onChange={(e) => setField('section', e.target.value)}>
                <option value="offer">Section: Nos Offres</option>
                <option value="featured_product">Section: Produits phares</option>
              </select>
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Titre
              <input
                type="text"
                placeholder="Titre"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                required
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Prix / meta
              <input
                type="text"
                placeholder={form.section === 'offer' ? 'Inscription ouverte / Prix' : 'Sur mesure / Prix'}
                value={form.meta_text}
                onChange={(e) => setField('meta_text', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Badge
              <input
                type="text"
                placeholder={form.section === 'featured_product' ? 'Badge (Logiciels, Drone...)' : 'Badge optionnel'}
                value={form.badge_text}
                onChange={(e) => setField('badge_text', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Texte bouton
              <input
                type="text"
                placeholder="Texte bouton (ex: Je profite, En savoir plus)"
                value={form.cta_label}
                onChange={(e) => setField('cta_label', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              URL de redirection
              <input
                type="text"
                placeholder="URL de redirection (ex: /formations ou https://...)"
                value={form.target_url}
                onChange={(e) => setField('target_url', e.target.value)}
              />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Ordre d'affichage
              <input
                type="number"
                min={0}
                placeholder="Ordre d'affichage"
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
              Active
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Description
            <textarea
              rows={3}
              placeholder="Description"
              value={form.description}
              onChange={(e) => setField('description', e.target.value)}
            />
          </label>

          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Image
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setField('image', e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {form.existing_image ? (
              <img
                src={form.existing_image}
                alt="Image actuelle"
                style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              />
            ) : null}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer')}
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
        <h2 style={{ marginBottom: '0.75rem' }}>Cartes configurées</h2>
        {loading ? <Loader /> : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div>
              <h3 style={{ marginBottom: '0.45rem', color: '#172243' }}>Nos Offres ({grouped.offer.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Meta</th>
                    <th>Ordre</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.offer.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {cardImageSrc(item) ? (
                          <img
                            src={cardImageSrc(item)}
                            alt={item.title}
                            style={{ width: '64px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                          />
                        ) : '—'}
                      </td>
                      <td>{item.title}</td>
                      <td>{item.meta_text || '—'}</td>
                      <td>{item.sort_order ?? 0}</td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => startEdit(item)}>Editer</button>
                        <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer la carte ${item?.title || item.id}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div>
              <h3 style={{ marginBottom: '0.45rem', color: '#172243' }}>Produits phares ({grouped.featured_product.length})</h3>
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Titre</th>
                    <th>Badge</th>
                    <th>Prix/Meta</th>
                    <th>Ordre</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {grouped.featured_product.map((item) => (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>
                        {cardImageSrc(item) ? (
                          <img
                            src={cardImageSrc(item)}
                            alt={item.title}
                            style={{ width: '64px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }}
                          />
                        ) : '—'}
                      </td>
                      <td>{item.title}</td>
                      <td>{item.badge_text || '—'}</td>
                      <td>{item.meta_text || '—'}</td>
                      <td>{item.sort_order ?? 0}</td>
                      <td>{item.is_active ? 'Active' : 'Inactive'}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => startEdit(item)}>Editer</button>
                        <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer la carte ${item?.title || item.id}`} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <AdminToast toast={toast} />
    </div>
  );
}
