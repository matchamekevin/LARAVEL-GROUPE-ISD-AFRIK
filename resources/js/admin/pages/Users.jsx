import React, { useEffect, useMemo, useState } from 'react';
import { createAdminAdjoint, getCountries, getUsers, me, updateUser, updateUserStatus } from '../api';
import Loader from '../components/Loader';
import '../styles/admin-shared.css';
import './users.css';

const ROLE_OPTIONS = [
  { value: 'client', label: 'Client (sans role admin)' },
  { value: 'admin_adjoint', label: 'Admin adjoint' },
  { value: 'superadmin', label: 'Super admin' },
];

const ROLE_LABELS = {
  client: 'Client',
  admin: 'Admin adjoint',
  admin_pays: 'Admin adjoint',
  admin_national: 'Admin adjoint',
  admin_adjoint: 'Admin adjoint',
  superadmin: 'Super admin',
};

const INITIAL_ADMIN_FORM = {
  nom: '',
  prenom: '',
  email: '',
  telephone: '',
  id_pays: '',
  can_access_client: false,
  two_factor_enabled: true,
};

function normalizeRole(value) {
  const role = String(value || 'client');
  if (['admin', 'admin_pays', 'admin_national'].includes(role)) return 'admin_adjoint';
  return role;
}

function mergeUserState(baseUser, updatedUser = {}) {
  return {
    ...baseUser,
    ...updatedUser,
    id: updatedUser?.id ?? updatedUser?.id_utilisateur ?? baseUser?.id,
    role: normalizeRole(updatedUser?.role ?? baseUser?.role),
    admin_role: updatedUser?.admin_role ?? baseUser?.admin_role,
    is_admin: updatedUser?.is_admin ?? baseUser?.is_admin ?? false,
    can_access_client: updatedUser?.can_access_client ?? baseUser?.can_access_client ?? false,
    can_access_admin: updatedUser?.can_access_admin ?? baseUser?.can_access_admin ?? false,
    statut: updatedUser?.statut ?? baseUser?.statut ?? 'actif',
  };
}

function shouldInvalidateSelfAdminSession(user) {
  const role = normalizeRole(user?.admin_role || user?.role || 'client');
  return !user
    || String(user?.statut || '').toLowerCase() !== 'actif'
    || !Boolean(user?.is_admin)
    || !Boolean(user?.can_access_admin)
    || role === 'client';
}

