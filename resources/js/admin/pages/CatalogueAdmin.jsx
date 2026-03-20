import React, { useEffect, useState } from 'react';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api';
import Loader from '../components/Loader';

export default function CatalogueAdmin() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ nom: '', description: '' });

  async function loadData() {
    setLoading(true);
    try {
      const res = await getCategories();
      setCategories(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error(err);
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreate(e) {
    e.preventDefault();
    try {
      await createCategory(form);
      setForm({ nom: '', description: '' });
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur création catégorie');
    }
  }

  async function handleDelete(id) {
    if (!confirm('Supprimer cette catégorie ?')) return;
    try {
      await deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert('Erreur suppression catégorie');
    }
  }

  async function handleSave(cat) {
    try {
      await updateCategory(cat.id, {
        nom: cat._nom ?? cat.nom,
        description: cat._description ?? cat.description,
      });
      await loadData();
    } catch (err) {
      alert('Erreur mise à jour catégorie');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '1rem' }}>Catalogue - Catégories</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Créer une catégorie</h2>
        <form onSubmit={handleCreate} style={{ display: 'flex', gap: '0.75rem' }}>
          <input placeholder="Nom" value={form.nom} onChange={(e) => setForm((p) => ({ ...p, nom: e.target.value }))} required />
          <input placeholder="Description" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} />
          <button className="btn-primary" type="submit">Créer</button>
        </form>
      </div>

      <div className="card">
        {loading ? (
          <Loader />
        ) : categories.length === 0 ? (
          <div>Aucune catégorie.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Nom</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((c) => (
                <tr key={c.id}>
                  <td>{c.id}</td>
                  <td>
                    {c._editing ? (
                      <input value={c._nom} onChange={(e) => setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, _nom: e.target.value } : x))} />
                    ) : (
                      c.nom
                    )}
                  </td>
                  <td>
                    {c._editing ? (
                      <input value={c._description || ''} onChange={(e) => setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, _description: e.target.value } : x))} />
                    ) : (
                      c.description || '—'
                    )}
                  </td>
                  <td>
                    {c._editing ? (
                      <>
                        <button className="btn-primary" onClick={() => handleSave(c)}>Enregistrer</button>
                        <button className="btn-secondary" onClick={() => setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, _editing: false } : x))}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary" onClick={() => setCategories((prev) => prev.map((x) => x.id === c.id ? { ...x, _editing: true, _nom: x.nom, _description: x.description } : x))}>Editer</button>
                        <button className="btn-secondary" onClick={() => handleDelete(c.id)}>Supprimer</button>
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
