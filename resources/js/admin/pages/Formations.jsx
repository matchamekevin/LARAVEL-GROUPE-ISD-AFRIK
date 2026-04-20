import React, { useEffect, useMemo, useState } from 'react';
import {
  getFormations,
  createFormation,
  updateFormation,
  deleteFormation,
  createImageAdmin,
  updateImageAdmin,
  deleteImageAdmin,
  uploadImageFile,
} from '../api';
import { resolveFormationImageUrl } from '../../utils/mediaUrl';
import { getApiBase } from '../../utils/apiBase';
import { useLivePolling } from '../../hooks/useLivePolling';
import Loader from '../components/Loader';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import DeleteIconButton from '../components/DeleteIconButton';
import '../styles/admin-shared.css';
import '../styles/formations.css';
import '../styles/products.css';

const INITIAL_FORM = {
  titre: '',
  description: '',
  duree: 1,
  prix: '',
  categorie: 'particulier',
  date_debut: '',
  places_disponibles: 1,
  id_pays: '',
  image_file: null,
  image_alt: '',
};

const formatAmount = (value) => {
  const n = Number(value);
  if (!Number.isFinite(n)) return '0';
  return n.toLocaleString('fr-FR');
};

const getFirstImage = (formation) => {
  const images = Array.isArray(formation.images) ? formation.images : [];
  if (images.length === 0) return null;
  return images[0];
};