export default function Users() {
  const [users, setUsers] = useState([]);
  const [countries, setCountries] = useState([]);
  const [actorUser, setActorUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(null);
  const [roleUpdating, setRoleUpdating] = useState(null);
  const [accessUpdating, setAccessUpdating] = useState(null);
  const [creatingAdmin, setCreatingAdmin] = useState(false);
  const [roleDrafts, setRoleDrafts] = useState({});
  const [accessDrafts, setAccessDrafts] = useState({});
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);

  const actorId = actorUser?.id ?? actorUser?.id_utilisateur ?? null;
  const actorRole = normalizeRole(actorUser?.admin_role || actorUser?.role || 'client');
  const actorIsSuperAdmin = actorRole === 'superadmin';

  const availableRoleOptions = useMemo(() => (
    actorIsSuperAdmin
      ? ROLE_OPTIONS
      : ROLE_OPTIONS.filter((option) => option.value !== 'superadmin')
  ), [actorIsSuperAdmin]);

  useEffect(() => {
    let mounted = true;

    Promise.allSettled([getUsers(), me(), getCountries()])
      .then(([usersRes, meRes, countriesRes]) => {
        if (!mounted) return;

        if (usersRes.status === 'fulfilled') {
          const list = Array.isArray(usersRes.value.data) ? usersRes.value.data : [];
          setUsers(list.map((item) => mergeUserState(item, item)));
        }

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
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const filteredUsers = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (u.nom || '').toLowerCase().includes(q)
      || (u.prenom || '').toLowerCase().includes(q)
      || (u.email || '').toLowerCase().includes(q)
    );
  });

  const activeCount = users.filter((u) => u.statut === 'actif').length;
  const suspendedCount = users.filter((u) => u.statut === 'suspendu').length;

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    window.setTimeout(() => setToast(null), 3500);
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

      setUsers((previous) => previous.map((item) => (
        item.id === selectedUser.id ? nextUser : item
      )));

      await applySelfUpdate(nextUser);
      showToast(`✅ ${actionText} effectué. Email envoyé à ${selectedUser.email}`, 'success');
    } catch (err) {
      console.error('Toggle user status error', err);
      showToast('❌ Erreur lors de la mise à jour du statut', 'error');
    } finally {
      setToggling(null);
    }
  }

  async function handleApplyRole(selectedUser) {
    const currentRole = normalizeRole(selectedUser.role || 'client');
    const nextRole = String(roleDrafts[selectedUser.id] || currentRole);
    if (nextRole === currentRole) return;

    setRoleUpdating(selectedUser.id);
    try {
      const res = await updateUser(selectedUser.id, { role: nextRole });
      const updated = res?.data?.utilisateur || { role: nextRole };
      const nextUser = mergeUserState(selectedUser, updated);

      setUsers((previous) => previous.map((item) => (
        item.id === selectedUser.id ? nextUser : item
      )));

      setRoleDrafts((previous) => {
        const next = { ...previous };
        delete next[selectedUser.id];
        return next;
      });

      await applySelfUpdate(nextUser);
      showToast(`✅ Rôle mis à jour pour ${selectedUser.email}`, 'success');
    } catch (err) {
      console.error('Role update error', err);
      showToast(err?.response?.data?.message || '❌ Erreur lors de la mise à jour du rôle', 'error');
    } finally {
      setRoleUpdating(null);
    }
  }

  async function handleApplyAccess(selectedUser) {
    const draft = accessDrafts[selectedUser.id] || {
      can_access_client: Boolean(selectedUser.can_access_client),
      can_access_admin: Boolean(selectedUser.can_access_admin),
    };

    const unchanged = Boolean(selectedUser.can_access_client) === Boolean(draft.can_access_client)
      && Boolean(selectedUser.can_access_admin) === Boolean(draft.can_access_admin);
    if (unchanged) return;

    const status = (!draft.can_access_client && !draft.can_access_admin) ? 'suspendu' : 'actif';

    setAccessUpdating(selectedUser.id);
    try {
      const res = await updateUser(selectedUser.id, {
        can_access_client: draft.can_access_client,
        can_access_admin: draft.can_access_admin,
        statut: status,
      });

      const updated = res?.data?.utilisateur || {
        can_access_client: draft.can_access_client,
        can_access_admin: draft.can_access_admin,
        statut: status,
      };

      const nextUser = mergeUserState(selectedUser, updated);

      setUsers((previous) => previous.map((item) => (
        item.id === selectedUser.id ? nextUser : item
      )));

      setAccessDrafts((previous) => {
        const next = { ...previous };
        delete next[selectedUser.id];
        return next;
      });

      await applySelfUpdate(nextUser);
      showToast(`✅ Accès mis à jour pour ${selectedUser.email}`, 'success');
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
      const res = await createAdminAdjoint(adminForm);
      const created = res?.data?.utilisateur;
      const nextUser = mergeUserState(created, created);

      setUsers((previous) => [...previous, nextUser].sort((a, b) => Number(a.id) - Number(b.id)));
      setAdminForm((previous) => ({
        ...INITIAL_ADMIN_FORM,
        id_pays: previous.id_pays || String(actorUser?.id_pays || ''),
        two_factor_enabled: true,
      }));

      showToast(`✅ Admin adjoint créé. Email envoyé à ${created?.email || adminForm.email}`, 'success');
    } catch (err) {
      console.error('Create admin adjoint error', err);
      showToast(err?.response?.data?.message || '❌ Impossible de créer le compte admin adjoint', 'error');
    } finally {
      setCreatingAdmin(false);
    }
  }

  if (loading) {
    return <Loader text="Chargement des utilisateurs..." />;
  }

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
        {users.length > 0 && (
          <div className="admin-users-stats">
            <div className="admin-users-stat">
              <span>Total</span>
              <strong>{users.length}</strong>
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
              onChange={(e) => setAdminForm((previous) => ({ ...previous, telephone: e.target.value }))}
            />

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

      {users.length === 0 ? (
        <div className="admin-users-empty">
          <div className="admin-users-empty-icon">👥</div>
          <h3>Aucun utilisateur trouvé</h3>
          <p>Aucun utilisateur n'est actuellement enregistré sur la plateforme.</p>
        </div>
      ) : (
        <>
          <div className="admin-users-search">
            <div className="admin-users-search-input">
              <input
                type="text"
                placeholder="Rechercher par nom, prénom ou email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="admin-users-list-card">
            <div className="admin-users-list-card-header">
              <h2>Liste des Utilisateurs</h2>
              <span className="admin-users-list-card-count">
                {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="admin-users-table-wrapper">
              <table className="admin-users-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Utilisateur</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Acces</th>
                    <th>Statut</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
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

                        <td>
                          <div className="admin-user-role-cell">
                            <span className="admin-user-role-badge">
                              {ROLE_LABELS[normalizeRole(u.role)] || normalizeRole(u.role)}
                            </span>
                            <div className="admin-user-role-controls">
                              <select
                                className="admin-user-role-select"
                                value={roleDrafts[u.id] ?? normalizeRole(u.role || 'client')}
                                onChange={(e) => setRoleDrafts((previous) => ({ ...previous, [u.id]: e.target.value }))}
                                disabled={roleUpdating === u.id || cannotManageSuperAdmin}
                              >
                                {availableRoleOptions.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                              <button
                                type="button"
                                className="admin-user-action-btn reactivate"
                                onClick={() => handleApplyRole(u)}
                                disabled={
                                  cannotManageSuperAdmin
                                  || roleUpdating === u.id
                                  || (roleDrafts[u.id] ?? normalizeRole(u.role || 'client')) === normalizeRole(u.role || 'client')
                                }
                                title="Appliquer le role choisi"
                              >
                                {roleUpdating === u.id ? '⏳ En cours...' : 'Appliquer'}
                              </button>
                            </div>
                          </div>
                        </td>

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
                                      can_access_client: e.target.checked,
                                      can_access_admin: previous[u.id]?.can_access_admin ?? Boolean(u.can_access_admin),
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
                                      can_access_client: previous[u.id]?.can_access_client ?? Boolean(u.can_access_client),
                                      can_access_admin: e.target.checked,
                                    },
                                  }))}
                                  disabled={accessUpdating === u.id || cannotManageSuperAdmin}
                                />
                                Admin
                              </label>
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

                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan="7" className="admin-users-empty-cell">
                        Aucun résultat pour cette recherche.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {toast && (
        <div className={`admin-users-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
