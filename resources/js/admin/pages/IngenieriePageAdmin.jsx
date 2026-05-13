import { submitContactMessage } from '../api';
import React, { useEffect, useMemo, useState } from 'react';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import { useLivePolling } from '../../hooks/useLivePolling';
import { createCategory, deleteCategory, getCategories, updateCategory } from '../api';
import { INGENIERIE_DEFAULT_DOMAINES } from '../../data/ingenierieDomains';
import '../styles/admin-shared.css';
import '../styles/catalogue-admin.css';
import '../styles/ingenierie-page-admin.css';

const INGENIERIE_SEGMENT = 'ingenierie-page';

const INITIAL_DOMAIN_FORM = {
  nom: '',
  slug: '',
  description: '',
  details: '',
  deliverables: '',
  technologies: '',
  image_url: '',
  image_file: null,
  existing_image: '',
  ordre: 10,
  actif: true,
};

const INITIAL_SERVICE_FORM = {
  parent_id: '',
  nom: '',
  slug: '',
  description: '',
  ordre: 10,
  actif: true,
};

const categoryId = (category) => Number(category?.id || category?.id_categorie || 0);
const parentId = (category) => Number(category?.parent_id || category?.parent?.id || category?.parent?.id_categorie || 0);

const normalizeText = (value) =>
  String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

