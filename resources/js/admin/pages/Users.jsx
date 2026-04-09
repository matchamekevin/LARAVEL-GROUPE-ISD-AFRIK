import React, { useEffect, useState } from 'react';
import { createAdminAdjoint, getCountries, getUsers, me, updateUser, updateUserStatus } from '../api';
import AdminToast, { useAdminToast } from '../components/AdminToast';
import AdminNotice from '../components/AdminNotice';
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import '../styles/users.css';

import { ROLE_LABELS, normalizeRole } from '../utils/roles';

const INITIAL_ADMIN_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  id_pays: '',
  can_access_client: false,
  two_factor_enabled: true,
};

const USERS_PER_PAGE = 20;
const EMPTY_PAGINATION = {
  total: 0,
  per_page: USERS_PER_PAGE,
  current_page: 1,
  last_page: 1,
  from: 0,
  to: 0,
};

const EMPTY_STATS = {
  total: 0,
  active: 0,
  suspended: 0,
};

function normalizeAdminLevel(value) {
  const level = String(value || 'client').toLowerCase().trim();
  if (['superadmin', 'super-admin'].includes(level)) return 'superadmin';
  if (['admin', 'admin_pays', 'admin_national', 'admin_adjoint'].includes(level)) return 'admin_adjoint';
  return 'client';
}

function deriveAdminLevel(user = {}) {
  const explicitLevel = normalizeAdminLevel(user?.admin_level || user?.admin_role || user?.role || 'client');
  if (explicitLevel === 'superadmin' && Boolean(user?.is_admin) && Boolean(user?.can_access_admin)) {
    return 'superadmin';
  }

  if (Boolean(user?.is_admin) && Boolean(user?.can_access_admin)) {
    return explicitLevel === 'superadmin' ? 'superadmin' : 'admin_adjoint';
  }

  return 'client';
}

function mergeUserState(baseUser, updatedUser = {}) {
  const merged = {
    ...baseUser,
    ...updatedUser,
    id: updatedUser?.id ?? updatedUser?.id_utilisateur ?? baseUser?.id,
    admin_role: updatedUser?.admin_role ?? baseUser?.admin_role,
    is_admin: updatedUser?.is_admin ?? baseUser?.is_admin ?? false,
    can_access_client: updatedUser?.can_access_client ?? baseUser?.can_access_client ?? false,
    can_access_admin: updatedUser?.can_access_admin ?? baseUser?.can_access_admin ?? false,
    statut: updatedUser?.statut ?? baseUser?.statut ?? 'actif',
  };

  const adminLevel = deriveAdminLevel(merged);

  return {
    ...merged,
    admin_level: adminLevel,
    role: adminLevel,
    is_super_admin: adminLevel === 'superadmin',
    is_admin_adjoint: adminLevel === 'admin_adjoint',
  };
}