export default function Formations() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [newFormation, setNewFormation] = useState(INITIAL_FORM);
  const { toast, showToast } = useAdminToast();

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);

  const FORMATIONS_PER_PAGE = 20;
  const EMPTY_PAGINATION = {
    total: 0,
    per_page: FORMATIONS_PER_PAGE,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  };

  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [stats, setStats] = useState({ total: 0, particulier: 0, etudiant: 0, entreprise: 0 });
  const [refreshToken, setRefreshToken] = useState(0);
  const [categorie, setCategorie] = useState('all');

  async function loadFormations() {
    setLoading(true);
    try {
      const params = {
        page,
        per_page: FORMATIONS_PER_PAGE,
      };

      if (searchInput.trim() !== '') {
        params.q = searchInput.trim();
      }

      if (categorie !== 'all') {
        params.categorie = categorie;
      }

      const res = await getFormations(params);
      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && page > nextMeta.last_page) {
        setPage(nextMeta.last_page);
        return;
      }

      setFormations(list);
      setPagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || FORMATIONS_PER_PAGE),
        current_page: Number(nextMeta.current_page || page),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });
      setStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        particulier: Number(nextStats.particulier || 0),
        etudiant: Number(nextStats.etudiant || 0),
        entreprise: Number(nextStats.entreprise || 0),
      });
    } catch (err) {
      console.error('Erreur chargement formations', err);
      setFormations([]);
      setPagination(EMPTY_PAGINATION);
      setStats({ total: 0, particulier: 0, etudiant: 0, entreprise: 0 });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormations();
  }, [page, categorie, searchInput, refreshToken]);

  const backgroundLoadFormations = async () => {
    try {
      const params = {
        page,
        per_page: FORMATIONS_PER_PAGE,
      };

      if (searchInput.trim() !== '') {
        params.q = searchInput.trim();
      }

      if (categorie !== 'all') {
        params.categorie = categorie;
      }

      const res = await getFormations(params);
      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && page > nextMeta.last_page) {
        setPage(nextMeta.last_page);
        return;
      }

      setFormations(list);
      setPagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || FORMATIONS_PER_PAGE),
        current_page: Number(nextMeta.current_page || page),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });
      setStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        particulier: Number(nextStats.particulier || 0),
        etudiant: Number(nextStats.etudiant || 0),
        entreprise: Number(nextStats.entreprise || 0),
      });
    } catch (err) {
      // silent background refresh
    }
  };

  useLivePolling(
    () => backgroundLoadFormations(),
    {
      intervalMs: 8000,
      enabled: !saving && !loading,
    }
  );

  async function handleCreate(e) {
    e.preventDefault();
    setSaving(true);
    try {
      const createRes = await createFormation({
        ...newFormation,
        duree: Number(newFormation.duree),
        prix: Number(newFormation.prix),
        places_disponibles: Number(newFormation.places_disponibles),
        id_pays: Number(newFormation.id_pays),
      });

      const created = createRes?.data || {};
      const createdId = Number(created.id || created.id_formation);

      if (newFormation.image_file && createdId) {
        const uploaded = await uploadImageFile(newFormation.image_file, 'formations');
        await createImageAdmin({
          url: uploaded.url,
          path: uploaded.path || uploaded.url,
          alt: newFormation.image_alt.trim() || newFormation.titre,
          imageable_type: 'FORMATION',
          imageable_id: createdId,
        });
      }

      setNewFormation(INITIAL_FORM);
      setCreateModalOpen(false);
      await loadFormations();
      showToast('Formation creee avec succes.', 'success');
    } catch (err) {
      console.error('Erreur création formation', err);
      showToast(err?.response?.data?.message || 'Erreur creation formation', 'error');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette formation ?')) return;
    try {
      await deleteFormation(id);
      setRefreshToken((t) => t + 1);
      showToast('Formation supprimee.', 'success');
    } catch (err) {
      console.error('Erreur suppression formation', err);
      showToast('Erreur suppression formation', 'error');
    }
  }

  async function handleSave(id) {
    const f = formations.find((x) => x.id === id);
    if (!f) return;

    try {
      await updateFormation(id, {
        titre: f._titre ?? f.titre,
        description: f._description ?? f.description,
        duree: Number(f._duree ?? f.duree),
        prix: Number(f._prix ?? f.prix),
        categorie: f._categorie ?? f.categorie,
        date_debut: f._date_debut ?? f.date_debut,
        places_disponibles: Number(f._places_disponibles ?? f.places_disponibles),
        id_pays: Number(f._id_pays ?? f.id_pays),
      });

      const nextImageFile = f._image_file || null;
      let nextImageUrl = String(f._image_url ?? '').trim();
      let nextImagePath = nextImageUrl;
      if (nextImageFile) {
        const uploaded = await uploadImageFile(nextImageFile, 'formations');
        nextImageUrl = String(uploaded?.url || '').trim();
        nextImagePath = String(uploaded?.path || nextImageUrl).trim();
      }
      const nextImageAlt = String(f._image_alt ?? '').trim() || (f._titre ?? f.titre ?? 'Formation');
      const existingImageId = Number(f._image_id || 0);

      if (nextImageUrl) {
        const imagePayload = {
          url: nextImageUrl,
          path: nextImagePath,
          alt: nextImageAlt,
          imageable_type: 'FORMATION',
          imageable_id: Number(f.id || f.id_formation),
        };

        if (existingImageId) {
          await updateImageAdmin(existingImageId, imagePayload);
        } else {
          await createImageAdmin(imagePayload);
        }
      } else if (existingImageId) {
        await deleteImageAdmin(existingImageId);
      }

      await loadFormations();
      showToast('Formation mise a jour avec succes.', 'success');
    } catch (err) {
      console.error('Erreur update formation', err);
      showToast(err?.response?.data?.message || 'Erreur mise a jour formation', 'error');
    }
  }

  function startEdit(id) {
    const f = formations.find((x) => x.id === id);
    if (!f) return;
    const img = getFirstImage(f);
    setEditForm({
      id: f.id,
      titre: f.titre || '',
      description: f.description || '',
      duree: f.duree ?? 1,
      prix: f.prix ?? '',
      categorie: f.categorie || 'particulier',
      date_debut: f.date_debut ? String(f.date_debut).slice(0, 10) : '',
      places_disponibles: f.places_disponibles ?? 1,
      id_pays: f.id_pays ?? '',
      image_id: img?.id ?? null,
      image_url: img?.url || '',
      image_file: null,
      image_alt: img?.alt || '',
    });
    setEditModalOpen(true);
  }

  function cancelEdit(id) {
    setEditModalOpen(false);
    setEditForm(null);
  }

  async function handleUpdate(e) {
    e.preventDefault();
    if (!editForm) return;
    setSaving(true);
    try {
      await updateFormation(editForm.id, {
        titre: editForm.titre,
        description: editForm.description,
        duree: Number(editForm.duree || 1),
        prix: Number(editForm.prix || 0),
        categorie: editForm.categorie,
        date_debut: editForm.date_debut,
        places_disponibles: Number(editForm.places_disponibles || 1),
        id_pays: Number(editForm.id_pays || 0),
      });

      const nextImageFile = editForm.image_file || null;
      let nextImageUrl = String(editForm.image_url || '').trim();
      let nextImagePath = nextImageUrl;
      if (nextImageFile) {
        const uploaded = await uploadImageFile(nextImageFile, 'formations');
        nextImageUrl = String(uploaded?.url || '').trim();
        nextImagePath = String(uploaded?.path || nextImageUrl).trim();
      }
      const nextImageAlt = String(editForm.image_alt || '').trim() || editForm.titre || 'Formation';
      const existingImageId = Number(editForm.image_id || 0);

      if (nextImageUrl) {
        const imagePayload = {
          url: nextImageUrl,
          path: nextImagePath,
          alt: nextImageAlt,
          imageable_type: 'FORMATION',
          imageable_id: Number(editForm.id),
        };

        if (existingImageId) {
          await updateImageAdmin(existingImageId, imagePayload);
        } else {
          await createImageAdmin(imagePayload);
        }
      } else if (existingImageId) {
        await deleteImageAdmin(existingImageId);
      }

      await loadFormations();
      showToast('Formation mise a jour avec succes.', 'success');
      setEditModalOpen(false);
      setEditForm(null);
    } catch (err) {
      console.error('Erreur update formation', err);
      showToast(err?.response?.data?.message || 'Erreur mise a jour formation', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="admin-formations-page">
      <header className="admin-formations-hero">
        <div>
          <h1>Gestion des Formations</h1>
          <p>
            Creez, recherchez et mettez a jour vos formations, avec gestion de l image principale.
          </p>
        </div>
        <span className="admin-formations-count">{stats.total || pagination.total || formations.length} formation(s)</span>
      </header>

      <section className="admin-formations-card">
        <div className="admin-formations-card-head">
          <h2>Liste des formations</h2>
          <div style={{ marginLeft: 'auto' }}>
            <button type="button" className="btn-primary" onClick={() => setCreateModalOpen(true)}>
              Creer une formation
            </button>
          </div>
        </div>

        <div className="admin-formations-searchbar">
          <input
            placeholder="Rechercher par titre ou description..."
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              setPage(1);
            }}
          />
          <select
            value={categorie}
            onChange={(e) => {
              setCategorie(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">Toutes les categories</option>
            <option value="particulier">Particulier</option>
            <option value="etudiant">Etudiant</option>
            <option value="entreprise">Entreprise</option>
          </select>
        </div>

        {loading ? (
          <Loader text="Chargement des formations..." />
        ) : (pagination.total === 0 && formations.length === 0) ? (
          <div className="admin-formations-empty">Aucune formation trouvee.</div>
        ) : (
          <>
            <div className="admin-formations-table-wrap">
              <table className="admin-formations-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Image</th>
                    <th>Titre et description</th>
                    <th>Prix</th>
                    <th>Categorie</th>
                    <th>Debut</th>
                    <th>Places</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {formations.map((f) => {
                    const image = getFirstImage(f);
                    const imageUrl = resolveFormationImageUrl(image?.url, getApiBase());

                    return (
                      <tr key={f.id}>
                        <td>#{f.id}</td>

                        <td>
                          <div className="admin-formations-image-cell">
                            {imageUrl ? (
                              <img src={imageUrl} alt={image?.alt || f.titre} />
                            ) : (
                              <span className="admin-formations-no-image">Aucune image</span>
                            )}
                          </div>
                        </td>

                        <td>
                          <div className="admin-formations-title-cell">
                            <strong>{f.titre}</strong>
                            <small>{f.description}</small>
                          </div>
                        </td>

                        <td>
                          <strong>{formatAmount(f.prix)} FCFA</strong>
                        </td>

                        <td>
                          <span className="admin-formations-badge">{f.categorie}</span>
                        </td>

                        <td>
                          {f.date_debut ? String(f.date_debut).slice(0, 10) : '—'}
                        </td>

                        <td>
                          <>
                            <strong>{f.places_disponibles ?? 0}</strong>
                            <small>ID Pays: {f.id_pays ?? '—'}</small>
                          </>
                        </td>

                        <td>
                          <div className="admin-formations-row-actions">
                            <button
                              type="button"
                              className="btn-secondary"
                              onClick={() => startEdit(f.id)}
                              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 -960 960 960" width="24px" fill="#EA3323" aria-hidden="true">
                                <path d="M200-200h57l391-391-57-57-391 391v57Zm-80 80v-170l528-527q12-11 26.5-17t30.5-6q16 0 31 6t26 18l55 56q12 11 17.5 26t5.5 30q0 16-5.5 30.5T817-647L290-120H120Zm640-584-56-56 56 56Zm-141 85-28-29 57 57-29-28Z" />
                              </svg>
                              <span>Editer</span>
                            </button>
                            <DeleteIconButton
                              className="admin-formations-danger"
                              onClick={() => handleDelete(f.id)}
                              title="Supprimer"
                              ariaLabel={`Supprimer la formation ${f.titre}`}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {formations.length > 0 && (
              <div className="admin-formations-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem' }}>
                <span className="admin-formations-count">
                  Affichage {pagination.from || 0}-{pagination.to || 0} sur {pagination.total || 0}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={pagination.current_page <= 1}
                  >
                    Précédent
                  </button>
                  <span className="admin-formations-count">
                    Page {pagination.current_page} / {pagination.last_page}
                  </span>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={pagination.current_page >= pagination.last_page}
                  >
                    Suivant
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {createModalOpen && (
        <div className="admin-products-modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-products-modal-shell">
            <div className="admin-products-category-modal admin-products-modal">
              <div className="admin-products-card-head" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2>Créer une formation</h2>
                <div style={{ marginLeft: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>Fermer</button>
                </div>
              </div>

              <form className="admin-products-category-form" onSubmit={handleCreate}>
                <label>
                  Titre
                  <input placeholder="Ex: Formation Cybersecurite" value={newFormation.titre} onChange={(e) => setNewFormation({ ...newFormation, titre: e.target.value })} required />
                </label>

                <label>
                  Prix (FCFA)
                  <input type="number" min="0" value={newFormation.prix} onChange={(e) => setNewFormation({ ...newFormation, prix: e.target.value })} required />
                </label>

                <label>
                  Duree (jours)
                  <input type="number" min="1" value={newFormation.duree} onChange={(e) => setNewFormation({ ...newFormation, duree: e.target.value })} required />
                </label>

                <label>
                  Places disponibles
                  <input type="number" min="1" value={newFormation.places_disponibles} onChange={(e) => setNewFormation({ ...newFormation, places_disponibles: e.target.value })} required />
                </label>

                <label>
                  ID Pays
                  <input type="number" min="1" value={newFormation.id_pays} onChange={(e) => setNewFormation({ ...newFormation, id_pays: e.target.value })} required />
                </label>

                <label>
                  Categorie
                  <select value={newFormation.categorie} onChange={(e) => setNewFormation({ ...newFormation, categorie: e.target.value })}>
                    <option value="particulier">Particulier</option>
                    <option value="etudiant">Etudiant</option>
                    <option value="entreprise">Entreprise</option>
                  </select>
                </label>

                <label>
                  Date debut
                  <input type="date" value={newFormation.date_debut} onChange={(e) => setNewFormation({ ...newFormation, date_debut: e.target.value })} required />
                </label>

                <label>
                  Image formation
                  <input type="file" accept="image/*" onChange={(e) => setNewFormation({ ...newFormation, image_file: e.target.files?.[0] || null })} />
                </label>

                <label>
                  Texte alternatif image
                  <input placeholder="Description image" value={newFormation.image_alt} onChange={(e) => setNewFormation({ ...newFormation, image_alt: e.target.value })} />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Description
                  <textarea rows={4} placeholder="Description complete de la formation" value={newFormation.description} onChange={(e) => setNewFormation({ ...newFormation, description: e.target.value })} required />
                </label>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => setCreateModalOpen(false)}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Creation...' : 'Creer la formation'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {editModalOpen && editForm && (
        <div className="admin-products-modal-overlay" role="dialog" aria-modal="true" style={{ position: 'fixed', inset: 0, zIndex: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div className="admin-products-modal-shell">
            <div className="admin-products-category-modal admin-products-modal">
              <div className="admin-products-card-head" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <h2>Modifier la formation</h2>
                <div style={{ marginLeft: 'auto' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setEditModalOpen(false); setEditForm(null); }}>Fermer</button>
                </div>
              </div>

              <form className="admin-products-category-form" onSubmit={handleUpdate}>
                <label>
                  Titre
                  <input placeholder="Ex: Formation Cybersecurite" value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} required />
                </label>

                <label>
                  Prix (FCFA)
                  <input type="number" min="0" value={editForm.prix} onChange={(e) => setEditForm({ ...editForm, prix: e.target.value })} required />
                </label>

                <label>
                  Duree (jours)
                  <input type="number" min="1" value={editForm.duree} onChange={(e) => setEditForm({ ...editForm, duree: e.target.value })} required />
                </label>

                <label>
                  Places disponibles
                  <input type="number" min="1" value={editForm.places_disponibles} onChange={(e) => setEditForm({ ...editForm, places_disponibles: e.target.value })} required />
                </label>

                <label>
                  ID Pays
                  <input type="number" min="1" value={editForm.id_pays} onChange={(e) => setEditForm({ ...editForm, id_pays: e.target.value })} required />
                </label>

                <label>
                  Categorie
                  <select value={editForm.categorie} onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })}>
                    <option value="particulier">Particulier</option>
                    <option value="etudiant">Etudiant</option>
                    <option value="entreprise">Entreprise</option>
                  </select>
                </label>

                <label>
                  Date debut
                  <input type="date" value={editForm.date_debut} onChange={(e) => setEditForm({ ...editForm, date_debut: e.target.value })} />
                </label>

                <label>
                  Image formation
                  <input type="file" accept="image/*" onChange={(e) => setEditForm({ ...editForm, image_file: e.target.files?.[0] || null, image_url: '' })} />
                </label>

                <label>
                  Texte alternatif image
                  <input placeholder="Description image" value={editForm.image_alt} onChange={(e) => setEditForm({ ...editForm, image_alt: e.target.value })} />
                </label>

                <label style={{ gridColumn: '1 / -1' }}>
                  Description
                  <textarea rows={4} placeholder="Description complete de la formation" value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} required />
                </label>

                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-secondary" onClick={() => { setEditModalOpen(false); setEditForm(null); }}>Annuler</button>
                  <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Enregistrement...' : 'Enregistrer'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      <AdminToast toast={toast} />
    </div>
  );
}
