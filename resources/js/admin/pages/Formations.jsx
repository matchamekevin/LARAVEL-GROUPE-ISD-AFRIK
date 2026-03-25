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
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import './formations.css';

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
  const [search, setSearch] = useState('');
  const [newFormation, setNewFormation] = useState(INITIAL_FORM);

  const filteredFormations = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return formations;

    return formations.filter((f) => {
      const values = [
        f.titre,
        f.description,
        f.categorie,
        f.id_formation,
        f.id,
        f.id_pays,
      ];
      return values.some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [formations, search]);

  async function loadFormations() {
    setLoading(true);
    try {
      const res = await getFormations();
      setFormations(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Erreur chargement formations', err);
      setFormations([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadFormations();
  }, []);

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
    } catch (err) {
      console.error('Erreur création formation', err);
      alert(err?.response?.data?.message || 'Erreur création formation');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette formation ?')) return;
    try {
      await deleteFormation(id);
      setFormations((prev) => prev.filter((f) => f.id !== id));
    } catch (err) {
      console.error('Erreur suppression formation', err);
      alert('Erreur suppression formation');
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
    } catch (err) {
      console.error('Erreur update formation', err);
      alert(err?.response?.data?.message || 'Erreur mise à jour formation');
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
        <span className="admin-formations-count">{filteredFormations.length} formation(s)</span>
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
            placeholder="Rechercher par titre, categorie, description, ID pays..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <Loader text="Chargement des formations..." />
        ) : filteredFormations.length === 0 ? (
          <div className="admin-formations-empty">Aucune formation trouvee.</div>
        ) : (
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
                {filteredFormations.map((f) => {
                  const image = getFirstImage(f);
                  const imageUrl = resolveFormationImageUrl(
                    f._editing ? f._image_url : image?.url,
                    getApiBase()
                  );

                  return (
                    <tr key={f.id}>
                      <td>#{f.id}</td>
                      <td>
                        <div className="admin-formations-image-cell">
                          {imageUrl ? <img src={imageUrl} alt={f._editing ? (f._image_alt || f.titre) : (image?.alt || f.titre)} /> : <span className="admin-formations-no-image">Aucune image</span>}
                          {f._editing && (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                onChange={(e) =>
                                  setFormations((prev) =>
                                    prev.map((x) => (x.id === f.id ? { ...x, _image_file: e.target.files?.[0] || null } : x))
                                  )
                                }
                              />
                              <small style={{ color: '#64748b' }}>
                                {f._image_file ? `Nouvelle image: ${f._image_file.name}` : 'Laisser vide pour conserver l image actuelle.'}
                              </small>
                              <input
                                placeholder="Texte alternatif"
                                value={f._image_alt}
                                onChange={(e) =>
                                  setFormations((prev) =>
                                    prev.map((x) => (x.id === f.id ? { ...x, _image_alt: e.target.value } : x))
                                  )
                                }
                              />
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        {f._editing ? (
                          <div className="admin-formations-edit-stack">
                            <input
                              value={f._titre}
                              onChange={(e) =>
                                setFormations((prev) =>
                                  prev.map((x) => (x.id === f.id ? { ...x, _titre: e.target.value } : x))
                                )
                              }
                            />
                            <textarea
                              rows={3}
                              value={f._description}
                              onChange={(e) =>
                                setFormations((prev) =>
                                  prev.map((x) => (x.id === f.id ? { ...x, _description: e.target.value } : x))
                                )
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
                              setFormations((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, _prix: e.target.value } : x))
                              )
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
                              setFormations((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, _categorie: e.target.value } : x))
                              )
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
                              setFormations((prev) =>
                                prev.map((x) => (x.id === f.id ? { ...x, _date_debut: e.target.value } : x))
                              )
                            }
                          />
                        ) : (
                          f.date_debut ? String(f.date_debut).slice(0, 10) : '—'
                        )}
                      </td>
                      <td>
                        <div className="admin-formations-edit-stack">
                          {f._editing ? (
                            <>
                              <input
                                type="number"
                                min="1"
                                value={f._places_disponibles}
                                onChange={(e) =>
                                  setFormations((prev) =>
                                    prev.map((x) =>
                                      x.id === f.id ? { ...x, _places_disponibles: e.target.value } : x
                                    )
                                  )
                                }
                              />
                              <input
                                type="number"
                                min="1"
                                value={f._id_pays}
                                onChange={(e) =>
                                  setFormations((prev) =>
                                    prev.map((x) => (x.id === f.id ? { ...x, _id_pays: e.target.value } : x))
                                  )
                                }
                              />
                            </>
                          ) : (
                            <>
                              <strong>{f.places_disponibles ?? 0}</strong>
                              <small>ID Pays: {f.id_pays ?? '—'}</small>
                            </>
                          )}
                        </div>
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
        )}
      </section>
    </div>
  );
}
