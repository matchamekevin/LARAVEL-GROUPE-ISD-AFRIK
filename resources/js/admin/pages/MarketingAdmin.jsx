import React, { useEffect, useState } from 'react';
import {
  getNewsletterList,
  createNewsletterEntry,
  updateNewsletterEntry,
  deleteNewsletterEntry,
  getCommentairesAdmin,
  deleteCommentaireAdmin,
} from '../api';
import Loader from '../components/Loader';

export default function MarketingAdmin() {
  const [newsletter, setNewsletter] = useState([]);
  const [commentaires, setCommentaires] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newEmail, setNewEmail] = useState('');

  async function loadData() {
    setLoading(true);
    try {
      const [newsRes, comRes] = await Promise.all([getNewsletterList(), getCommentairesAdmin()]);
      setNewsletter(Array.isArray(newsRes.data) ? newsRes.data : []);
      setCommentaires(Array.isArray(comRes.data) ? comRes.data : []);
    } catch (err) {
      console.error(err);
      setNewsletter([]);
      setCommentaires([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleCreateNewsletter(e) {
    e.preventDefault();
    try {
      await createNewsletterEntry(newEmail);
      setNewEmail('');
      await loadData();
    } catch (err) {
      alert(err?.response?.data?.message || 'Erreur ajout newsletter');
    }
  }

  async function handleSaveNewsletter(item) {
    try {
      await updateNewsletterEntry(item.id, item._email ?? item.email);
      await loadData();
    } catch (err) {
      alert('Erreur mise à jour newsletter');
    }
  }

  async function handleDeleteNewsletter(id) {
    if (!confirm('Supprimer cet email newsletter ?')) return;
    await deleteNewsletterEntry(id);
    setNewsletter((prev) => prev.filter((x) => x.id !== id));
  }

  async function handleDeleteComment(id) {
    if (!confirm('Supprimer ce commentaire ?')) return;
    await deleteCommentaireAdmin(id);
    setCommentaires((prev) => prev.filter((x) => x.id !== id));
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '1rem' }}>Marketing & Communauté</h1>

      <div className="card" style={{ marginBottom: '1.5rem' }}>
        <h2 style={{ marginBottom: '0.75rem' }}>Newsletter</h2>
        <form onSubmit={handleCreateNewsletter} style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
          <input type="email" placeholder="email@domaine.com" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
          <button className="btn-primary" type="submit">Ajouter</button>
        </form>

        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr><th>ID</th><th>Email</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {newsletter.map((n) => (
                <tr key={n.id}>
                  <td>{n.id}</td>
                  <td>
                    {n._editing ? (
                      <input type="email" value={n._email || ''} onChange={(e) => setNewsletter((prev) => prev.map((x) => x.id === n.id ? { ...x, _email: e.target.value } : x))} />
                    ) : n.email}
                  </td>
                  <td>
                    {n._editing ? (
                      <>
                        <button className="btn-primary" onClick={() => handleSaveNewsletter(n)}>Enregistrer</button>
                        <button className="btn-secondary" onClick={() => setNewsletter((prev) => prev.map((x) => x.id === n.id ? { ...x, _editing: false } : x))}>Annuler</button>
                      </>
                    ) : (
                      <>
                        <button className="btn-secondary" onClick={() => setNewsletter((prev) => prev.map((x) => x.id === n.id ? { ...x, _editing: true, _email: x.email } : x))}>Editer</button>
                        <button className="btn-secondary" onClick={() => handleDeleteNewsletter(n.id)}>Supprimer</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 style={{ marginBottom: '0.75rem' }}>Commentaires</h2>
        {loading ? <Loader /> : (
          <table>
            <thead>
              <tr><th>ID</th><th>Contenu</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {commentaires.map((c) => (
                <tr key={c.id_commentaire || c.id}>
                  <td>{c.id_commentaire || c.id}</td>
                  <td>{c.contenu || c.message || '—'}</td>
                  <td>
                    <button className="btn-secondary" onClick={() => handleDeleteComment(c.id_commentaire || c.id)}>Supprimer</button>
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
