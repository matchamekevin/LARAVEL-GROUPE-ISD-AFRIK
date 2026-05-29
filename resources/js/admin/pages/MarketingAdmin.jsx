import React, { useEffect, useMemo, useState } from 'react';
import {
  getHomeMarketingCardsAdmin,
  createHomeMarketingCard,
  updateHomeMarketingCard,
  deleteHomeMarketingCard,
} from '../api';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import Modal from '../components/Modal';
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
  const [showModal, setShowModal] = useState(false);


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
      toastError('Impossible de charger les cartes marketing');
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
    setShowModal(true);
  }

  function closeModal() {
    resetForm();
    setShowModal(false);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.title?.trim()) {
      toastError('Le titre est obligatoire');
      return;
    }
    if (!editingId && !form.image) {
      toastError('Veuillez ajouter une image');
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
      closeModal();
      await loadData();
      toastSuccess(editing ? 'Carte marketing mise a jour.' : 'Carte marketing creee.');
      notifyMutation();
    } catch (err) {
      toastError(err?.response?.data?.message || 'Erreur enregistrement carte');
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
      toastSuccess('Carte marketing supprimee.');
      notifyMutation();
    } catch (err) {
      toastError('Erreur suppression carte');
    }
  }

  const grouped = useMemo(() => {
    return {
      offer: cards.filter((x) => x.section === 'offer'),
      featured_product: cards.filter((x) => x.section === 'featured_product'),
    };
  }, [cards]);

  function renderTable(items, columns) {
    if (items.length === 0) {
      return <div className="admin-marketing-empty" style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>Aucune carte dans cette section.</div>;
    }

    return (
      <div className="admin-marketing-table-wrap">
        <table className="admin-marketing-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th key={col.key}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                {columns.map((col) => (
                  <td key={col.key}>
                    {col.render ? col.render(item) : item[col.key] ?? '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  const offerColumns = [
    { key: 'id', label: 'ID', render: (item) => String(item.id).substring(0, 8) + '…' },
    {
      key: 'image', label: 'Image',
      render: (item) => {
        const src = cardImageSrc(item);
        return src ? <img src={src} alt={item.title} /> : <span className="admin-marketing-no-image">—</span>;
      },
    },
    { key: 'title', label: 'Titre' },
    { key: 'meta_text', label: 'Meta', render: (item) => item.meta_text || '—' },
    { key: 'sort_order', label: 'Ordre', render: (item) => item.sort_order ?? 0 },
    {
      key: 'statut', label: 'Statut',
      render: (item) => (
        <span className={`admin-marketing-status ${item.is_active ? 'is-active' : 'is-inactive'}`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (item) => (
        <div className="admin-marketing-actions">
          <button
            type="button"
            className="admin-bulk-icon-btn"
            onClick={() => startEdit(item)}
            aria-label={`Editer la carte ${item?.title || item.id}`}
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <DeleteIconButton
            onClick={() => handleDelete(item.id)}
            className="admin-bulk-icon-btn admin-bulk-icon-btn--danger"
            style={{ width: 32, height: 32 }}
            title="Supprimer"
            ariaLabel={`Supprimer la carte ${item?.title || item.id}`}
          />
        </div>
      ),
    },
  ];

  const featuredColumns = [
    { key: 'id', label: 'ID', render: (item) => String(item.id).substring(0, 8) + '…' },
    {
      key: 'image', label: 'Image',
      render: (item) => {
        const src = cardImageSrc(item);
        return src ? <img src={src} alt={item.title} /> : <span className="admin-marketing-no-image">—</span>;
      },
    },
    { key: 'title', label: 'Titre' },
    {
      key: 'badge', label: 'Badge',
      render: (item) => item.badge_text ? <span className="admin-marketing-badge">{item.badge_text}</span> : '—',
    },
    { key: 'meta_text', label: 'Prix/Meta', render: (item) => item.meta_text || '—' },
    { key: 'sort_order', label: 'Ordre', render: (item) => item.sort_order ?? 0 },
    {
      key: 'statut', label: 'Statut',
      render: (item) => (
        <span className={`admin-marketing-status ${item.is_active ? 'is-active' : 'is-inactive'}`}>
          {item.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (item) => (
        <div className="admin-marketing-actions">
          <button
            type="button"
            className="admin-bulk-icon-btn"
            onClick={() => startEdit(item)}
            aria-label={`Editer la carte ${item?.title || item.id}`}
          >
            <span className="material-symbols-outlined">edit</span>
          </button>
          <DeleteIconButton
            onClick={() => handleDelete(item.id)}
            className="admin-bulk-icon-btn admin-bulk-icon-btn--danger"
            style={{ width: 32, height: 32 }}
            title="Supprimer"
            ariaLabel={`Supprimer la carte ${item?.title || item.id}`}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="admin-marketing-page">
      <div className="admin-marketing-header">
        <div>
          <h1>Marketing Accueil</h1>
          <p>
            Gérez les cartes de <strong>Nos Offres</strong> et <strong>Produits phares</strong> affichées sur la page d'accueil.
          </p>
        </div>
        <button className="admin-open-modal-btn" onClick={() => { resetForm(); setShowModal(true); }}>
          <span className="material-symbols-outlined">add</span>
          Nouvelle carte
        </button>
      </div>

      <Modal isOpen={showModal} onClose={closeModal} title={editingId ? 'Modifier une carte' : 'Nouvelle carte'} size="lg">
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
              <input type="text" placeholder="Titre" value={form.title} onChange={(e) => setField('title', e.target.value)} required />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Prix / meta
              <input type="text" placeholder={form.section === 'offer' ? 'Inscription ouverte / Prix' : 'Sur mesure / Prix'} value={form.meta_text} onChange={(e) => setField('meta_text', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Badge
              <input type="text" placeholder={form.section === 'featured_product' ? 'Badge (Logiciels, Drone...)' : 'Badge optionnel'} value={form.badge_text} onChange={(e) => setField('badge_text', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Texte bouton
              <input type="text" placeholder="Texte bouton (ex: Je profite, En savoir plus)" value={form.cta_label} onChange={(e) => setField('cta_label', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              URL de redirection
              <input type="text" placeholder="URL de redirection (ex: /formations ou https://...)" value={form.target_url} onChange={(e) => setField('target_url', e.target.value)} />
            </label>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Ordre d'affichage
              <input type="number" min={0} placeholder="Ordre d'affichage" value={form.sort_order} onChange={(e) => setField('sort_order', e.target.value)} />
            </label>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', alignSelf: 'end' }}>
              <input type="checkbox" checked={form.is_active} onChange={(e) => setField('is_active', e.target.checked)} />
              Active
            </label>
          </div>

          <label style={{ display: 'grid', gap: '0.35rem' }}>
            Description
            <textarea rows={3} placeholder="Description" value={form.description} onChange={(e) => setField('description', e.target.value)} />
          </label>

          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Image
              <input type="file" accept="image/*" onChange={(e) => setField('image', e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="admin-modal-actions">
            {form.existing_image ? (
              <img src={form.existing_image} alt="Image actuelle" style={{ width: '72px', height: '52px', objectFit: 'cover', borderRadius: '6px', border: '1px solid #e5e7eb' }} />
            ) : null}
            <button className="btn-primary" type="submit" disabled={saving}>
              {saving ? 'Enregistrement...' : (editingId ? 'Mettre à jour' : 'Créer')}
            </button>
            <button className="btn-secondary" type="button" onClick={closeModal} disabled={saving}>
              Annuler
            </button>
          </div>
        </form>
      </Modal>

      <div className="admin-marketing-card">
        <h2 className="admin-marketing-card-title">Cartes configurées</h2>
        {(
          <div className="admin-marketing-sections">
            <div>
              <h3 className="admin-marketing-section-title">Nos Offres ({grouped.offer.length})</h3>
              {renderTable(grouped.offer, offerColumns)}
            </div>

            <div>
              <h3 className="admin-marketing-section-title">Produits phares ({grouped.featured_product.length})</h3>
              {renderTable(grouped.featured_product, featuredColumns)}
            </div>
          </div>
        )}
      </div>


    </div>
  );
}