const parseDomainMeta = (rawValue) => {
  if (!rawValue || typeof rawValue !== 'string') return {};
  try {
    const parsed = JSON.parse(rawValue);
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch (_error) {
    return {};
  }
};

const linesToList = (value) =>
  String(value || '')
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const listToLines = (value) => (Array.isArray(value) ? value.filter(Boolean).join('\n') : '');

const appendVersionToImage = (url, versionSeed) => {
  const source = String(url || '').trim();
  if (!source) return source;
  if (!versionSeed) return source;
  const separator = source.includes('?') ? '&' : '?';
  return `${source}${separator}v=${encodeURIComponent(String(versionSeed))}`;
};

export default function IngenieriePageAdmin() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');

  const [domainModalOpen, setDomainModalOpen] = useState(false);
  const [serviceModalOpen, setServiceModalOpen] = useState(false);
  const [mailModalOpen, setMailModalOpen] = useState(false);
  const [selectedForMail, setSelectedForMail] = useState(new Set());
  const [mailForm, setMailForm] = useState({ nom_complet: '', email: '', telephone: '', sujet: '', message: '' });
  const [domainForm, setDomainForm] = useState(INITIAL_DOMAIN_FORM);
  const [serviceForm, setServiceForm] = useState(INITIAL_SERVICE_FORM);
  const [editingDomainId, setEditingDomainId] = useState(null);
  const [editingServiceId, setEditingServiceId] = useState(null);
  const [domainUploadPreview, setDomainUploadPreview] = useState('');
  const { toast, showToast } = useAdminToast();

  const domaines = useMemo(
    () =>
      categories
        .filter((category) => !parentId(category))
        .sort((a, b) => Number(a?.ordre || 0) - Number(b?.ordre || 0)),
    [categories]
  );

  const services = useMemo(
    () =>
      categories
        .filter((category) => Boolean(parentId(category)))
        .sort((a, b) => Number(a?.ordre || 0) - Number(b?.ordre || 0)),
    [categories]
  );

  const servicesByDomain = useMemo(() => {
    const grouped = new Map();
    services.forEach((service) => {
      const key = parentId(service);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(service);
    });
    return grouped;
  }, [services]);

  const filteredDomaines = useMemo(() => {
    const q = normalizeText(search).trim();
    if (!q) return domaines;

    return domaines.filter((domain) => {
      const linkedServices = servicesByDomain.get(categoryId(domain)) || [];
      const meta = parseDomainMeta(domain?.icone);
      const serviceText = linkedServices.map((item) => `${item.nom || ''} ${item.slug || ''} ${item.description || ''}`).join(' ');
      const haystack = normalizeText(
        `${domain.nom || ''} ${domain.slug || ''} ${domain.description || ''} ${meta.details || ''} ${(meta.deliverables || []).join(' ')} ${(meta.technologies || []).join(' ')} ${serviceText}`
      );
      return haystack.includes(q);
    });
  }, [domaines, servicesByDomain, search]);

  const loadCategories = async ({ showLoader = false, silent = false } = {}) => {
    if (showLoader) {
      setLoading(true);
    }

    try {
      const response = await getCategories({ segment: INGENIERIE_SEGMENT });
      setCategories(Array.isArray(response?.data) ? response.data : []);
    } catch (_error) {
      if (showLoader) {
        setCategories([]);
      }
      if (!silent) {
        showToast('Impossible de charger les domaines Ingenierie.', 'error');
      }
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  };

  const backgroundLoadCategories = async () => {
    await loadCategories({ showLoader: false, silent: true });
  };

  useEffect(() => {
    loadCategories({ showLoader: true, silent: false });
  }, []);

  useLivePolling(backgroundLoadCategories, {
    enabled: !saving && !seeding,
    intervalMs: 2500,
  });

  useEffect(() => {
    if (!domainForm.image_file) {
      setDomainUploadPreview('');
      return;
    }

    const url = URL.createObjectURL(domainForm.image_file);
    setDomainUploadPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [domainForm.image_file]);

  const closeDomainModal = () => {
    if (saving) return;
    setDomainModalOpen(false);
    setEditingDomainId(null);
    setDomainForm(INITIAL_DOMAIN_FORM);
  };

  const closeServiceModal = () => {
    if (saving) return;
    setServiceModalOpen(false);
    setEditingServiceId(null);
    setServiceForm(INITIAL_SERVICE_FORM);
  };

  const openCreateDomainModal = () => {
    setEditingDomainId(null);
    setDomainForm(INITIAL_DOMAIN_FORM);
    setDomainModalOpen(true);
  };

  const toggleSelectForMail = (id) => {
    setSelectedForMail((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openMailModal = () => {
    const labels = categories.filter(c => selectedForMail.has(Number(c.id ?? c.id_categorie))).map(c => c.nom || c.slug || c.id);
    setMailForm(prev => ({ ...prev, sujet: labels.length ? `Demande: ${labels.join(', ')}` : prev.sujet, message: labels.length ? `Interet pour: ${labels.join(', ')}\n\nMerci.` : prev.message }));
    setMailModalOpen(true);
  };

  const sendMail = async (e) => {
    e && e.preventDefault && e.preventDefault();
    try {
      const payload = {
        nom_complet: String(mailForm.nom_complet || '').trim(),
        email: String(mailForm.email || '').trim(),
        telephone: String(mailForm.telephone || '').trim() || null,
        sujet: String(mailForm.sujet || '').trim() || 'Demande Ingenierie',
        message: String(mailForm.message || '').trim(),
      };

      if (!payload.nom_complet || !payload.email || !payload.message) {
        showToast('Nom, email et message obligatoires.', 'error');
        return;
      }

      await submitContactMessage(payload);
      showToast('Email envoyé.', 'success');
      setSelectedForMail(new Set());
      setMailModalOpen(false);
      setMailForm({ nom_complet: '', email: '', telephone: '', sujet: '', message: '' });
      await loadCategories({ showLoader: false, silent: true });
    } catch (err) {
      showToast(err?.response?.data?.message || 'Erreur lors de l envoi.', 'error');
    }
  };

  const openCreateServiceModal = () => {
    setEditingServiceId(null);
    setServiceForm((previous) => ({ ...INITIAL_SERVICE_FORM, parent_id: previous.parent_id || '' }));
    setServiceModalOpen(true);
  };

  const startEditDomain = (domain) => {
    const meta = parseDomainMeta(domain?.icone);
    setEditingDomainId(categoryId(domain));
    setDomainForm({
      nom: domain.nom || '',
      slug: domain.slug || '',
      description: domain.description || '',
      details: meta.details || '',
      deliverables: listToLines(meta.deliverables),
      technologies: listToLines(meta.technologies),
      image_url: domain.image_url || domain.image || '',
      image_file: null,
      existing_image: appendVersionToImage(domain.image_url || domain.image || '', domain.updated_at || domain.created_at || Date.now()),
      ordre: domain.ordre ?? 10,
      actif: domain.actif !== false,
    });
    setDomainModalOpen(true);
  };

  const startEditService = (service) => {
    setEditingServiceId(categoryId(service));
    setServiceForm({
      parent_id: parentId(service),
      nom: service.nom || '',
      slug: service.slug || '',
      description: service.description || '',
      ordre: service.ordre ?? 10,
      actif: service.actif !== false,
    });
    setServiceModalOpen(true);
  };

  const saveDomain = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const metadata = {
        details: String(domainForm.details || '').trim(),
        deliverables: linesToList(domainForm.deliverables),
        technologies: linesToList(domainForm.technologies),
      };

      const payload = {
        nom: domainForm.nom,
        slug: domainForm.slug || undefined,
        description: domainForm.description || null,
        icone: JSON.stringify(metadata),
        image_url: domainForm.image_url || null,
        parent_id: null,
        ordre: Number(domainForm.ordre || 0),
        actif: Boolean(domainForm.actif),
        segment: INGENIERIE_SEGMENT,
      };

      if (domainForm.image_file) {
        payload.image = domainForm.image_file;
      }

      if (editingDomainId) {
        await updateCategory(editingDomainId, payload);
      } else {
        await createCategory(payload);
      }

      closeDomainModal();
      await loadCategories({ showLoader: false, silent: true });
      showToast(editingDomainId ? 'Domaine mis a jour.' : 'Domaine cree.', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Erreur lors de la sauvegarde du domaine.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const saveService = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const payload = {
        ...serviceForm,
        parent_id: Number(serviceForm.parent_id || 0) || null,
        ordre: Number(serviceForm.ordre || 0),
        actif: Boolean(serviceForm.actif),
        segment: INGENIERIE_SEGMENT,
      };

      if (!payload.parent_id) {
        showToast('Selectionnez un domaine parent pour ce service.', 'error');
        return;
      }

      if (editingServiceId) {
        await updateCategory(editingServiceId, payload);
      } else {
        await createCategory(payload);
      }

      closeServiceModal();
      await loadCategories({ showLoader: false, silent: true });
      showToast(editingServiceId ? 'Service mis a jour.' : 'Service cree.', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Erreur lors de la sauvegarde du service.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (id) => {
    if (!window.confirm('Supprimer cet element ?')) return;

    setSaving(true);
    try {
      await deleteCategory(id, { force: true });
      await loadCategories({ showLoader: false, silent: true });
      showToast('Element supprime.', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Suppression impossible.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const seedDefaults = async () => {
    if (!window.confirm('Initialiser les domaines par defaut ?')) return;

    setSeeding(true);
    try {
      const response = await getCategories({ segment: INGENIERIE_SEGMENT });
      const existing = Array.isArray(response?.data) ? response.data : [];
      const bySlug = new Map(existing.map((item) => [String(item?.slug || ''), item]));

      for (const [index, domain] of INGENIERIE_DEFAULT_DOMAINES.entries()) {
        const metadata = {
          details: domain.details || '',
          deliverables: Array.isArray(domain.deliverables) ? domain.deliverables : [],
          technologies: Array.isArray(domain.technologies) ? domain.technologies : [],
        };

        const domainPayload = {
          nom: domain.title,
          slug: domain.slug,
          description: domain.description,
          image_url: domain.image,
          icone: JSON.stringify(metadata),
          ordre: index + 1,
          parent_id: null,
          actif: true,
          segment: INGENIERIE_SEGMENT,
        };

        const existingDomain = bySlug.get(domain.slug);
        let domainId;
        if (existingDomain) {
          domainId = categoryId(existingDomain);
          await updateCategory(domainId, domainPayload);
        } else {
          const created = await createCategory(domainPayload);
          domainId = categoryId(created?.data?.categorie);
        }

        for (const [serviceIndex, serviceRaw] of (domain.services || []).entries()) {
          const [serviceName, ...serviceDescriptionParts] = String(serviceRaw).split(' - ');
          const serviceSlug = `${domain.slug}-${serviceIndex + 1}`;
          const servicePayload = {
            nom: serviceName.trim(),
            slug: serviceSlug,
            description: serviceDescriptionParts.join(' - ').trim() || null,
            parent_id: domainId,
            ordre: serviceIndex + 1,
            actif: true,
            segment: INGENIERIE_SEGMENT,
          };

          const existingService = bySlug.get(serviceSlug);
          if (existingService) {
            await updateCategory(categoryId(existingService), servicePayload);
          } else {
            await createCategory(servicePayload);
          }
        }
      }

      await loadCategories({ showLoader: false, silent: true });
      showToast('Domaines Ingenierie initialises.', 'success');
    } catch (error) {
      showToast(error?.response?.data?.message || 'Initialisation impossible.', 'error');
    } finally {
      setSeeding(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="admin-page admin-page-max admin-ingenierie-page">
      <AdminToast toast={toast} />

      <section className="admin-hero admin-ingenierie-hero">
        <div className="admin-hero-content">
          <h1>Page Ingenierie</h1>
          <p>
            Toute cette page est liee a la base de donnees via <strong>categories_produits</strong> (segment
            <strong> ingenierie-page</strong>) : cartes, images, services et contenus detail prestation.
          </p>
        </div>

        <div className="admin-hero-actions">
          <button
            type="button"
            className="admin-btn admin-btn-sm admin-ingenierie-btn admin-ingenierie-btn-orange"
            onClick={seedDefaults}
            disabled={saving || seeding}
          >
            Initialiser les domaines
          </button>
          <span className="admin-hero-stat">{domaines.length} domaines</span>
          <button type="button" className="admin-btn admin-btn-sm" onClick={openMailModal} disabled={selectedForMail.size === 0} style={{ marginLeft: 8 }}>
            Envoyer mail ({selectedForMail.size})
          </button>
        </div>
      </section>

      <section className="admin-card admin-ingenierie-actions-card">
        <div className="admin-card-header">
          <h2>Gestion des contenus</h2>
          <div className="admin-ingenierie-actions">
            <button type="button" className="admin-btn admin-btn-sm admin-ingenierie-btn" onClick={openCreateDomainModal}>
              Ajouter un domaine
            </button>
            <button type="button" className="admin-btn admin-btn-sm admin-ingenierie-btn" onClick={openCreateServiceModal}>
              Ajouter un service
            </button>
          </div>
        </div>

        <div className="admin-ingenierie-searchbox">
          <span className="material-symbols-outlined admin-ingenierie-search-icon" aria-hidden="true">search</span>
          <input
            className="admin-form-input"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Rechercher domaine, service ou contenu detail..."
          />
          {!!search && (
            <button
              type="button"
              className="admin-ingenierie-clear-btn"
              onClick={() => setSearch('')}
              aria-label="Effacer la recherche"
            >
              <span className="material-symbols-outlined" aria-hidden="true">close</span>
            </button>
          )}
        </div>
      </section>

      <section className="admin-card admin-ingenierie-results">
        <div className="admin-card-header admin-ingenierie-results-header">
          <h2>Domaines publies</h2>
        </div>

        {filteredDomaines.length === 0 ? (
          <div className="admin-empty">
            <h3>Aucun domaine trouve</h3>
            <p>Ajoutez un domaine ou ajustez votre recherche.</p>
          </div>
        ) : (
          <div className="admin-ingenierie-domain-list">
            {filteredDomaines.map((domain) => {
              const id = categoryId(domain);
              const linkedServices = servicesByDomain.get(id) || [];
              const meta = parseDomainMeta(domain?.icone);
              const previewImage = appendVersionToImage(
                domain?.image_url || domain?.image || '',
                domain?.updated_at || domain?.created_at || Date.now()
              );

              return (
                <article key={id} className="admin-ingenierie-domain-card">
                  <header className="admin-ingenierie-domain-head">
                      <div className="admin-ingenierie-domain-meta">
                      <h3>{domain.nom}</h3>
                      <p>{domain.description || 'Aucune description.'}</p>
                      <div className="admin-ingenierie-domain-tags">
                        <span className="admin-badge admin-badge-info">/{domain.slug}</span>
                        <span className={`admin-badge ${domain.actif !== false ? 'admin-badge-success' : 'admin-badge-danger'}`}>
                          {domain.actif !== false ? 'Actif' : 'Inactif'}
                        </span>
                        <span className="admin-badge admin-badge-gray">Ordre: {domain.ordre ?? 0}</span>
                      </div>
                    </div>

                    <div className="admin-table-actions">
                      <label style={{ marginRight: 8 }} title="Sélectionner pour envoi">
                        <input type="checkbox" checked={selectedForMail.has(id)} onChange={() => toggleSelectForMail(id)} />
                      </label>
                      <button
                        type="button"
                        className="admin-ingenierie-icon-btn"
                        onClick={() => startEditDomain(domain)}
                        aria-label={`Editer ${domain.nom}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                      </button>
                      <button
                        type="button"
                        className="admin-ingenierie-icon-btn admin-ingenierie-icon-btn-danger"
                        onClick={() => removeCategory(id)}
                        disabled={saving}
                        aria-label={`Supprimer ${domain.nom}`}
                      >
                        <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                      </button>
                    </div>
                  </header>

                  {!!previewImage && (
                    <div className="admin-ingenierie-domain-image-wrap">
                      <img src={previewImage} alt={domain.nom} className="admin-ingenierie-domain-image" />
                    </div>
                  )}

                  {!!String(meta?.details || '').trim() && (
                    <div className="admin-notice info">
                      <strong>Details prestation:</strong> {meta.details}
                    </div>
                  )}

                  {(Array.isArray(meta?.deliverables) && meta.deliverables.length > 0) || (Array.isArray(meta?.technologies) && meta.technologies.length > 0) ? (
                    <div className="admin-ingenierie-domain-extra-grid">
                      {Array.isArray(meta?.deliverables) && meta.deliverables.length > 0 && (
                        <div className="admin-ingenierie-mini-panel">
                          <h4>Livrables</h4>
                          <ul>
                            {meta.deliverables.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {Array.isArray(meta?.technologies) && meta.technologies.length > 0 && (
                        <div className="admin-ingenierie-mini-panel">
                          <h4>Technologies</h4>
                          <ul>
                            {meta.technologies.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}

                  {linkedServices.length > 0 ? (
                    <ul className="admin-ingenierie-service-list">
                      {linkedServices.map((service) => {
                        const serviceId = categoryId(service);
                        return (
                          <li key={serviceId}>
                            <div>
                              <strong>{service.nom}</strong>
                              {service.description && <p>{service.description}</p>}
                            </div>
                            <div className="admin-table-actions">
                              <label style={{ marginRight: 8 }} title="Sélectionner pour envoi">
                                <input type="checkbox" checked={selectedForMail.has(serviceId)} onChange={() => toggleSelectForMail(serviceId)} />
                              </label>
                              <button
                                type="button"
                                className="admin-ingenierie-icon-btn"
                                onClick={() => startEditService(service)}
                                aria-label={`Editer ${service.nom}`}
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">edit</span>
                              </button>
                              <button
                                type="button"
                                className="admin-ingenierie-icon-btn admin-ingenierie-icon-btn-danger"
                                onClick={() => removeCategory(serviceId)}
                                disabled={saving}
                                aria-label={`Supprimer ${service.nom}`}
                              >
                                <span className="material-symbols-outlined" aria-hidden="true">delete</span>
                              </button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  ) : (
                    <div className="admin-notice info">Aucun service detail n'est encore rattache a ce domaine.</div>
                  )}
                </article>
              );
            })}
          </div>
        )}
      </section>

      {domainModalOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={closeDomainModal}>
          <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--tagged admin-ingenierie-modal">
              <div className="admin-catalogue-card-head admin-ingenierie-modal-head">
                <h2>{editingDomainId ? 'Modifier un domaine' : 'Creer un domaine'}</h2>
                <button type="button" className="admin-ingenierie-icon-btn" onClick={closeDomainModal} aria-label="Fermer">
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>

              <form className="admin-form" onSubmit={saveDomain}>
                <div className="admin-form-grid admin-ingenierie-form-grid">
                  <div className="admin-form-field admin-form-grid-half">
                    <label>Nom</label>
                    <input
                      className="admin-form-input"
                      value={domainForm.nom}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, nom: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Slug</label>
                    <input
                      className="admin-form-input"
                      value={domainForm.slug}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, slug: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Image URL</label>
                    <input
                      className="admin-form-input"
                      value={domainForm.image_url}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, image_url: event.target.value }))}
                      placeholder="/images/..."
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Uploader une image</label>
                    <input
                      className="admin-form-input"
                      type="file"
                      accept="image/*"
                      onChange={(event) => setDomainForm((prev) => ({ 
                        ...prev, 
                        image_file: event.target.files?.[0] || null,
                        existing_image: ''
                      }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-third">
                    <label>Ordre</label>
                    <input
                      className="admin-form-input"
                      type="number"
                      value={domainForm.ordre}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, ordre: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-full">
                    <label>Description courte (carte)</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={3}
                      value={domainForm.description}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-full">
                    <label>Details longue (page prestation)</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      value={domainForm.details}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, details: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Livrables (1 ligne = 1 element)</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      value={domainForm.deliverables}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, deliverables: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Technologies (1 ligne = 1 element)</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      value={domainForm.technologies}
                      onChange={(event) => setDomainForm((prev) => ({ ...prev, technologies: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-checkboxes admin-form-grid-full">
                    <div className="admin-form-checkbox">
                      <input
                        id="ingenierie-domaine-actif"
                        type="checkbox"
                        checked={domainForm.actif}
                        onChange={(event) => setDomainForm((prev) => ({ ...prev, actif: event.target.checked }))}
                      />
                      <label htmlFor="ingenierie-domaine-actif">Actif</label>
                    </div>
                  </div>

                  {(domainUploadPreview || domainForm.existing_image) && (
                    <div className="admin-form-grid-full">
                      <img
                        src={domainUploadPreview || domainForm.existing_image}
                        alt="Apercu domaine"
                        className="admin-ingenierie-upload-preview"
                      />
                    </div>
                  )}
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={closeDomainModal}>
                    Annuler
                  </button>
                  <button type="submit" className="admin-btn admin-btn-sm admin-ingenierie-btn" disabled={saving}>
                    {editingDomainId ? 'Mettre a jour' : 'Creer'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      {mailModalOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={() => setMailModalOpen(false)}>
          <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--tagged admin-ingenierie-modal">
              <div className="admin-catalogue-card-head admin-ingenierie-modal-head">
                <h2>Envoyer un email</h2>
                <button type="button" className="admin-ingenierie-icon-btn" onClick={() => setMailModalOpen(false)} aria-label="Fermer">
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>

              <form className="admin-form" onSubmit={sendMail}>
                <div className="admin-form-grid">
                  <div className="admin-form-field admin-form-grid-half">
                    <label>Nom complet</label>
                    <input className="admin-form-input" value={mailForm.nom_complet} onChange={(e) => setMailForm(prev => ({ ...prev, nom_complet: e.target.value }))} required />
                  </div>
                  <div className="admin-form-field admin-form-grid-half">
                    <label>Email destinataire</label>
                    <input className="admin-form-input" type="email" value={mailForm.email} onChange={(e) => setMailForm(prev => ({ ...prev, email: e.target.value }))} required />
                  </div>
                  <div className="admin-form-field admin-form-grid-half">
                    <label>Téléphone</label>
                    <input className="admin-form-input" value={mailForm.telephone} onChange={(e) => setMailForm(prev => ({ ...prev, telephone: e.target.value }))} />
                  </div>
                  <div className="admin-form-field admin-form-grid-full">
                    <label>Sujet</label>
                    <input className="admin-form-input" value={mailForm.sujet} onChange={(e) => setMailForm(prev => ({ ...prev, sujet: e.target.value }))} />
                  </div>
                  <div className="admin-form-field admin-form-grid-full">
                    <label>Message</label>
                    <textarea className="admin-form-textarea" rows={6} value={mailForm.message} onChange={(e) => setMailForm(prev => ({ ...prev, message: e.target.value }))} required />
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={() => setMailModalOpen(false)}>Annuler</button>
                  <button type="submit" className="admin-btn admin-btn-sm admin-ingenierie-btn">Envoyer</button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}

      {serviceModalOpen && (
        <div className="admin-catalogue-modal-overlay" role="dialog" aria-modal="true" onClick={closeServiceModal}>
          <div className="admin-catalogue-modal-shell" onClick={(event) => event.stopPropagation()}>
            <section className="admin-catalogue-card admin-catalogue-modal admin-catalogue-modal--tagged admin-ingenierie-modal">
              <div className="admin-catalogue-card-head admin-ingenierie-modal-head">
                <h2>{editingServiceId ? 'Modifier un service' : 'Creer un service'}</h2>
                <button type="button" className="admin-ingenierie-icon-btn" onClick={closeServiceModal} aria-label="Fermer">
                  <span className="material-symbols-outlined" aria-hidden="true">close</span>
                </button>
              </div>

              <form className="admin-form" onSubmit={saveService}>
                <div className="admin-form-grid admin-ingenierie-form-grid">
                  <div className="admin-form-field admin-form-grid-half">
                    <label>Domaine parent</label>
                    <select
                      className="admin-form-select"
                      value={serviceForm.parent_id}
                      onChange={(event) => setServiceForm((prev) => ({ ...prev, parent_id: event.target.value }))}
                      required
                    >
                      <option value="">Choisir un domaine</option>
                      {domaines.map((domain) => (
                        <option key={categoryId(domain)} value={categoryId(domain)}>
                          {domain.nom}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Nom service</label>
                    <input
                      className="admin-form-input"
                      value={serviceForm.nom}
                      onChange={(event) => setServiceForm((prev) => ({ ...prev, nom: event.target.value }))}
                      required
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-half">
                    <label>Slug</label>
                    <input
                      className="admin-form-input"
                      value={serviceForm.slug}
                      onChange={(event) => setServiceForm((prev) => ({ ...prev, slug: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-third">
                    <label>Ordre</label>
                    <input
                      className="admin-form-input"
                      type="number"
                      value={serviceForm.ordre}
                      onChange={(event) => setServiceForm((prev) => ({ ...prev, ordre: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-field admin-form-grid-full">
                    <label>Description service</label>
                    <textarea
                      className="admin-form-textarea"
                      rows={4}
                      value={serviceForm.description}
                      onChange={(event) => setServiceForm((prev) => ({ ...prev, description: event.target.value }))}
                    />
                  </div>

                  <div className="admin-form-checkboxes admin-form-grid-full">
                    <div className="admin-form-checkbox">
                      <input
                        id="ingenierie-service-actif"
                        type="checkbox"
                        checked={serviceForm.actif}
                        onChange={(event) => setServiceForm((prev) => ({ ...prev, actif: event.target.checked }))}
                      />
                      <label htmlFor="ingenierie-service-actif">Actif</label>
                    </div>
                  </div>
                </div>

                <div className="admin-form-actions">
                  <button type="button" className="admin-btn admin-btn-secondary admin-btn-sm" onClick={closeServiceModal}>
                    Annuler
                  </button>
                  <button type="submit" className="admin-btn admin-btn-sm admin-ingenierie-btn" disabled={saving}>
                    {editingServiceId ? 'Mettre a jour' : 'Creer'}
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>
      )}
    </div>
  );
}
