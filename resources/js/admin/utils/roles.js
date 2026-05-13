// Constantes et utilitaires pour les rôles/admin en frontend (admin)
export const ROLE_OPTIONS = [
  { value: 'client', label: 'Client (sans role admin)' },
  { value: 'admin_adjoint', label: 'Admin adjoint' },
  { value: 'admin_pays', label: 'Admin Pays / National' },
  { value: 'superadmin', label: 'Super admin' },
];

export const ROLE_LABELS = {
  client: 'Client',
  admin: 'Super admin',
  admin_pays: 'Admin Pays',
  admin_national: 'Admin Pays',
  admin_adjoint: 'Admin adjoint',
  superadmin: 'Super admin',
};

export function normalizeRole(value) {
  const role = String(value || 'client');
  if (['admin_pays', 'admin_national'].includes(role)) return 'admin_pays';
  if (role === 'admin') return 'superadmin';
  return role;
}

export default {
  ROLE_OPTIONS,
  ROLE_LABELS,
  normalizeRole,
};
