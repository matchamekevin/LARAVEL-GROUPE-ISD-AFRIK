import React, { useEffect, useMemo, useRef, useState } from 'react';
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
import '../styles/catalogue-admin.css';
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

const STATUS_FILTER_OPTIONS = [
  { value: 'all', label: 'Tous les statuts' },
  { value: 'active', label: 'Actives' },
  { value: 'inactive', label: 'Inactives' },
];

const SORT_FILTER_OPTIONS = [
  { value: 'order_asc', label: 'Ordre croissant' },
  { value: 'order_desc', label: 'Ordre decroissant' },
  { value: 'title_asc', label: 'Titre A-Z' },
  { value: 'title_desc', label: 'Titre Z-A' },
];

function getPreviewHref(targetUrl) {
  return normalizeMarketingTarget(targetUrl, '#');
}

export default function PromotionsAdmin() {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(INITIAL_FORM);

  const [activeSection, setActiveSection] = useState(HOME_MARKETING_SECTIONS.HOME_PROMOTION);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortFilter, setSortFilter] = useState('order_asc');

   const [uploadPreview, setUploadPreview] = useState('');
   const [selectedCardIds, setSelectedCardIds] = useState(new Set());
   const [bulkDeleting, setBulkDeleting] = useState(false);
   const cardSelectionRef = useRef(null);

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

   useEffect(() => {
     if (!form.image) {
       setUploadPreview('');
       return;
     }

     const url = URL.createObjectURL(form.image);
     setUploadPreview(url);

     return () => URL.revokeObjectURL(url);
   }, [form.image]);

   const visibleCardIds = useMemo(
     () => filteredCards.map((item) => Number(item.id)).filter(Boolean),
     [filteredCards]
   );
   const selectedVisibleCardIds = useMemo(
     () => visibleCardIds.filter((id) => selectedCardIds.has(id)),
     [visibleCardIds, selectedCardIds]
   );
   const selectedCardCount = selectedVisibleCardIds.length;
   const allCardsSelected = visibleCardIds.length > 0 && selectedCardCount === visibleCardIds.length;
   const isBulkCardActionDisabled = bulkDeleting || selectedCardCount === 0;

   useEffect(() => {
     const isIndeterminate = selectedCardCount > 0 && !allCardsSelected;
     if (cardSelectionRef.current) {
       cardSelectionRef.current.indeterminate = isIndeterminate;
     }
   }, [selectedCardCount, allCardsSelected]);

  function setField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setEditingId(null);
    setForm({ ...INITIAL_FORM, section: activeSection });
  }

  function openCreateModal() {
    setEditingId(null);
    setForm({ ...INITIAL_FORM, section: activeSection });
    setModalOpen(true);
  }

  function startEdit(card) {
    setActiveSection(card.section || HOME_MARKETING_SECTIONS.HOME_PROMOTION);
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
    setModalOpen(true);
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

      if (form.image) payload.image = form.image;

      if (editingId) {
        await updateHomeMarketingCard(editingId, payload);
      } else {
        await createHomeMarketingCard(payload);
      }

      closeModal();
      await loadData();
      showToast(editing ? 'Promotion mise a jour.' : 'Promotion creee.', 'success');
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur enregistrement promotion', 'error');
    } finally {
      setSaving(false);
    }
  }

  const toggleCardSelection = (id) => {
    setSelectedCardIds((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllCardSelection = () => {
    setSelectedCardIds((previous) => {
      const next = new Set(previous);
      if (visibleCardIds.length === 0) {
        return next;
      }

      const allSelected = visibleCardIds.every((id) => next.has(id));
      if (allSelected) {
        visibleCardIds.forEach((id) => next.delete(id));
      } else {
        visibleCardIds.forEach((id) => next.add(id));
      }

      return next;
    });
  };

  const clearCardSelection = () => {
    setSelectedCardIds(new Set());
  };

  const handleBulkDeleteCards = async () => {
    if (bulkDeleting || selectedVisibleCardIds.length === 0) return;

    const baseLabel = selectedVisibleCardIds.length > 1
      ? `${selectedVisibleCardIds.length} promotions`
      : '1 promotion';

    if (!confirm(`Supprimer ${baseLabel} selectionnee(s) ?`)) return;

    setBulkDeleting(true);

    let deletedCount = 0;
    let failedCount = 0;
    let lastErrorMessage = '';

    for (const id of selectedVisibleCardIds) {
      try {
        await deleteHomeMarketingCard(id);
        deletedCount += 1;
      } catch (err) {
        failedCount += 1;
        lastErrorMessage = err?.response?.data?.message || 'Erreur suppression promotion';
      }
    }

    if (editingId && selectedVisibleCardIds.includes(Number(editingId))) {
      closeModal();
    }

    await loadData();
    setSelectedCardIds(new Set());

    if (deletedCount > 0) {
      showToast(
        failedCount > 0
          ? `${deletedCount} promotion(s) supprimee(s).`
          : `${deletedCount} promotion(s) supprimee(s) avec succes.`,
        'success'
      );
    }

    if (failedCount > 0) {
      showToast(lastErrorMessage || `${failedCount} promotion(s) non supprimee(s).`, 'error');
    }

    setBulkDeleting(false);
  };

  async function handleDelete(id) {
    if (bulkDeleting) return;
    if (!confirm('Supprimer cette promotion ?')) return;

    try {
      await deleteHomeMarketingCard(id);
      setCards((prev) => prev.filter((item) => item.id !== id));
      setSelectedCardIds((previous) => {
        const next = new Set(previous);
        next.delete(Number(id));
        return next;
      });
      if (editingId === id) closeModal();
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

  const activeSectionMeta = SECTION_OPTIONS.find((item) => item.value === activeSection) || SECTION_OPTIONS[0];

  const filteredCards = useMemo(() => {
    const source = grouped[activeSection] || [];
    const query = searchTerm.trim().toLowerCase();

    const bySearch = source.filter((item) => {
      if (!query) return true;
      const title = String(item?.title || '').toLowerCase();
      const url = String(item?.target_url || '').toLowerCase();
      return title.includes(query) || url.includes(query);
    });

    const byStatus = bySearch.filter((item) => {
      if (statusFilter === 'active') return Boolean(item?.is_active);
      if (statusFilter === 'inactive') return !Boolean(item?.is_active);
      return true;
    });

    const sorted = [...byStatus].sort((a, b) => {
      if (sortFilter === 'order_desc') return Number(b?.sort_order || 0) - Number(a?.sort_order || 0);
      if (sortFilter === 'title_asc') return String(a?.title || '').localeCompare(String(b?.title || ''), 'fr');
      if (sortFilter === 'title_desc') return String(b?.title || '').localeCompare(String(a?.title || ''), 'fr');
      return Number(a?.sort_order || 0) - Number(b?.sort_order || 0);
    });

    return sorted;
  }, [grouped, activeSection, searchTerm, statusFilter, sortFilter]);

  const visibleCardIds = useMemo(
    () => filteredCards.map((item) => Number(item.id)).filter(Boolean),
    [filteredCards]
  );
  const selectedVisibleCardIds = useMemo(
    () => visibleCardIds.filter((id) => selectedCardIds.has(id)),
    [visibleCardIds, selectedCardIds]
  );
  const selectedCardCount = selectedVisibleCardIds.length;
  const allCardsSelected = visibleCardIds.length > 0 && selectedCardCount === visibleCardIds.length;
  const isBulkCardActionDisabled = bulkDeleting || selectedCardCount === 0;

  const totalCount = cards.length;
  const activeCount = cards.filter((item) => Boolean(item?.is_active)).length;
  const currentImagePreview = uploadPreview || form.existing_image || '';

  return (
    <div style={{ padding: '2rem' }}>
      <div className="admin-promotions-page">
        <header className="admin-catalogue-hero">
          <div>
            <h1>Promotions</h1>
          </div>
          <div className="admin-catalogue-hero-actions">
            <span className="admin-catalogue-count">{totalCount} promotions - {activeCount} actives</span>
            <button type="button" className="btn-primary admin-promotions-create-btn" onClick={openCreateModal}>
              Nouvelle promotion
            </button>
          </div>
        </header>

        <section className="admin-catalogue-tabs">
          {SECTION_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={activeSection === option.value ? 'is-active' : ''}
              onClick={() => setActiveSection(option.value)}
            >
              {option.label}
            </button>
          ))}
        </section>

        <section className="card admin-promotions-toolbar">
          <input
            type="text"
            placeholder="Rechercher une promotion (titre ou redirection)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            {STATUS_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select value={sortFilter} onChange={(e) => setSortFilter(e.target.value)}>
            {SORT_FILTER_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </section>

        <div className="admin-bulk-bar">
          <label className="admin-bulk-select">
            <input
              type="checkbox"
              ref={cardSelectionRef}
              checked={allCardsSelected}
              onChange={toggleAllCardSelection}
              disabled={visibleCardIds.length === 0 || bulkDeleting}
            />
            <span>{selectedCardCount} selectionnee(s)</span>
          </label>
          <div className="admin-bulk-actions">
            <button
              type="button"
              className="btn-secondary"
              onClick={clearCardSelection}
              disabled={selectedCardCount === 0 || bulkDeleting}
            >
              Effacer la selection
            </button>
            <button
              type="button"
              className="btn-secondary"
              onClick={handleBulkDeleteCards}
              disabled={isBulkCardActionDisabled}
            >
              Supprimer la selection
            </button>
          </div>
        </div>

        <section className="card admin-promotions-results-card">
          <div className="admin-promotions-results-head">
            <h2>{activeSectionMeta.label} ({filteredCards.length})</h2>
            <p>{activeSectionMeta.description}</p>
          </div>

          {loading ? <Loader /> : (
            filteredCards.length === 0 ? (
              <div className="admin-promotions-empty-box">Aucune promotion trouvee pour les filtres actuels.</div>
            ) : (
              <div className="admin-promotions-cards-grid">
                {filteredCards.map((item) => {
                  const imageSrc = getCardImageSrc(item);
                  const isChecked = selectedCardIds.has(Number(item.id));
                  return (
                    <article key={item.id} className="admin-promotions-item-card">
                      <div className="admin-promotions-item-media">
                        {imageSrc ? (
                          <img src={imageSrc} alt={item.title || 'Promotion'} />
                        ) : null}
                      </div>

                      <div className="admin-promotions-item-body">
                        <div className="admin-promotions-item-head">
                          <label className="admin-promotions-item-select">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleCardSelection(Number(item.id))}
                              disabled={bulkDeleting}
                              aria-label={`Selectionner la promotion ${item?.title || item.id}`}
                            />
                          </label>
                          <div>
                            <strong>{item.title || 'Sans titre'}</strong>
                            <span className={item.is_active ? 'admin-promotions-pill admin-promotions-pill--active' : 'admin-promotions-pill admin-promotions-pill--inactive'}>
                              {item.is_active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                        </div>

                        <div className="admin-promotions-item-meta"><strong>Redirection:</strong> {item.target_url || '--'}</div>
                        <div className="admin-promotions-item-meta"><strong>Ordre:</strong> {item.sort_order ?? 0}</div>

                        <div className="admin-promotions-item-actions">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            height="24px"
                            viewBox="0 -960 960 960"
                            width="24px"
                            fill="#274483"
                            role="button"
                            tabIndex={0}
                            aria-label={`Editer la promotion ${item?.title || item.id}`}
                            onClick={() => startEdit(item)}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') startEdit(item); }}
                            style={{ cursor: 'pointer', verticalAlign: 'middle' }}
                          >
                            <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                          </svg>
                          <DeleteIconButton onClick={() => handleDelete(item.id)} className="btn-secondary" title="Supprimer" ariaLabel={`Supprimer la promotion ${item?.title || item.id}`} />
                          {item.target_url ? (
                            <a className="btn-secondary" href={getPreviewHref(item.target_url)} target="_blank" rel="noreferrer">Tester le lien</a>
                          ) : null}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          )}
        </section>

        {modalOpen && (
          <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={closeModal}>
            <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
              <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--promotion" aria-label={editingId ? 'Edition promotion' : 'Creation promotion'}>
                <div className="admin-catalogue-card-head">
                  <h2>{editingId ? 'Modifier une promotion' : 'Nouvelle promotion'}</h2>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    height="24px"
                    viewBox="0 -960 960 960"
                    width="24px"
                    fill="#172243"
                    role="button"
                    tabIndex={0}
                    onMouseDown={(e) => e.preventDefault()}
                    aria-label="Fermer"
                    onClick={closeModal}
                    onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && !saving) closeModal(); }}
                    style={{ cursor: saving ? 'default' : 'pointer', verticalAlign: 'middle', border: 'none', background: 'transparent', padding: 0, outline: 'none' }}
                  >
                    <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
                  </svg>
                </div>

                <form onSubmit={handleSubmit} className="admin-catalogue-form admin-catalogue-grid-4 admin-promotions-modal-form">
                  <label>
                    Emplacement
                    <select value={form.section} onChange={(e) => setField('section', e.target.value)}>
                      {SECTION_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>

                  <label>
                    Nom interne / titre
                    <input
                      type="text"
                      placeholder="Nom interne / titre de la promotion"
                      value={form.title}
                      onChange={(e) => setField('title', e.target.value)}
                      required
                    />
                  </label>

                  <label className="admin-catalogue-grid-span-2">
                    URL de redirection
                    <input
                      type="text"
                      placeholder="URL de redirection (ex: /solutions ou /produits?categories=...)"
                      value={form.target_url}
                      onChange={(e) => setField('target_url', e.target.value)}
                      required
                    />
                  </label>

                  <label>
                    Ordre d'affichage
                    <input
                      type="number"
                      min={0}
                      placeholder="Ordre d'affichage"
                      value={form.sort_order}
                      onChange={(e) => setField('sort_order', e.target.value)}
                    />
                  </label>

                  <label className="admin-catalogue-checkbox">
                    <input
                      type="checkbox"
                      checked={form.is_active}
                      onChange={(e) => setField('is_active', e.target.checked)}
                    />
                    Active
                  </label>

                  <label className="admin-catalogue-grid-span-2">
                    Image promotion
                    <div className="admin-promotions-image-upload">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setField('image', e.target.files?.[0] || null)}
                      />
                      {currentImagePreview ? (
                        <img src={currentImagePreview} alt="Apercu de la promotion" className="admin-promotions-upload-preview" />
                      ) : null}
                    </div>
                  </label>

                  <div className="admin-catalogue-actions admin-catalogue-grid-span-2 admin-catalogue-actions--promotion">
                    <button type="button" className="btn-secondary" onClick={closeModal} disabled={saving}>
                      Annuler
                    </button>
                    <button type="submit" className="btn-primary" disabled={saving}>
                      {saving ? 'Enregistrement...' : (editingId ? 'Mettre a jour' : 'Creer')}
                    </button>
                  </div>
                </form>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
