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
import '../styles/admin-shared.css';
import '../styles/formations.css';

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

  useLivePolling(
    () => {
      setRefreshToken((token) => token + 1);
    },
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
    setFormations((prev) =>
      prev.map((f) =>
        f.id === id
          ? {
              ...f,
              _editing: true,
              _titre: f.titre || '',
              _description: f.description || '',
              _duree: f.duree ?? 1,
              _prix: f.prix ?? '',
              _categorie: f.categorie || 'particulier',
              _date_debut: f.date_debut ? String(f.date_debut).slice(0, 10) : '',
              _places_disponibles: f.places_disponibles ?? 1,
              _id_pays: f.id_pays ?? '',
              _image_id: getFirstImage(f)?.id ?? null,
              _image_url: getFirstImage(f)?.url || '',
              _image_file: null,
              _image_alt: getFirstImage(f)?.alt || '',
            }
          : f
      )
    );
  }

  function cancelEdit(id) {
    setFormations((prev) => prev.map((f) => (f.id === id ? { ...f, _editing: false } : f)));
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
        <h2>Creer une formation</h2>
        <form onSubmit={handleCreate} className="admin-formations-form">
          <div className="admin-formations-grid">
            <label>
              Titre
              <input
                placeholder="Ex: Formation Cybersecurite"
                value={newFormation.titre}
                onChange={(e) => setNewFormation({ ...newFormation, titre: e.target.value })}
                required
              />
            </label>

            <label>
              Prix (FCFA)
              <input
                type="number"
                min="0"
                value={newFormation.prix}
                onChange={(e) => setNewFormation({ ...newFormation, prix: e.target.value })}
                required
              />
            </label>

            <label>
              Duree (jours)
              <input
                type="number"
                min="1"
                value={newFormation.duree}
                onChange={(e) => setNewFormation({ ...newFormation, duree: e.target.value })}
                required
              />
            </label>

            <label>
              Places disponibles
              <input
                type="number"
                min="1"
                value={newFormation.places_disponibles}
                onChange={(e) => setNewFormation({ ...newFormation, places_disponibles: e.target.value })}
                required
              />
            </label>

            <label>
              ID Pays
              <input
                type="number"
                min="1"
                value={newFormation.id_pays}
                onChange={(e) => setNewFormation({ ...newFormation, id_pays: e.target.value })}
                required
              />
            </label>

            <label>
              Categorie
              <select
                value={newFormation.categorie}
                onChange={(e) => setNewFormation({ ...newFormation, categorie: e.target.value })}
              >
                <option value="particulier">Particulier</option>
                <option value="etudiant">Etudiant</option>
                <option value="entreprise">Entreprise</option>
              </select>
            </label>

            <label>
              Date debut
              <input
                type="date"
                value={newFormation.date_debut}
                onChange={(e) => setNewFormation({ ...newFormation, date_debut: e.target.value })}
                required
              />
            </label>

            <label>
              Image formation
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setNewFormation({ ...newFormation, image_file: e.target.files?.[0] || null })}
              />
            </label>

            <label className="admin-formations-grid-full">
              Texte alternatif image
              <input
                placeholder="Description image"
                value={newFormation.image_alt}
                onChange={(e) => setNewFormation({ ...newFormation, image_alt: e.target.value })}
              />
            </label>

            <label className="admin-formations-grid-full">
              Description
              <textarea
                rows={3}
                placeholder="Description complete de la formation"
                value={newFormation.description}
                onChange={(e) => setNewFormation({ ...newFormation, description: e.target.value })}
                required
              />
            </label>
          </div>

          <div className="admin-formations-actions">
            <button type="submit" className="btn-primary" disabled={saving}>
              {saving ? 'Creation...' : 'Creer la formation'}
            </button>
          </div>
        </form>
      </section>

      <section className="admin-formations-card">
        <div className="admin-formations-card-head">
          <h2>Liste des formations</h2>
          <button type="button" className="btn-secondary" onClick={loadFormations}>Actualiser</button>
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
                            {f._editing ? (
                              <>
                                {imageUrl ? (
                                  <img src={imageUrl} alt={image?.alt || f.titre} />
                                ) : (
                                  <span className="admin-formations-no-image">Aucune image</span>
                                )}

                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) =>
                                    setFormations((prev) =>
                                      prev.map((x) => (x.id === f.id ? { ...x, _image_file: e.target.files?.[0] || null, _image_url: '' } : x))
                                    )
                                  }
                                />

                                <small>
                                  {f._image_file ? `Nouvelle image: ${f._image_file.name}` : 'Laisser vide pour conserver l image actuelle.'}
                                </small>

                                <input
                                  placeholder="Texte alternatif"
                                  value={f._image_alt}
                                  onChange={(e) =>
                                    setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _image_alt: e.target.value } : x)))
                                  }
                                />
                              </>
                            ) : (
                              imageUrl ? (
                                <img src={imageUrl} alt={image?.alt || f.titre} />
                              ) : (
                                <span className="admin-formations-no-image">Aucune image</span>
                              )
                            )}
                          </div>
                        </td>

                        <td>
                          {f._editing ? (
                            <div className="admin-formations-edit-stack">
                              <input
                                value={f._titre}
                                onChange={(e) =>
                                  setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _titre: e.target.value } : x)))
                                }
                              />
                              <textarea
                                rows={3}
                                value={f._description}
                                onChange={(e) =>
                                  setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _description: e.target.value } : x)))
                                }
                              />
                            </div>
                          ) : (
                            <div className="admin-formations-title-cell">
                              <strong>{f.titre}</strong>
                              <small>{f.description}</small>
                            </div>
                          )}
                        </td>

                        <td>
                          {f._editing ? (
                            <input
                              type="number"
                              min="0"
                              value={f._prix}
                              onChange={(e) =>
                                setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _prix: e.target.value } : x)))
                              }
                            />
                          ) : (
                            <strong>{formatAmount(f.prix)} FCFA</strong>
                          )}
                        </td>

                        <td>
                          {f._editing ? (
                            <select
                              value={f._categorie}
                              onChange={(e) =>
                                setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _categorie: e.target.value } : x)))
                              }
                            >
                              <option value="particulier">Particulier</option>
                              <option value="etudiant">Etudiant</option>
                              <option value="entreprise">Entreprise</option>
                            </select>
                          ) : (
                            <span className="admin-formations-badge">{f.categorie}</span>
                          )}
                        </td>

                        <td>
                          {f._editing ? (
                            <input
                              type="date"
                              value={f._date_debut}
                              onChange={(e) =>
                                setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _date_debut: e.target.value } : x)))
                              }
                            />
                          ) : (
                            f.date_debut ? String(f.date_debut).slice(0, 10) : '—'
                          )}
                        </td>

                        <td>
                          {f._editing ? (
                            <div className="admin-formations-edit-stack">
                              <input
                                type="number"
                                min="1"
                                value={f._places_disponibles}
                                onChange={(e) =>
                                  setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _places_disponibles: e.target.value } : x)))
                                }
                              />
                              <input
                                type="number"
                                min="1"
                                value={f._id_pays}
                                onChange={(e) =>
                                  setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _id_pays: e.target.value } : x)))
                                }
                              />
                            </div>
                          ) : (
                            <>
                              <strong>{f.places_disponibles ?? 0}</strong>
                              <small>ID Pays: {f.id_pays ?? '—'}</small>
                            </>
                          )}
                        </td>

                        <td>
                          <div className="admin-formations-row-actions">
                            {f._editing ? (
                              <>
                                <button type="button" className="btn-primary" onClick={() => handleSave(f.id)}>
                                  Enregistrer
                                </button>
                                <button type="button" className="btn-secondary" onClick={() => cancelEdit(f.id)}>
                                  Annuler
                                </button>
                              </>
                            ) : (
                              <>
                                <button type="button" className="btn-secondary" onClick={() => startEdit(f.id)}>
                                  Editer
                                </button>
                                <button type="button" className="admin-formations-danger" onClick={() => handleDelete(f.id)}>
                                  Supprimer
                                </button>
                              </>
                            )}
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

      <AdminToast toast={toast} />
    </div>
  );
}
