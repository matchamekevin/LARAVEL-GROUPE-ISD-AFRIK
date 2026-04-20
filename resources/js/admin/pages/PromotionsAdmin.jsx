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
import { HOME_MARKETING_SECTIONS, normalizeMarketingTarget } from '../../utils/homeMarketingCards';
import '../styles/admin-shared.css';
import '../styles/promotions.css';

const SECTION_OPTIONS = [
  {
    value: HOME_MARKETING_SECTIONS.HOME_PROMOTION,
    label: "Accueil",
    description: "Les 3 premieres promotions actives s'affichent dans le bloc Promotions de l'accueil.",
  },
  {
    value: HOME_MARKETING_SECTIONS.PROMOTION_PAGE,
    label: 'Page promotions',
    description: "Toutes les promotions actives s'affichent sur la page /promotions.",
  },
];

const INITIAL_FORM = {
  section: HOME_MARKETING_SECTIONS.HOME_PROMOTION,
  title: '',
  target_url: '',
  sort_order: 0,
  is_active: true,
  image: null,
  existing_image: '',
};

function getPreviewHref(targetUrl) {
  return normalizeMarketingTarget(targetUrl, '#');
}

export default function PromotionsAdmin() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);
  const { toast, showToast } = useAdminToast();

  function getCardImageSrc(card) {
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
      const list = Array.isArray(res.data) ? res.data : [];
      setCards(
        list.filter((item) => (
          item.section === HOME_MARKETING_SECTIONS.HOME_PROMOTION ||
          item.section === HOME_MARKETING_SECTIONS.PROMOTION_PAGE
        )),
      );
    } catch (err) {
      console.error(err);
      setCards([]);
      showToast('Impossible de charger les promotions', 'error');
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
    setForm(INITIAL_FORM);
  }

  function startEdit(card) {
    setEditingId(card.id);
    setForm({
      section: card.section || HOME_MARKETING_SECTIONS.HOME_PROMOTION,
      title: card.title || '',
      target_url: card.target_url || '',
      sort_order: card.sort_order ?? 0,
      is_active: Boolean(card.is_active),
      image: null,
      existing_image: getCardImageSrc(card),
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const editing = Boolean(editingId);

    if (!form.title.trim()) {
      showToast('Le nom interne de la promotion est obligatoire', 'error');
      return;
    }

    if (!form.target_url.trim()) {
      showToast("L'URL de redirection est obligatoire", 'error');
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
        title: form.title.trim(),
        target_url: form.target_url.trim(),
        sort_order: Number(form.sort_order || 0),
        is_active: form.is_active ? 1 : 0,
      };

      if (form.image) {
        payload.image = form.image;
      }

      if (editingId) {
        await updateHomeMarketingCard(editingId, payload);
      } else {
        await createHomeMarketingCard(payload);
      }

      resetForm();
      await loadData();
      showToast(editing ? 'Promotion mise a jour.' : 'Promotion creee.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur enregistrement promotion', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette promotion ?')) return;

    try {
      await deleteHomeMarketingCard(id);
      setCards((prev) => prev.filter((item) => item.id !== id));
      if (editingId === id) {
        resetForm();
      }
      showToast('Promotion supprimee.', 'success');
    } catch (err) {
      console.error(err);
      showToast('Erreur suppression promotion', 'error');
    }
  }

  const grouped = useMemo(() => ({
    [HOME_MARKETING_SECTIONS.HOME_PROMOTION]: cards.filter((item) => item.section === HOME_MARKETING_SECTIONS.HOME_PROMOTION),
    [HOME_MARKETING_SECTIONS.PROMOTION_PAGE]: cards.filter((item) => item.section === HOME_MARKETING_SECTIONS.PROMOTION_PAGE),
  }), [cards]);

  const selectedSection = SECTION_OPTIONS.find((item) => item.value === form.section) || SECTION_OPTIONS[0];

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '0.5rem' }}>Promotions</h1>
      <p style={{ color: '#4b5563', marginTop: 0, marginBottom: '1.4rem', maxWidth: '900px' }}>
        Cette page pilote les promotions de la plateforme depuis la base de donnees:
        les images affichees, leur ordre, leur activation, et la page ou l'endroit precis
        vers lequel chaque visuel doit rediriger.
      </p>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>{editingId ? 'Modifier une promotion' : 'Nouvelle promotion'}</h2>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: '0.9rem' }}>
          <div style={{ display: 'grid', gap: '0.9rem', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Emplacement
              <select value={form.section} onChange={(e) => setField('section', e.target.value)}>
                {SECTION_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Nom interne / titre
              <input
                type="text"
                placeholder="Nom interne / titre de la promotion"
                value={form.title}
                onChange={(e) => setField('title', e.target.value)}
                required
              />
            </label>

            <label style={{ display: 'grid', gap: '0.35rem' }}>
              URL de redirection
              <input
                type="text"
                placeholder="URL de redirection (ex: /solutions ou /produits?categories=...)"
                value={form.target_url}
                onChange={(e) => setField('target_url', e.target.value)}
                required
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

          <div style={{
            padding: '0.9rem 1rem',
            borderRadius: '0.75rem',
            background: '#f8fafc',
            color: '#334155',
            border: '1px solid #e2e8f0',
          }}>
            <strong style={{ color: '#172243' }}>{selectedSection.label}</strong>
            <p style={{ margin: '0.45rem 0 0' }}>{selectedSection.description}</p>
            <p style={{ margin: '0.45rem 0 0', fontSize: '0.92rem' }}>
              La redirection accepte par exemple <code>/promotions</code>, <code>/solutions#offres</code>,
              <code> /produits?categories=drone-formation</code> ou une URL externe complete.
            </p>
          </div>

          <div style={{ display: 'grid', gap: '0.45rem' }}>
            <label style={{ display: 'grid', gap: '0.35rem' }}>
              Image promotion
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setField('image', e.target.files?.[0] || null)}
              />
            </label>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {editingId && form.existing_image ? (
              <img
                src={form.existing_image}
                alt="Image actuelle de la promotion"
                style={{
                  width: '120px',
                  height: '75px',
                  objectFit: 'cover',
                  borderRadius: '0.5rem',
                  border: '1px solid #cbd5e1',
                  background: '#e2e8f0',
                }}
              />
            ) : null}
            <span style={{ color: '#64748b', fontSize: '0.92rem' }}>
              {editingId ? "L'image actuelle est conservee si vous n'en choisissez pas une nouvelle." : "Image obligatoire a la creation."}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
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
        <h2 style={{ marginBottom: '0.75rem' }}>Promotions configurees</h2>
        {loading ? <Loader /> : (
          <div style={{ display: 'grid', gap: '1.5rem' }}>
            {SECTION_OPTIONS.map((section) => {
              const items = grouped[section.value] || [];

              return (
                <div key={section.value}>
                  <h3 style={{ marginBottom: '0.35rem', color: '#172243' }}>
                    {section.label} ({items.length})
                  </h3>
                  <p style={{ marginTop: 0, marginBottom: '0.9rem', color: '#64748b' }}>{section.description}</p>

                  {items.length === 0 ? (
                    <div style={{
                      padding: '1rem',
                      borderRadius: '0.75rem',
                      background: '#f8fafc',
                      border: '1px dashed #cbd5e1',
                      color: '#64748b',
                    }}>
                      Aucune promotion configuree pour cette section.
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))' }}>
                      {items.map((item) => (
                        <article
                          key={item.id}
                          style={{
                            border: '1px solid #e5e7eb',
                            borderRadius: '1rem',
                            overflow: 'hidden',
                            background: '#fff',
                            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.05)',
                          }}
                        >
                          <div style={{ height: '220px', background: '#e2e8f0' }}>
                            {item.image_url ? (
                              <img
                                src={item.image_url}
                                alt={item.title}
                                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                              />
                            ) : null}
                          </div>

                          <div style={{ padding: '1rem', display: 'grid', gap: '0.65rem' }}>
                            <div>
                              <strong style={{ color: '#172243', display: 'block', marginBottom: '0.2rem' }}>{item.title}</strong>
                              <span style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                fontSize: '0.84rem',
                                color: item.is_active ? '#166534' : '#991b1b',
                                background: item.is_active ? '#dcfce7' : '#fee2e2',
                                borderRadius: '999px',
                                padding: '0.28rem 0.65rem',
                              }}>
                                {item.is_active ? 'Active' : 'Inactive'}
                              </span>
                            </div>

                            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
                              <strong>Redirection:</strong> {item.target_url || '—'}
                            </div>
                            <div style={{ color: '#475569', fontSize: '0.95rem' }}>
                              <strong>Ordre:</strong> {item.sort_order ?? 0}
                            </div>

                            <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                              <button className="btn-secondary" type="button" onClick={() => startEdit(item)}>
                                Editer
                              </button>
                              <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer la promotion ${item?.title || item.id}`} />
                              {item.target_url ? (
                                <a
                                  className="btn-secondary"
                                  href={getPreviewHref(item.target_url)}
                                  target="_blank"
                                  rel="noreferrer"
                                  style={{ textDecoration: 'none' }}
                                >
                                  Tester le lien
                                </a>
                              ) : null}
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdminToast toast={toast} />
    </div>
  );
}
