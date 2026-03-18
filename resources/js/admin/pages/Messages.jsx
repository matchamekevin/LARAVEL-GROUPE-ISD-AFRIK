import React, { useEffect, useState } from 'react';
import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getRevendeurDemandes,
  updateRevendeurDemandeStatus,
} from '../api';

export default function Messages() {
  const [contactMessages, setContactMessages] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);

  async function loadAll() {
    setLoading(true);
    try {
      const [contactRes, demandesRes] = await Promise.all([
        getContactMessages(),
        getRevendeurDemandes(),
      ]);
      setContactMessages(Array.isArray(contactRes.data) ? contactRes.data : []);
      setDemandes(Array.isArray(demandesRes.data) ? demandesRes.data : []);
    } catch (err) {
      console.error('Erreur chargement messages admin', err);
      setContactMessages([]);
      setDemandes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  async function handleContactStatus(id, statut) {
    try {
      await updateContactMessageStatus(id, statut);
      setContactMessages((prev) => prev.map((m) => (m.id === id ? { ...m, statut } : m)));
    } catch (err) {
      console.error(err);
      alert('Erreur mise à jour statut message');
    }
  }

  async function handleDeleteContact(id) {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteContactMessage(id);
      setContactMessages((prev) => prev.filter((m) => m.id !== id));
    } catch (err) {
      console.error(err);
      alert('Erreur suppression message');
    }
  }

  async function handleDemandeStatus(id, statut) {
    try {
      await updateRevendeurDemandeStatus(id, statut);
      setDemandes((prev) => prev.map((d) => (d.id === id ? { ...d, statut } : d)));
    } catch (err) {
      console.error(err);
      alert('Erreur mise à jour statut demande');
    }
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1 style={{ fontSize: '2rem', color: '#172243', marginBottom: '1rem' }}>Messages & Demandes</h1>

      {loading ? (
        <div>Chargement des messages...</div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Messages de contact</h2>
            {contactMessages.length === 0 ? (
              <div>Aucun message de contact.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Nom</th>
                    <th>Email</th>
                    <th>Sujet</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contactMessages.map((m) => (
                    <tr key={m.id}>
                      <td>{m.id}</td>
                      <td>{m.nom_complet}</td>
                      <td>{m.email}</td>
                      <td>{m.sujet || '—'}</td>
                      <td>{m.statut}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => handleContactStatus(m.id, 'lu')}>Marquer lu</button>
                        <button className="btn-secondary" onClick={() => handleContactStatus(m.id, 'traite')}>Traité</button>
                        <button className="btn-secondary" onClick={() => handleDeleteContact(m.id)}>Supprimer</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '1rem' }}>Demandes revendeurs</h2>
            {demandes.length === 0 ? (
              <div>Aucune demande revendeur.</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Entreprise</th>
                    <th>Email</th>
                    <th>Pays</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {demandes.map((d) => (
                    <tr key={d.id}>
                      <td>{d.id}</td>
                      <td>{d.nom_entreprise}</td>
                      <td>{d.email_professionnel}</td>
                      <td>{d.pays}</td>
                      <td>{d.statut || 'nouveau'}</td>
                      <td>
                        <button className="btn-secondary" onClick={() => handleDemandeStatus(d.id, 'en_cours')}>En cours</button>
                        <button className="btn-secondary" onClick={() => handleDemandeStatus(d.id, 'valide')}>Valider</button>
                        <button className="btn-secondary" onClick={() => handleDemandeStatus(d.id, 'rejete')}>Rejeter</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
