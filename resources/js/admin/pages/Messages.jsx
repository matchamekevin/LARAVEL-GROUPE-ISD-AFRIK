import React, { useEffect, useState } from 'react';
import {
  getContactMessages,
  updateContactMessageStatus,
  deleteContactMessage,
  getRevendeurDemandes,
  updateRevendeurDemandeStatus,
  getDevisPrestations,
  updateDevisPrestationStatus,
  deleteDevisPrestation,
} from '../api';
import { useLivePolling } from '../../hooks/useLivePolling';
import { toastError, toastSuccess } from '../../utils/toast';
import { notifyMutation } from '../../utils/mutationBus';
import DeleteIconButton from '../components/DeleteIconButton';
import '../styles/admin-shared.css';
import '../styles/messages.css';
import SearchBar from '../../components/SearchBar';

const CONTACT_STATUSES = ['nouveau', 'lu', 'traite'];
const DEMANDE_STATUSES = ['nouveau', 'en_cours', 'valide', 'rejete'];
const DEVIS_STATUSES = ['nouveau', 'traite'];

function statusClass(status) {
  const s = String(status || 'nouveau').toLowerCase();
  if (s === 'valide' || s === 'traite' || s === 'lu') return 'is-success';
  if (s === 'rejete') return 'is-danger';
  if (s === 'en_cours') return 'is-warning';
  return 'is-neutral';
}

function statusIcon(status) {
  const s = String(status || 'nouveau').toLowerCase();
  if (s === 'lu' || s === 'traite') return 'check_circle';
  if (s === 'valide') return 'check_circle';
  if (s === 'rejete') return 'cancel';
  if (s === 'en_cours') return 'schedule';
  return 'radio_button_unchecked';
}

const STATUS_LABELS = {
  nouveau: 'Nouveau',
  lu: 'Marquer lu',
  traite: 'Traiter',
  en_cours: 'En cours',
  valide: 'Valider',
  rejete: 'Rejeter',
};

const STATUS_ICONS = {
  nouveau: 'radio_button_unchecked',
  lu: 'visibility',
  traite: 'check_circle',
  en_cours: 'schedule',
  valide: 'check_circle',
  rejete: 'cancel',
};