function shouldInvalidateSelfAdminSession(user) {
  const adminLevel = deriveAdminLevel(user);
  return !user
    || String(user?.statut || '').toLowerCase() !== 'actif'
    || !Boolean(user?.is_admin)
    || !Boolean(user?.can_access_admin)
    || adminLevel === 'client';
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [stats, setStats] = useState(EMPTY_STATS);
  const [countries, setCountries] = useState([]);
  const [actorUser, setActorUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [toggling, setToggling] = useState(null);
  const [accessUpdating, setAccessUpdating] = useState(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [accessDrafts, setAccessDrafts] = useState({});
  const [errorMessage, setErrorMessage] = useState('');
  const [phoneError, setPhoneError] = useState(null);
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);
  const [refreshToken, setRefreshToken] = useState(0);
  const { toast, showToast } = useAdminToast();

  const actorId = actorUser?.id ?? actorUser?.id_utilisateur ?? null;
  const actorRole = deriveAdminLevel(actorUser || {});
  const actorIsSuperAdmin = actorRole === 'superadmin';

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([me(), getCountries()])
      .then(([meRes, countriesRes]) => {
        if (!mounted) return;

        if (meRes.status === 'fulfilled') {
          const profile = meRes.value?.data || null;
          setActorUser(profile);
          setAdminForm((previous) => ({
            ...previous,
            id_pays: previous.id_pays || String(profile?.id_pays || ''),
          }));
        }

        if (countriesRes.status === 'fulfilled') {
          const list = Array.isArray(countriesRes.value.data) ? countriesRes.value.data : [];
          setCountries(list);
        }
      })
      .catch(() => {
        // handled below by the users loader / empty states
      });

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadUsers() {
      setLoading(true);
      setErrorMessage('');

      try {
        const params = {
          page,
          per_page: USERS_PER_PAGE,
        };

        const trimmedSearch = search.trim();
        if (trimmedSearch !== '') {
          params.q = trimmedSearch;
        }

        const res = await getUsers(params);

        if (!mounted) return;

        const list = Array.isArray(res.data) ? res.data : [];
        const nextMeta = res.meta || EMPTY_PAGINATION;
        const nextStats = res.stats || EMPTY_STATS;

        if (nextMeta.last_page && page > nextMeta.last_page) {
          setPage(nextMeta.last_page);
          return;
        }

        setUsers(list.map((item) => mergeUserState(item, item)));
        setPagination({
          total: Number(nextMeta.total || list.length || 0),
          per_page: Number(nextMeta.per_page || USERS_PER_PAGE),
          current_page: Number(nextMeta.current_page || page),
          last_page: Number(nextMeta.last_page || 1),
          from: Number(nextMeta.from || 0),
          to: Number(nextMeta.to || 0),
        });
        setStats({
          total: Number(nextStats.total || nextMeta.total || list.length || 0),
          active: Number(nextStats.active || 0),
          suspended: Number(nextStats.suspended || 0),
        });
      } catch (err) {
        if (!mounted) return;
        setUsers([]);
        setPagination(EMPTY_PAGINATION);
        setStats(EMPTY_STATS);
        setErrorMessage('Impossible de charger les utilisateurs pour le moment.');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadUsers();

    return () => {
      mounted = false;
    };
  }, [search, page, refreshToken]);

  const activeCount = stats.active;
  const suspendedCount = stats.suspended;
  const totalUsers = stats.total || pagination.total || users.length;

  const reloadUsers = () => {
    setRefreshToken((previous) => previous + 1);
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    setPage(1);
    setSearch(searchInput.trim());
  };

  const handleSearchReset = () => {
    setSearchInput('');
    setPage(1);
    setSearch('');
  };

  const applySelfUpdate = async (nextUser) => {
    if (Number(nextUser?.id ?? nextUser?.id_utilisateur) !== Number(actorId)) {
      return;
    }

    if (!shouldInvalidateSelfAdminSession(nextUser)) {
      setActorUser(nextUser);
      return;
    }

    try {
      const res = await me();
      setActorUser(res?.data || nextUser);
    } catch (err) {
      // L'intercepteur global gère déjà la déconnexion si la session admin n'est plus valide.
    }
  };

  async function handleToggleStatus(selectedUser) {
    const current = String(selectedUser.statut || 'actif').toLowerCase();
    const nextStatus = current === 'suspendu' ? 'actif' : 'suspendu';
    const actionText = nextStatus === 'suspendu' ? 'Suspendre' : 'Réactiver';

    setToggling(selectedUser.id);
    try {
      const res = await updateUserStatus(selectedUser.id, nextStatus);
      const updated = res?.data?.utilisateur || { statut: nextStatus };
      const nextUser = mergeUserState(selectedUser, updated);

      await applySelfUpdate(nextUser);
      showToast(`✅ ${actionText} effectué. Email envoyé à ${selectedUser.email}`, 'success');
      reloadUsers();
    } catch (err) {
      console.error('Toggle user status error', err);
      showToast('❌ Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setToggling(null);
    }
  }

  // Remplacé par handleApplyAccess qui gère les flags can_access_admin et admin_role

  async function handleApplyAccess(selectedUser) {
    const draft = accessDrafts[selectedUser.id] || {
      can_access_client: Boolean(selectedUser.can_access_client),
      can_access_admin: Boolean(selectedUser.can_access_admin),
      is_admin_adjoint: Boolean(selectedUser.is_admin_adjoint),
      is_super_admin: Boolean(selectedUser.is_super_admin),
    };

    const unchanged = Boolean(selectedUser.can_access_client) === Boolean(draft.can_access_client)
      && Boolean(selectedUser.can_access_admin) === Boolean(draft.can_access_admin)
      && Boolean(selectedUser.is_admin_adjoint) === Boolean(draft.is_admin_adjoint)
      && Boolean(selectedUser.is_super_admin) === Boolean(draft.is_super_admin);
    if (unchanged) return;

    const status = (!draft.can_access_client && !draft.can_access_admin) ? 'suspendu' : 'actif';

    setAccessUpdating(selectedUser.id);
    try {
      const payload = {
        can_access_client: draft.can_access_client,
        can_access_admin: draft.can_access_admin,
        statut: status,
      };

      if (typeof draft.is_admin_adjoint !== 'undefined') payload.is_admin_adjoint = draft.is_admin_adjoint;
      if (typeof draft.is_super_admin !== 'undefined') payload.is_super_admin = draft.is_super_admin;

      const res = await updateUser(selectedUser.id, payload);

      const updated = res?.data?.utilisateur || {
        can_access_client: draft.can_access_client,
        can_access_admin: draft.can_access_admin,
        statut: status,
        is_admin_adjoint: draft.is_admin_adjoint,
        is_super_admin: draft.is_super_admin,
      };

      const nextUser = mergeUserState(selectedUser, updated);

      setAccessDrafts((previous) => {
        const next = { ...previous };
        delete next[selectedUser.id];
        return next;
      });

      await applySelfUpdate(nextUser);
      showToast(`✅ Accès mis à jour pour ${selectedUser.email}`, 'success');
      reloadUsers();
    } catch (err) {
      console.error('Access update error', err);
      showToast(err?.response?.data?.message || '❌ Erreur lors de la mise à jour des accès', 'error');
    } finally {
      setAccessUpdating(null);
    }
  }

  async function handleCreateAdminAdjoint(event) {
    event.preventDefault();
    setCreatingAdmin(true);

    try {
      // Valider / normaliser le téléphone selon le pays sélectionné
      const idPaysForValidation = adminForm.id_pays || actorUser?.id_pays || '';
      let payload = { ...adminForm };
      if (payload.telephone) {
        const normalized = normalizePhoneForCountry(payload.telephone, idPaysForValidation);
        if (!normalized) {
          setPhoneError('Numéro invalide pour le pays sélectionné. Exemple attendu: +22890123456');
          setCreatingAdmin(false);
          return;
        }
        payload.telephone = normalized;
      }

      const res = await createAdminAdjoint(payload);
      const created = res?.data?.utilisateur;
      setAdminForm((previous) => ({
        ...INITIAL_ADMIN_FORM,
        id_pays: previous.id_pays || String(actorUser?.id_pays || ''),
        two_factor_enabled: true,
      }));

      showToast(`✅ Admin adjoint créé. Email envoyé à ${created?.email || adminForm.email}`, 'success');
      reloadUsers();
    } catch (err) {
      console.error('Create admin adjoint error', err);
      showToast(err?.response?.data?.message || '❌ Impossible de créer le compte admin adjoint', 'error');
    } finally {
      setCreatingAdmin(false);
    }
  }

  function normalizePhoneForCountry(raw, idPays) {
    if (!raw) return null;
    const digits = String(raw).replace(/\D/g, '');
    if (!digits) return null;

    const countriesMap = (countries || []).reduce((acc, c) => {
      acc[String(c.id)] = c;
      return acc;
    }, {});

    const country = countriesMap[String(idPays)];
    const expectedLengths = { '225': 8, '226': 8, '228': 8, '229': 8, '227': 8 };

    let d = digits;
    if (d.startsWith('00')) d = d.slice(2);

    if (country && country.code) {
      const codeDigits = String(country.code).replace(/\D/g, '');
      const expected = expectedLengths[codeDigits] || 8;

      if (d.startsWith(codeDigits)) {
        d = d.slice(codeDigits.length);
      } else if (d.length === expected + 1 && d.startsWith('0')) {
        d = d.slice(1);
      } else if (d.length === expected) {
        // ok
      } else {
        return null;
      }

      if (d.length !== expected) return null;
      return `+${codeDigits}${d}`;
    }

    // Fallback: accept generic between 8 and 15 digits
    if (d.length >= 8 && d.length <= 15) return `+${d}`;
    return null;
  }

  if (loading) {
    return <Loader text="Chargement des utilisateurs..." />;
  }

  const visibleUsers = (users || []).filter((uu) => {
    try {
      return actorIsSuperAdmin || normalizeRole(uu.role || uu.admin_role) !== 'superadmin';
    } catch (e) {
      return true;
    }
  });
  return (
    <div className="admin-users-page">
      <div className="admin-users-hero">
        <div className="admin-hero-content">
          <h1 style={{ color: '#ffffff' }}>👥 Gestion des Utilisateurs</h1>
          <p>
            Les rôles et accès sont pilotés depuis la base de données. Toute modification coupe les sessions du compte ciblé,
            et un email détaille ce qui a été retiré ainsi que ce qui lui reste.
          </p>
          {!actorIsSuperAdmin && (
            <p className="admin-users-note">
              En mode admin adjoint, les comptes super admin sont masqués automatiquement.
            </p>
          )}
        </div>
        {totalUsers > 0 && (
          <div className="admin-users-stats">
            <div className="admin-users-stat">
              <span>Total</span>
              <strong>{totalUsers}</strong>
            </div>
            <div className="admin-users-stat">
              <span>Actifs</span>
              <strong>{activeCount}</strong>
            </div>
            <div className="admin-users-stat">
              <span>Suspendus</span>
              <strong>{suspendedCount}</strong>
            </div>
          </div>
        )}
      </div>

      <AdminNotice type="error" message={errorMessage} className="admin-users-notice" />

      {actorIsSuperAdmin && (
        <div className="admin-users-create-card">
          <div className="admin-users-list-card-header">
            <div>
              <h2>Créer un admin adjoint</h2>
              <span className="admin-users-list-card-count">
                Le compte est enregistré en DB et reçoit ses identifiants par email.
              </span>
            </div>
          </div>

          <form className="admin-users-create-form" onSubmit={handleCreateAdminAdjoint}>
            <input
              className="admin-user-role-select"
              type="text"
              placeholder="Nom"
              value={adminForm.nom}
              onChange={(e) => setAdminForm((previous) => ({ ...previous, nom: e.target.value }))}
              required
            />
            <input
              className="admin-user-role-select"
              type="text"
              placeholder="Prénom"
              value={adminForm.prenom}
              onChange={(e) => setAdminForm((previous) => ({ ...previous, prenom: e.target.value }))}
              required
            />
            <input
              className="admin-user-role-select"
              type="email"
              placeholder="Email"
              value={adminForm.email}
              onChange={(e) => setAdminForm((previous) => ({ ...previous, email: e.target.value }))}
              required
            />
            <input
              className="admin-user-role-select"
              type="text"
              placeholder="Téléphone"
              value={adminForm.telephone}
              onChange={(e) => {
                setPhoneError(null);
                setAdminForm((previous) => ({ ...previous, telephone: e.target.value }));
              }}
            />
            {phoneError && (
              <div style={{ color: '#DC2626', fontSize: '0.9rem' }}>{phoneError}</div>
            )}

            {countries.length > 0 ? (
              <select
                className="admin-user-role-select"
                value={adminForm.id_pays}
                onChange={(e) => setAdminForm((previous) => ({ ...previous, id_pays: e.target.value }))}
                required
              >
                <option value="">Choisir un pays</option>
                {countries.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.nom}
                  </option>
                ))}
              </select>
            ) : (
              <input
                className="admin-user-role-select"
                type="number"
                min="1"
                placeholder="ID pays"
                value={adminForm.id_pays}
                onChange={(e) => setAdminForm((previous) => ({ ...previous, id_pays: e.target.value }))}
                required
              />
            )}

            <div className="admin-users-create-actions">
              <label className="admin-user-access-check">
                <input
                  type="checkbox"
                  checked={adminForm.can_access_client}
                  onChange={(e) => setAdminForm((previous) => ({ ...previous, can_access_client: e.target.checked }))}
                />
                Lui laisser aussi l'acces client
              </label>
              <label className="admin-user-access-check">
                <input
                  type="checkbox"
                  checked={adminForm.two_factor_enabled}
                  onChange={(e) => setAdminForm((previous) => ({ ...previous, two_factor_enabled: e.target.checked }))}
                />
                Activer le 2FA
              </label>
              <button type="submit" className="admin-user-action-btn reactivate" disabled={creatingAdmin}>
                {creatingAdmin ? '⏳ Création...' : "Creer l'admin adjoint"}
              </button>
            </div>
          </form>
        </div>
      )}

      {visibleUsers.length === 0 ? (
        <div className="admin-users-empty">
          <div className="admin-users-empty-icon">👥</div>
          <h3>Aucun utilisateur trouvé</h3>
          <p>Aucun utilisateur n'est actuellement enregistré sur la plateforme.</p>
        </div>
      ) : (
        <>
          <form className="admin-users-search" onSubmit={handleSearchSubmit}>
            <div className="admin-users-search-input">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
            <div className="admin-users-search-actions" style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="admin-user-action-btn reactivate">
                Rechercher
              </button>
              <button type="button" className="admin-user-action-btn suspend" onClick={handleSearchReset}>
                Réinitialiser
              </button>
            </div>
          </form>

          <div className="admin-users-list-card">
            <div className="admin-users-list-card-header">
              <h2>Liste des Utilisateurs</h2>
              <span className="admin-users-list-card-count">
                {totalUsers} utilisateur{totalUsers > 1 ? 's' : ''}
              </span>
            </div>

            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Acces</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleUsers.map((u) => {
                    const isTargetSuperAdmin = normalizeRole(u.role || u.admin_role) === 'superadmin';
                    const actorIsAdjoint = actorRole === 'admin_adjoint';
                    const cannotManageSuperAdmin = isTargetSuperAdmin && actorIsAdjoint && !actorIsSuperAdmin;

                    return (
                      <tr key={u.id}>
                        <td>
                          <span className="admin-user-id">#{u.id}</span>
                        </td>

                        <td>
                          <div className="admin-user-info">
                            <span className="admin-user-name">
                              {u.prenom} {u.nom}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className="admin-user-email">{u.email}</span>
                        </td>

                        {/* Role column removed — accès gérés via cases à cocher ci-dessous */}

                        <td>
                          <div className="admin-user-role-cell">
                              <div className="admin-user-role-controls">
                                <label className="admin-user-access-check">
                                  <input
                                    type="checkbox"
                                    checked={(accessDrafts[u.id]?.can_access_client ?? Boolean(u.can_access_client))}
                                    onChange={(e) => setAccessDrafts((previous) => ({
                                      ...previous,
                                      [u.id]: {
                                        ...(previous[u.id] || {}),
                                        can_access_client: e.target.checked,
                                      },
                                    }))}
                                    disabled={accessUpdating === u.id || cannotManageSuperAdmin}
                                  />
                                  Client
                                </label>
                                <label className="admin-user-access-check">
                                  <input
                                    type="checkbox"
                                    checked={(accessDrafts[u.id]?.can_access_admin ?? Boolean(u.can_access_admin))}
                                    onChange={(e) => setAccessDrafts((previous) => ({
                                      ...previous,
                                      [u.id]: {
                                        ...(previous[u.id] || {}),
                                        can_access_admin: e.target.checked,
                                      },
                                    }))}
                                    disabled={accessUpdating === u.id || cannotManageSuperAdmin}
                                  />
                                  Super admin
                                </label>

                                <label className="admin-user-access-check">
                                  <input
                                    type="checkbox"
                                    checked={Boolean(accessDrafts[u.id]?.is_admin_adjoint ?? u.is_admin_adjoint)}
                                    onChange={(e) => setAccessDrafts((previous) => ({
                                      ...previous,
                                      [u.id]: {
                                        ...(previous[u.id] || {}),
                                        is_admin_adjoint: e.target.checked,
                                      },
                                    }))}
                                    disabled={accessUpdating === u.id || cannotManageSuperAdmin || !actorIsSuperAdmin}
                                  />
                                  Admin adjoint
                                </label>

                                {actorIsSuperAdmin && (
                                  <label className="admin-user-access-check">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(accessDrafts[u.id]?.is_super_admin ?? u.is_super_admin)}
                                      onChange={(e) => setAccessDrafts((previous) => ({
                                        ...previous,
                                        [u.id]: {
                                          ...(previous[u.id] || {}),
                                          is_super_admin: e.target.checked,
                                        },
                                      }))}
                                      disabled={accessUpdating === u.id || cannotManageSuperAdmin}
                                    />
                                    Super admin (rôle)
                                  </label>
                                )}
                              </div>
                              <button
                                type="button"
                                className="admin-user-action-btn reactivate"
                                onClick={() => handleApplyAccess(u)}
                                disabled={
                                  cannotManageSuperAdmin
                                  || accessUpdating === u.id
                                  || (
                                    Boolean(u.can_access_client) === Boolean(accessDrafts[u.id]?.can_access_client ?? u.can_access_client)
                                    && Boolean(u.can_access_admin) === Boolean(accessDrafts[u.id]?.can_access_admin ?? u.can_access_admin)
                                    && Boolean(u.is_admin_adjoint) === Boolean(accessDrafts[u.id]?.is_admin_adjoint ?? u.is_admin_adjoint)
                                    && Boolean(u.is_super_admin) === Boolean(accessDrafts[u.id]?.is_super_admin ?? u.is_super_admin)
                                  )
                                }
                                title="Appliquer les acces client/admin"
                              >
                                {accessUpdating === u.id ? '⏳ En cours...' : 'Appliquer'}
                              </button>
                          </div>
                        </td>

                        <td>
                          <span className={`admin-user-status ${String(u.statut || 'actif').toLowerCase()}`}>
                            {String(u.statut || 'actif').replace(/_/g, ' ')}
                          </span>
                        </td>

                        <td>
                          <div className="admin-user-actions">
                            <button
                              className={`admin-user-action-btn ${
                                String(u.statut || '').toLowerCase() === 'suspendu' ? 'reactivate' : 'suspend'
                              }`}
                              onClick={() => handleToggleStatus(u)}
                              disabled={toggling === u.id || cannotManageSuperAdmin}
                              title={String(u.statut || '').toLowerCase() === 'suspendu'
                                ? 'Réactiver ce compte et envoyer un email'
                                : 'Suspendre ce compte et envoyer un email'}
                            >
                              {toggling === u.id ? '⏳ Mise à jour...' : (
                                String(u.statut || '').toLowerCase() === 'suspendu' ? '✓ Réactiver' : '✕ Suspendre'
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {visibleUsers.length === 0 && (
                    <tr>
                      <td colSpan="6" className="admin-users-empty-cell">
                        Aucun résultat pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="admin-users-pagination" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', padding: '1rem 1.25rem 1.25rem' }}>
              <span className="admin-users-list-card-count">
                Affichage {pagination.from || 0}-{pagination.to || 0} sur {pagination.total || 0}
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="admin-user-action-btn suspend"
                  onClick={() => setPage((previous) => Math.max(1, previous - 1))}
                  disabled={loading || pagination.current_page <= 1}
                >
                  Précédent
                </button>
                <span className="admin-users-list-card-count">
                  Page {pagination.current_page} / {pagination.last_page}
                </span>
                <button
                  type="button"
                  className="admin-user-action-btn reactivate"
                  onClick={() => setPage((previous) => previous + 1)}
                  disabled={loading || pagination.current_page >= pagination.last_page}
                >
                  Suivant
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      <AdminToast toast={toast} />
    </div>
  );
}
