import React, { useEffect, useMemo, useState } from 'react';
import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getRevendeurDemandes,
  updateRevendeurDemandeStatus,
} from '../api';
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import './messages.css';

const CONTACT_STATUSES = ['nouveau', 'lu', 'traite'];
const DEMANDE_STATUSES = ['nouveau', 'en_cours', 'valide', 'rejete'];

function statusClass(status) {
  const s = String(status || 'nouveau').toLowerCase();
  if (s === 'valide' || s === 'traite' || s === 'lu') return 'is-success';
  if (s === 'rejete') return 'is-danger';
  if (s === 'en_cours') return 'is-warning';
  return 'is-neutral';
}

export default function Messages() {
  const [contactMessages, setContactMessages] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');
  const [demandeSearch, setDemandeSearch] = useState('');
  const [demandeStatusFilter, setDemandeStatusFilter] = useState('all');

  const filteredContactMessages = useMemo(() => {
    const q = contactSearch.trim().toLowerCase();
    return contactMessages.filter((m) => {
      const status = String(m.statut || 'nouveau').toLowerCase();
      const statusOk = contactStatusFilter === 'all' || status === contactStatusFilter;
      if (!statusOk) return false;
      if (!q) return true;

      const values = [m.nom_complet, m.email, m.sujet, m.message, m.statut, m.id];
      return values.some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [contactMessages, contactSearch, contactStatusFilter]);

  const filteredDemandes = useMemo(() => {
    const q = demandeSearch.trim().toLowerCase();
    return demandes.filter((d) => {
      const status = String(d.statut || 'nouveau').toLowerCase();
      const statusOk = demandeStatusFilter === 'all' || status === demandeStatusFilter;
      if (!statusOk) return false;
      if (!q) return true;

      const values = [d.nom_entreprise, d.email_professionnel, d.pays, d.statut, d.id];
      return values.some((v) => String(v || '').toLowerCase().includes(q));
    });
  }, [demandes, demandeSearch, demandeStatusFilter]);

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
    <div className="admin-messages-page">
      <header className="admin-messages-hero">
        <div>
          <h1>Messages & Demandes</h1>
          <p>
            Gere les messages de contact et les demandes revendeurs depuis une seule interface claire.
          </p>
        </div>
        <div className="admin-messages-kpis">
          <div>
            <span>Messages</span>
            <strong>{contactMessages.length}</strong>
          </div>
          <div>
            <span>Demandes</span>
            <strong>{demandes.length}</strong>
          </div>
        </div>
      </header>

      {loading ? (
        <Loader text="Chargement des messages..." />
      ) : (
        <>
          <section className="admin-messages-card">
            <div className="admin-messages-card-head">
              <h2>Messages de contact</h2>
              <span className="admin-messages-counter">{filteredContactMessages.length}</span>
            </div>

            <div className="admin-messages-filters">
              <input
                placeholder="Rechercher (nom, email, sujet, contenu...)"
                value={contactSearch}
                onChange={(e) => setContactSearch(e.target.value)}
              />
              <select
                value={contactStatusFilter}
                onChange={(e) => setContactStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {filteredContactMessages.length === 0 ? (
              <div className="admin-messages-empty">Aucun message de contact.</div>
            ) : (
              <div className="admin-messages-table-wrap">
              <table className="admin-messages-table">
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
                  {filteredContactMessages.map((m) => (
                    <tr key={m.id}>
                      <td>#{m.id}</td>
                      <td>
                        <strong>{m.nom_complet || 'Sans nom'}</strong>
                      </td>
                      <td>
                        <a href={`mailto:${m.email}`}>{m.email}</a>
                      </td>
                      <td>{m.sujet || '—'}</td>
                      <td>
                        <span className={`admin-messages-status ${statusClass(m.statut)}`}>
                          {m.statut || 'nouveau'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-messages-actions">
                          {CONTACT_STATUSES.map((statut) => (
                            <button
                              key={statut}
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleContactStatus(m.id, statut)}
                            >
                              {statut === 'lu' ? 'Marquer lu' : statut === 'traite' ? 'Traiter' : 'Nouveau'}
                            </button>
                          ))}
                          <button type="button" className="admin-messages-danger" onClick={() => handleDeleteContact(m.id)}>
                            Supprimer
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </section>

          <section className="admin-messages-card">
            <div className="admin-messages-card-head">
              <h2>Demandes revendeurs</h2>
              <span className="admin-messages-counter">{filteredDemandes.length}</span>
            </div>

            <div className="admin-messages-filters">
              <input
                placeholder="Rechercher (entreprise, email, pays...)"
                value={demandeSearch}
                onChange={(e) => setDemandeSearch(e.target.value)}
              />
              <select
                value={demandeStatusFilter}
                onChange={(e) => setDemandeStatusFilter(e.target.value)}
              >
                <option value="all">Tous les statuts</option>
                {DEMANDE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {filteredDemandes.length === 0 ? (
              <div className="admin-messages-empty">Aucune demande revendeur.</div>
            ) : (
              <div className="admin-messages-table-wrap">
              <table className="admin-messages-table">
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
                  {filteredDemandes.map((d) => (
                    <tr key={d.id}>
                      <td>#{d.id}</td>
                      <td>
                        <strong>{d.nom_entreprise || '—'}</strong>
                      </td>
                      <td>
                        <a href={`mailto:${d.email_professionnel}`}>{d.email_professionnel || '—'}</a>
                      </td>
                      <td>{d.pays}</td>
                      <td>
                        <span className={`admin-messages-status ${statusClass(d.statut)}`}>
                          {d.statut || 'nouveau'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-messages-actions">
                          {DEMANDE_STATUSES.map((statut) => (
                            <button
                              key={statut}
                              type="button"
                              className="btn-secondary"
                              onClick={() => handleDemandeStatus(d.id, statut)}
                            >
                              {statut === 'en_cours' ? 'En cours' : statut === 'valide' ? 'Valider' : statut === 'rejete' ? 'Rejeter' : 'Nouveau'}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