export default function Messages() {
  const [contactMessages, setContactMessages] = useState([]);
  const [demandes, setDemandes] = useState([]);
  const [devisPrestations, setDevisPrestations] = useState([]);
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

  const [devisPagination, setDevisPagination] = useState(EMPTY_PAGINATION);
  const [devisPage, setDevisPage] = useState(1);
  const [devisSearch, setDevisSearch] = useState('');
  const [devisStatusFilter, setDevisStatusFilter] = useState('all');
  const [devisStats, setDevisStats] = useState({ total: 0, nouveau: 0, traite: 0 });
  const [devisRefreshToken, setDevisRefreshToken] = useState(0);

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

  async function loadDevisPrestations() {
    try {
      const params = {
        page: devisPage,
        per_page: MESSAGES_PER_PAGE,
      };

      if (devisSearch.trim() !== '') {
        params.q = devisSearch.trim();
      }

      if (devisStatusFilter !== 'all') {
        params.statut = devisStatusFilter;
      }

      const res = await getDevisPrestations(params);
      const list = Array.isArray(res.data) ? res.data : [];
      const nextMeta = res.meta || EMPTY_PAGINATION;
      const nextStats = res.stats || {};

      if (nextMeta.last_page && devisPage > nextMeta.last_page) {
        setDevisPage(nextMeta.last_page);
        return;
      }

      setDevisPrestations(list);
      setDevisPagination({
        total: Number(nextMeta.total || list.length || 0),
        per_page: Number(nextMeta.per_page || MESSAGES_PER_PAGE),
        current_page: Number(nextMeta.current_page || devisPage),
        last_page: Number(nextMeta.last_page || 1),
        from: Number(nextMeta.from || 0),
        to: Number(nextMeta.to || 0),
      });
      setDevisStats({
        total: Number(nextStats.total || nextMeta.total || list.length || 0),
        nouveau: Number(nextStats.nouveau || 0),
        traite: Number(nextStats.traite || 0),
      });
    } catch (err) {
      console.error('Erreur chargement devis prestations', err);
      setDevisPrestations([]);
      setDevisPagination(EMPTY_PAGINATION);
      setDevisStats({ total: 0, nouveau: 0, traite: 0 });
    }
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([loadContactMessages(), loadDemandes(), loadDevisPrestations()]).finally(() => {
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

  async function handleDevisStatus(id, statut) {
    try {
      await updateDevisPrestationStatus(id, statut);
      setDevisRefreshToken((t) => t + 1);
      toastSuccess('Statut du devis mis a jour.');
      notifyMutation();
    } catch (err) {
      console.error(err);
      toastError('Erreur mise a jour statut devis');
    }
  }

  async function handleDeleteDevis(id) {
    if (!confirm('Supprimer cette demande de devis ?')) return;
    try {
      await deleteDevisPrestation(id);
      setDevisRefreshToken((t) => t + 1);
      toastSuccess('Demande de devis supprimee.');
      notifyMutation();
    } catch (err) {
      console.error(err);
      toastError('Erreur suppression devis');
    }
  }

  useEffect(() => {
    loadContactMessages();
  }, [contactPage, contactStatusFilter, contactSearch, contactRefreshToken]);

  useEffect(() => {
    loadDemandes();
  }, [demandePage, demandeStatusFilter, demandeSearch, demandeRefreshToken]);

  useEffect(() => {
    loadDevisPrestations();
  }, [devisPage, devisStatusFilter, devisSearch, devisRefreshToken]);

  useLivePolling(
    () => {
      setContactRefreshToken((token) => token + 1);
      setDemandeRefreshToken((token) => token + 1);
      setDevisRefreshToken((token) => token + 1);
    },
    {
      intervalMs: 3000,
      enabled: !loading,
    }
  );

  function renderStatusActions(statuses, currentStatus, onStatusChange, isDisabled) {
    return statuses
      .filter((s) => s !== currentStatus)
      .map((statut) => (
        <button
          key={statut}
          type="button"
          className="admin-bulk-icon-btn"
          onClick={() => onStatusChange(statut)}
          disabled={isDisabled}
          title={STATUS_LABELS[statut] || statut}
          aria-label={`${STATUS_LABELS[statut] || statut}`}
        >
          <span className="material-symbols-outlined">{STATUS_ICONS[statut]}</span>
        </button>
      ));
  }

  function renderTable(section, { data, columns, statuses, onStatusChange, onDelete, pagination, loading }) {
    if (pagination.total === 0 && data.length === 0) {
      return <div className="admin-messages-empty">Aucune donnee.</div>;
    }

    return (
      <>
        <div className="admin-messages-table-wrap">
          <table className="admin-messages-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th key={col.key}>{col.label}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row) => (
                <tr key={row.id}>
                  {columns.map((col) => (
                    <td key={col.key}>
                      {col.render ? col.render(row) : row[col.key] ?? '—'}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {data.length > 0 && (
          <div className="admin-messages-pagination">
            <span className="admin-messages-pagination-info">
              Affichage {pagination.from || 0}-{pagination.to || 0} sur {pagination.total || 0}
            </span>
            <div className="admin-messages-pagination-controls">
              <button
                type="button"
                className="admin-messages-pagination-btn"
                onClick={() => {
                  if (section === 'contact') setContactPage((p) => Math.max(1, p - 1));
                  if (section === 'demande') setDemandePage((p) => Math.max(1, p - 1));
                  if (section === 'devis') setDevisPage((p) => Math.max(1, p - 1));
                }}
                disabled={pagination.current_page <= 1}
              >
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_left</span>
                Precedent
              </button>
              <span className="admin-messages-pagination-info">
                Page {pagination.current_page} / {pagination.last_page}
              </span>
              <button
                type="button"
                className="admin-messages-pagination-btn"
                onClick={() => {
                  if (section === 'contact') setContactPage((p) => p + 1);
                  if (section === 'demande') setDemandePage((p) => p + 1);
                  if (section === 'devis') setDevisPage((p) => p + 1);
                }}
                disabled={pagination.current_page >= pagination.last_page}
              >
                Suivant
                <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>chevron_right</span>
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  const contactColumns = [
    { key: 'id', label: 'ID', render: (m) => `#${m.id}` },
    { key: 'nom', label: 'Nom', render: (m) => <strong>{m.nom_complet || 'Sans nom'}</strong> },
    { key: 'email', label: 'Email', render: (m) => <a href={`mailto:${m.email}`}>{m.email}</a> },
    { key: 'sujet', label: 'Sujet', render: (m) => m.sujet || '—' },
    {
      key: 'statut', label: 'Statut',
      render: (m) => (
        <span className={`admin-messages-status ${statusClass(m.statut)}`}>
          {m.statut || 'nouveau'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (m) => (
        <div className="admin-messages-actions">
          {renderStatusActions(CONTACT_STATUSES, m.statut, (statut) => handleContactStatus(m.id, statut))}
          <DeleteIconButton
            onClick={() => handleDeleteContact(m.id)}
            className="admin-bulk-icon-btn admin-bulk-icon-btn--danger"
            style={{ width: 32, height: 32 }}
            title="Supprimer"
            ariaLabel={`Supprimer le message de ${m?.nom_complet || m?.email || m.id}`}
          />
        </div>
      ),
    },
  ];

  const demandeColumns = [
    { key: 'id', label: 'ID', render: (d) => `#${d.id}` },
    { key: 'entreprise', label: 'Entreprise', render: (d) => <strong>{d.nom_entreprise || '—'}</strong> },
    { key: 'email', label: 'Email', render: (d) => <a href={`mailto:${d.email_professionnel}`}>{d.email_professionnel || '—'}</a> },
    { key: 'pays', label: 'Pays', render: (d) => d.pays || '—' },
    {
      key: 'statut', label: 'Statut',
      render: (d) => (
        <span className={`admin-messages-status ${statusClass(d.statut)}`}>
          {d.statut || 'nouveau'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (d) => (
        <div className="admin-messages-actions">
          {renderStatusActions(DEMANDE_STATUSES, d.statut, (statut) => handleDemandeStatus(d.id, statut))}
        </div>
      ),
    },
  ];

  const devisColumns = [
    { key: 'id', label: 'ID', render: (d) => `#${d.id}` },
    { key: 'prestation', label: 'Prestation', render: (d) => <strong>{d.prestation_name || '—'}</strong> },
    { key: 'slug', label: 'Slug', render: (d) => d.prestation_slug || '—' },
    {
      key: 'date', label: 'Date',
      render: (d) => d.created_at ? new Date(d.created_at).toLocaleString('fr-FR') : '—',
    },
    {
      key: 'statut', label: 'Statut',
      render: (d) => (
        <span className={`admin-messages-status ${statusClass(d.statut)}`}>
          {d.statut || 'nouveau'}
        </span>
      ),
    },
    {
      key: 'actions', label: 'Actions',
      render: (d) => (
        <div className="admin-messages-actions">
          {renderStatusActions(DEVIS_STATUSES, d.statut, (statut) => handleDevisStatus(d.id, statut))}
          <DeleteIconButton
            onClick={() => handleDeleteDevis(d.id)}
            className="admin-bulk-icon-btn admin-bulk-icon-btn--danger"
            style={{ width: 32, height: 32 }}
            title="Supprimer"
            ariaLabel={`Supprimer la demande de devis ${d?.prestation_name || d.id}`}
          />
        </div>
      ),
    },
  ];

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
          <div>
            <span>Devis</span>
            <strong>{devisStats.total || devisPagination.total || devisPrestations.length}</strong>
          </div>
        </div>
      </header>

      {(
        <>
          <section className="admin-messages-card admin-messages-card--contact">
            <div className="admin-messages-card-head">
              <div className="admin-messages-card-head-left">
                <span className="admin-messages-card-icon admin-messages-card-icon--contact material-symbols-outlined">mail</span>
                <h2>Messages de contact</h2>
              </div>
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

            {renderTable('contact', {
              data: contactMessages,
              columns: contactColumns,
              pagination: contactPagination,
              loading,
            })}
          </section>

          <section className="admin-messages-card admin-messages-card--demande">
            <div className="admin-messages-card-head">
              <div className="admin-messages-card-head-left">
                <span className="admin-messages-card-icon admin-messages-card-icon--demande material-symbols-outlined">store</span>
                <h2>Demandes revendeurs</h2>
              </div>
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

            {renderTable('demande', {
              data: demandes,
              columns: demandeColumns,
              pagination: demandePagination,
              loading,
            })}
          </section>

          <section className="admin-messages-card admin-messages-card--devis">
            <div className="admin-messages-card-head">
              <div className="admin-messages-card-head-left">
                <span className="admin-messages-card-icon admin-messages-card-icon--devis material-symbols-outlined">description</span>
                <h2>Demandes de devis prestations</h2>
              </div>
              <span className="admin-messages-counter">{devisPagination.total || devisPrestations.length}</span>
            </div>

            <div className="admin-messages-filters">
              <SearchBar
                placeholder="Rechercher (nom prestation, slug...)"
                value={devisSearch}
                onChange={(e) => {
                  setDevisSearch(e.target.value);
                  setDevisPage(1);
                }}
                compact
              />
              <select
                value={devisStatusFilter}
                onChange={(e) => {
                  setDevisStatusFilter(e.target.value);
                  setDevisPage(1);
                }}
              >
                <option value="all">Tous les statuts</option>
                {DEVIS_STATUSES.map((status) => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>

            {renderTable('devis', {
              data: devisPrestations,
              columns: devisColumns,
              pagination: devisPagination,
              loading,
            })}
          </section>
        </>
      )}


    </div>
  );
}
