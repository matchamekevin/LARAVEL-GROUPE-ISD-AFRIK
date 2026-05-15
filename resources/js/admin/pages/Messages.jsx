import React, { useEffect, useMemo, useState } from 'react';
import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getRevendeurDemandes,
  updateRevendeurDemandeStatus,
} from '../api';
import { useLivePolling } from '../../hooks/useLivePolling';
import Loader from '../../components/Loader';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import '../styles/admin-shared.css';
import '../styles/messages.css';
import SearchBar from '../../components/SearchBar';

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


  const MESSAGES_PER_PAGE = 20;
  const EMPTY_PAGINATION = {
    total: 0,
    per_page: MESSAGES_PER_PAGE,
    current_page: 1,
    last_page: 1,
    from: 0,
    to: 0,
  };

  const [contactPagination, setContactPagination] = useState(EMPTY_PAGINATION);
  const [contactPage, setContactPage] = useState(1);
  const [contactSearch, setContactSearch] = useState('');
  const [contactStatusFilter, setContactStatusFilter] = useState('all');
  const [contactStats, setContactStats] = useState({ total: 0, nouveau: 0, lu: 0, traite: 0 });
  const [contactRefreshToken, setContactRefreshToken] = useState(0);

  const [demandePagination, setDemandePagination] = useState(EMPTY_PAGINATION);
  const [demandePage, setDemandePage] = useState(1);
  const [demandeSearch, setDemandeSearch] = useState('');
  const [demandeStatusFilter, setDemandeStatusFilter] = useState('all');
  const [demandeStats, setDemandeStats] = useState({ total: 0, nouveau: 0, en_cours: 0, valide: 0, rejete: 0 });
  const [demandeRefreshToken, setDemandeRefreshToken] = useState(0);

  async function loadContactMessages() {
    try {
      const params = {
        page: contactPage,
        per_page: MESSAGES_PER_PAGE,
      };

      if (contactSearch.trim() !== '') {
        params.q = contactSearch.trim();
      }

      if (contactStatusFilter !== 'all') {
        params.statut = contactStatusFilter;
      }

      const res = await getContactMessages(params);
      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && contactPage > nextMeta.last_page) {
        setContactPage(nextMeta.last_page);
        return;
      }

      setContactMessages(list);
      setContactPagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || MESSAGES_PER_PAGE),
        current_page: Number(nextMeta.current_page || contactPage),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });
      setContactStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        nouveau: Number(nextStats.nouveau || 0),
        lu: Number(nextStats.lu || 0),
        traite: Number(nextStats.traite || 0),
      });
    } catch (err) {
      console.error('Erreur chargement messages', err);
      setContactMessages([]);
      setContactPagination(EMPTY_PAGINATION);
      setContactStats({ total: 0, nouveau: 0, lu: 0, traite: 0 });
    }
  }

  async function loadDemandes() {
    try {
      const params = {
        page: demandePage,
        per_page: MESSAGES_PER_PAGE,
      };

      if (demandeSearch.trim() !== '') {
        params.q = demandeSearch.trim();
      }

      if (demandeStatusFilter !== 'all') {
        params.statut = demandeStatusFilter;
      }

      const res = await getRevendeurDemandes(params);
      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && demandePage > nextMeta.last_page) {
        setDemandePage(nextMeta.last_page);
        return;
      }

      setDemandes(list);
      setDemandePagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || MESSAGES_PER_PAGE),
        current_page: Number(nextMeta.current_page || demandePage),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });
      setDemandeStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        nouveau: Number(nextStats.nouveau || 0),
        en_cours: Number(nextStats.en_cours || 0),
        valide: Number(nextStats.valide || 0),
        rejete: Number(nextStats.rejete || 0),
      });
    } catch (err) {
      console.error('Erreur chargement demandes', err);
      setDemandes([]);
      setDemandePagination(EMPTY_PAGINATION);
      setDemandeStats({ total: 0, nouveau: 0, en_cours: 0, valide: 0, rejete: 0 });
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadContactMessages(), loadDemandes()]).finally(() => {
      setLoading(false);
    });
  }, []);

  async function handleContactStatus(id, statut) {
    try {
      await updateContactMessageStatus(id, statut);
      setContactRefreshToken((t) => t + 1);
      toastSuccess('Statut du message mis a jour.');
      notifyMutation();
    } catch (err) {
      console.error(err);
      toastError('Erreur mise a jour statut message');
    }
  }

  async function handleDeleteContact(id) {
    if (!confirm('Supprimer ce message ?')) return;
    try {
      await deleteContactMessage(id);
      setContactRefreshToken((t) => t + 1);
      toastSuccess('Message supprime.');
      notifyMutation();
    } catch (err) {
      console.error(err);
      toastError('Erreur suppression message');
    }
  }

  async function handleDemandeStatus(id, statut) {
    try {
      await updateRevendeurDemandeStatus(id, statut);
      setDemandeRefreshToken((t) => t + 1);
      toastSuccess('Statut de la demande mis a jour.');
      notifyMutation();
    } catch (err) {
      console.error(err);
      toastError('Erreur mise a jour statut demande');
    }
  }

  useEffect(() => {
    loadContactMessages();
  }, [contactPage, contactStatusFilter, contactSearch, contactRefreshToken]);

  useEffect(() => {
    loadDemandes();
  }, [demandePage, demandeStatusFilter, demandeSearch, demandeRefreshToken]);

  useLivePolling(
    () => {
      setContactRefreshToken((token) => token + 1);
      setDemandeRefreshToken((token) => token + 1);
    },
    {
      intervalMs: 3000,
      enabled: !loading,
    }
  );

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
            <strong>{contactStats.total || contactPagination.total || contactMessages.length}</strong>
          </div>
          <div>
            <span>Demandes</span>
            <strong>{demandeStats.total || demandePagination.total || demandes.length}</strong>
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
              <span className="admin-messages-counter">{contactPagination.total || contactMessages.length}</span>
            </div>

            <div className="admin-messages-filters">
              <SearchBar
                placeholder="Rechercher (nom, email, sujet, contenu...)"
                value={contactSearch}
                onChange={(e) => {
                  setContactSearch(e.target.value);
                  setContactPage(1);
                }}
                compact
              />
              <select
                value={contactStatusFilter}
                onChange={(e) => {
                  setContactStatusFilter(e.target.value);
                  setContactPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                {CONTACT_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {(contactPagination.total === 0 && contactMessages.length === 0) ? (
              <div className="admin-messages-empty">Aucun message de contact.</div>
            ) : (
              <>
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
                      {contactMessages.map((m) => (
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
                              <DeleteIconButton
                                onClick={() => handleDeleteContact(m.id)}
                                className="admin-messages-danger"
                                title="Supprimer"
                                ariaLabel={`Supprimer le message de ${m?.nom_complet || m?.email || m.id}`}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {contactMessages.length > 0 && (
                  <div className="admin-messages-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem' }}>
                    <span className="admin-messages-counter">
                      Affichage {contactPagination.from || 0}-{contactPagination.to || 0} sur {contactPagination.total || 0}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setContactPage((p) => Math.max(1, p - 1))}
                        disabled={contactPagination.current_page <= 1}
                      >
                        Précédent
                      </button>
                      <span className="admin-messages-counter">
                        Page {contactPagination.current_page} / {contactPagination.last_page}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setContactPage((p) => p + 1)}
                        disabled={contactPagination.current_page >= contactPagination.last_page}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>

          <section className="admin-messages-card">
            <div className="admin-messages-card-head">
              <h2>Demandes revendeurs</h2>
              <span className="admin-messages-counter">{demandePagination.total || demandes.length}</span>
            </div>

            <div className="admin-messages-filters">
              <SearchBar
                placeholder="Rechercher (entreprise, email, pays...)"
                value={demandeSearch}
                onChange={(e) => {
                  setDemandeSearch(e.target.value);
                  setDemandePage(1);
                }}
                compact
              />
              <select
                value={demandeStatusFilter}
                onChange={(e) => {
                  setDemandeStatusFilter(e.target.value);
                  setDemandePage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                {DEMANDE_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {(demandePagination.total === 0 && demandes.length === 0) ? (
              <div className="admin-messages-empty">Aucune demande revendeur.</div>
            ) : (
              <>
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
                      {demandes.map((d) => (
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

                {demandes.length > 0 && (
                  <div className="admin-messages-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem' }}>
                    <span className="admin-messages-counter">
                      Affichage {demandePagination.from || 0}-{demandePagination.to || 0} sur {demandePagination.total || 0}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setDemandePage((p) => Math.max(1, p - 1))}
                        disabled={demandePagination.current_page <= 1}
                      >
                        Précédent
                      </button>
                      <span className="admin-messages-counter">
                        Page {demandePagination.current_page} / {demandePagination.last_page}
                      </span>
                      <button
                        type="button"
                        className="btn-secondary"
                        onClick={() => setDemandePage((p) => p + 1)}
                        disabled={demandePagination.current_page >= demandePagination.last_page}
                      >
                        Suivant
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}


    </div>
  );
}
