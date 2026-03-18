import React, { useEffect, useState } from 'react';
import { getFormations, createFormation, updateFormation, deleteFormation } from '../api';

export default function Formations() {
  const [formations, setFormations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newFormation, setNewFormation] = useState({
    titre: '',
    description: '',
    duree: 1,
    prix: '',
    categorie: 'particulier',
    date_debut: '',
    places_disponibles: 1,
    id_pays: '',
  });

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
      await createFormation({
        ...newFormation,
        duree: Number(newFormation.duree),
        prix: Number(newFormation.prix),
        places_disponibles: Number(newFormation.places_disponibles),
        id_pays: Number(newFormation.id_pays),
      });
      setNewFormation({
        titre: '',
        description: '',
        duree: 1,
        prix: '',
        categorie: 'particulier',
        date_debut: '',
        places_disponibles: 1,
        id_pays: '',
      });
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
            }
          : f
      )
    );
  }

  function cancelEdit(id) {
    setFormations((prev) => prev.map((f) => (f.id === id ? { ...f, _editing: false } : f)));
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '1rem' }}>Gestion des Formations</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '1rem' }}>Créer une formation</h2>
        <form onSubmit={handleCreate} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem' }}>
          <input placeholder="Titre" value={newFormation.titre} onChange={(e) => setNewFormation({ ...newFormation, titre: e.target.value })} required />
          <input placeholder="Prix" type="number" value={newFormation.prix} onChange={(e) => setNewFormation({ ...newFormation, prix: e.target.value })} required />
          <input placeholder="Durée (jours)" type="number" value={newFormation.duree} onChange={(e) => setNewFormation({ ...newFormation, duree: e.target.value })} required />
          <input placeholder="Places" type="number" value={newFormation.places_disponibles} onChange={(e) => setNewFormation({ ...newFormation, places_disponibles: e.target.value })} required />
          <input placeholder="ID Pays" type="number" value={newFormation.id_pays} onChange={(e) => setNewFormation({ ...newFormation, id_pays: e.target.value })} required />
          <select value={newFormation.categorie} onChange={(e) => setNewFormation({ ...newFormation, categorie: e.target.value })}>
            <option value="particulier">Particulier</option>
            <option value="etudiant">Etudiant</option>
            <option value="entreprise">Entreprise</option>
          </select>
          <input type="date" value={newFormation.date_debut} onChange={(e) => setNewFormation({ ...newFormation, date_debut: e.target.value })} required />
          <input placeholder="Description" value={newFormation.description} onChange={(e) => setNewFormation({ ...newFormation, description: e.target.value })} required />
          <button type="submit" className="btn-primary" disabled={saving} style={{ gridColumn: 'span 4' }}>
            {saving ? 'Création...' : 'Créer la formation'}
          </button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <div>Chargement des formations...</div>
        ) : formations.length === 0 ? (
          <div>Aucune formation.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Titre</th>
                <th>Prix</th>
                <th>Catégorie</th>
                <th>Date début</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {formations.map((f) => (
                <tr key={f.id}>
                  <td>{f.id}</td>
                  <td>
                    {f._editing ? (
                      <input value={f._titre} onChange={(e) => setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _titre: e.target.value } : x)))} />
                    ) : (
                      f.titre
                    )}
                  </td>
                  <td>
                    {f._editing ? (
                      <input type="number" value={f._prix} onChange={(e) => setFormations((prev) => prev.map((x) => (x.id === f.id ? { ...x, _prix: e.target.value } : x)))} />
                    ) : (
                      f.prix
                    )}
                  </td>
                  <td>{f.categorie}</td>
                  <td>{f.date_debut ? String(f.date_debut).slice(0, 10) : '—'}</td>
                  <td>
                    {f._editing ? (
                      <>
                        <button className="btn-primary" onClick={() => handleSave(f.id)}>Enregistrer</button>
                        <button className="btn-secondary" onClick={() => cancelEdit(f.id)}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary" onClick={() => startEdit(f.id)}>Editer</button>
                        <button className="btn-secondary" onClick={() => handleDelete(f.id)}>Supprimer</button>
                      </>
                    )}
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
