import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { 'Accept': 'application/json' },
});

// Inject bearer token from localStorage when present (used after 2FA verify)
api.interceptors.request.use(config => {
  try {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers['Authorization'] = `Bearer ${token}`;
  } catch (e) {
    // ignore if localStorage not available
  }
  return config;
});

// Response interceptor: normalize common error messages for the front
api.interceptors.response.use(
  resp => resp,
  err => {
    // If server returned a JSON payload with a message, ensure it's in French when known
    const res = err.response;
    if (res && res.data && typeof res.data.message === 'string') {
      const msg = res.data.message;
      // map common English Laravel auth message to French
      if (msg.includes('These credentials do not match')) {
        res.data.message = 'Identifiants invalides';
      }
      if (msg.includes('Ces identifiants ne correspondent pas')) {
        res.data.message = 'Identifiants invalides';
      }
    }
    return Promise.reject(err);
  }
);

export async function csrf() {
  return api.get('/sanctum/csrf-cookie');
}

export async function login(credentials) {
  await csrf();
  // API auth route is under /api/auth/login
  return api.post('/api/auth/login', credentials);
}

export async function verify2FA(payload) {
  await csrf();
  return api.post('/api/auth/verify-2fa', payload);
}

export async function resend2FA(payload) {
  await csrf();
  return api.post('/api/auth/resend-2fa', payload);
}

export async function logout() {
  // Use API logout (sanctum) if available
  return api.post('/api/auth/logout');
}

export async function me() {
  // profile endpoint for authenticated API users
  return api.get('/api/auth/profile');
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function normalizeUser(u) {
  return {
    ...u,
    id: u?.id ?? u?.id_utilisateur,
    name: u?.name || [u?.prenom, u?.nom].filter(Boolean).join(' '),
  };
}

function normalizeProduct(p) {
  return {
    ...p,
    id: p?.id ?? p?.id_produit,
    title: p?.title || p?.titre || p?.name,
    price: p?.price ?? p?.prix,
  };
}

function normalizeOrder(o) {
  return {
    ...o,
    id: o?.id ?? o?.id_commande,
    total: o?.total ?? o?.montant_total ?? o?.montant,
    customer_name: o?.customer_name || o?.client || o?.utilisateur?.email || o?.utilisateur?.nom,
  };
}

export async function getUsers() {
  const res = await api.get('/api/utilisateurs');
  return {
    ...res,
    data: asArray(res.data).map(normalizeUser),
  };
}

export async function getProducts() {
  const res = await api.get('/api/admin/produits');
  return {
    ...res,
    data: asArray(res.data).map(normalizeProduct),
  };
}

export async function getOrders() {
  // admin orders endpoint
  const res = await api.get('/api/admin/commandes');
  return {
    ...res,
    data: asArray(res.data).map(normalizeOrder),
  };
}

export async function createProduct(data) {
  const payload = {
    titre: data.title,
    prix: Number(data.price),
    statut: data.statut || 'disponible',
    description: data.description || null,
  };

  if (data.id_categorie !== undefined && data.id_categorie !== null && data.id_categorie !== '') {
    payload.id_categorie = Number(data.id_categorie);
  }
  if (data.id_pays !== undefined && data.id_pays !== null && data.id_pays !== '') {
    payload.id_pays = Number(data.id_pays);
  }

  return api.post('/api/produits', payload);
}

export async function updateProduct(id, data) {
  const payload = {
    titre: data.title,
    prix: data.price !== undefined ? Number(data.price) : undefined,
    description: data.description,
    statut: data.statut,
    id_categorie: data.id_categorie !== undefined ? Number(data.id_categorie) : undefined,
    id_pays: data.id_pays !== undefined ? Number(data.id_pays) : undefined,
  };
  Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);
  return api.put(`/api/produits/${id}`, payload);
}

export async function deleteProduct(id) {
  return api.delete(`/api/produits/${id}`);
}

export async function deleteUser(id) {
  return api.delete(`/api/utilisateurs/${id}`);
}

export async function getOrder(id) {
  return api.get(`/api/admin/commandes/${id}`);
}

export async function updateOrderStatus(id, statut) {
  return api.patch(`/api/admin/commandes/${id}/statut`, { statut });
}

export async function getCategories() {
  const res = await api.get('/api/admin/categories-produits');
  return {
    ...res,
    data: asArray(res.data).map((c) => ({
      ...c,
      id: c?.id ?? c?.id_categorie,
      nom: c?.nom,
    })),
  };
}

export async function createCategory(data) {
  return api.post('/api/categories-produits', data);
}

export async function updateCategory(id, data) {
  return api.put(`/api/categories-produits/${id}`, data);
}

export async function deleteCategory(id) {
  return api.delete(`/api/categories-produits/${id}`);
}

export async function getPaiements() {
  const res = await api.get('/api/admin/paiements');
  return {
    ...res,
    data: asArray(res.data).map((p) => ({
      ...p,
      id: p?.id ?? p?.id_paiement,
      montant: p?.montant,
      statut: p?.statut_paiement,
      reference: p?.reference_transaction,
    })),
  };
}

export async function getNewsletterList() {
  const res = await api.get('/api/admin/newsletter');
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function createNewsletterEntry(email) {
  return api.post('/api/admin/newsletter', { email });
}

export async function updateNewsletterEntry(id, email) {
  return api.put(`/api/admin/newsletter/${id}`, { email });
}

export async function deleteNewsletterEntry(id) {
  return api.delete(`/api/admin/newsletter/${id}`);
}

export async function getImagesAdmin() {
  const res = await api.get('/api/admin/images');
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function deleteImageAdmin(id) {
  return api.delete(`/api/admin/images/${id}`);
}

export async function getCommentairesAdmin() {
  const res = await api.get('/api/admin/commentaires');
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function deleteCommentaireAdmin(id) {
  return api.delete(`/api/admin/commentaires/${id}`);
}

export async function getFormations() {
  const res = await api.get('/api/admin/formations');
  return {
    ...res,
    data: asArray(res.data).map((f) => ({ ...f, id: f.id || f.id_formation })),
  };
}

export async function createFormation(data) {
  return api.post('/api/admin/formations', data);
}

export async function updateFormation(id, data) {
  return api.put(`/api/admin/formations/${id}`, data);
}

export async function deleteFormation(id) {
  return api.delete(`/api/admin/formations/${id}`);
}

export async function getContactMessages() {
  const res = await api.get('/api/admin/contact-messages');
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function updateContactMessageStatus(id, statut) {
  return api.patch(`/api/admin/contact-messages/${id}/statut`, { statut });
}

export async function deleteContactMessage(id) {
  return api.delete(`/api/admin/contact-messages/${id}`);
}

export async function getRevendeurDemandes() {
  const res = await api.get('/api/admin/revendeur-demandes');
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function updateRevendeurDemandeStatus(id, statut) {
  return api.patch(`/api/admin/revendeur-demandes/${id}/statut`, { statut });
}

export async function submitContactMessage(payload) {
  return api.post('/api/contact-messages', payload);
}

export default api;
