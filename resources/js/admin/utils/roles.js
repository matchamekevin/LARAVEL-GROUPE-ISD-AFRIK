// Constantes et utilitaires pour les rôles/admin en frontend (admin)
export const ROLE_OPTIONS = [
  { value: 'client', label: 'Client (sans role admin)' },
  { value: 'admin_adjoint', label: 'Admin adjoint' },
  { value: 'superadmin', label: 'Super admin' },
];

export const ROLE_LABELS = {
  client: 'Client',
  admin: 'Admin adjoint',
  admin_pays: 'Admin adjoint',
  admin_national: 'Admin adjoint',
  admin_adjoint: 'Admin adjoint',
  superadmin: 'Super admin',
};

export function normalizeRole(value) {
  const role = String(value || 'client');
  if (['admin', 'admin_pays', 'admin_national'].includes(role)) return 'admin_adjoint';
  return role;
}

export default {
  ROLE_OPTIONS,
  ROLE_LABELS,
  normalizeRole,
};
