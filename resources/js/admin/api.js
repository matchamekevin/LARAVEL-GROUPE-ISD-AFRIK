import axios from 'axios';

const api = axios.create({
  baseURL: '/',
  withCredentials: true,
  headers: { 'Accept': 'application/json' },
});

function extractMessage(res) {
  if (typeof res?.data?.message === 'string') return res.data.message;
  if (typeof res?.data?.error === 'string') return res.data.error;
  return '';
}

function getAdminToken() {
  try {
    return localStorage.getItem('admin_token') || localStorage.getItem('adminToken');
  } catch (e) {
    return null;
  }
}

export function setAdminToken(token) {
  if (!token) return;

  try {
    localStorage.setItem('admin_token', token);
    localStorage.setItem('adminToken', token);
  } catch (e) {
    // ignore if localStorage not available
  }
}

export function clearAdminToken() {
  try {
    localStorage.removeItem('admin_token');
    localStorage.removeItem('adminToken');
  } catch (e) {
    // ignore if localStorage not available
  }
}

function invalidateAdminSession(message = 'Votre session admin a expiré.') {
  clearAdminToken();

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('admin-session-invalidated', {
      detail: { message },
    }));
  }
}

// Inject bearer token from localStorage when present (used after 2FA verify)
api.interceptors.request.use(config => {
  try {
    const token = getAdminToken();
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

    const status = res?.status;
    const message = extractMessage(res);
    const shouldInvalidate = status === 401 || (
      status === 403
      && ['Compte désactivé', 'Accès réservé aux administrateurs', 'Accès admin refusé', 'Non authentifié']
        .some((value) => message.includes(value))
    );

    if (shouldInvalidate) {
      invalidateAdminSession(message || 'Votre accès administrateur a été retiré.');
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
  return api.get('/api/auth/profile', {
    params: { portal: 'admin' },
  });
}

export async function updateMyProfile(payload) {
  return api.put('/api/auth/update-profile', payload);
}

export async function changeMyPassword(payload) {
  return api.post('/api/auth/change-password', payload);
}

function asArray(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function resolveMediaUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  if (raw.startsWith('http://') || raw.startsWith('https://') || raw.startsWith('/')) return raw;
  return `/storage/${raw.replace(/^\/+/, '')}`;
}

function normalizeUser(u) {
  return {
    ...u,
    id: u?.id ?? u?.id_utilisateur,
    name: u?.name || [u?.prenom, u?.nom].filter(Boolean).join(' '),
    is_admin: Boolean(u?.is_admin),
    can_access_client: Boolean(u?.can_access_client),
    can_access_admin: Boolean(u?.can_access_admin),
  };
}

function normalizeCountry(country) {
  return {
    ...country,
    id: country?.id,
    nom: country?.nom || `Pays #${country?.id ?? ''}`,
  };
}

function normalizeProduct(p) {
  const category = p?.categorie || {};
  const images = Array.isArray(p?.images) ? p.images : [];
  const imageUrls = Array.isArray(p?.image_urls)
    ? p.image_urls.map(resolveMediaUrl).filter(Boolean)
    : images
        .map((img) => img?.url || img?.path)
        .map(resolveMediaUrl)
        .filter(Boolean);

  const coverImage = resolveMediaUrl(p?.image_url) || imageUrls[0] || null;

  return {
    ...p,
    id: p?.id ?? p?.id_produit,
    title: p?.title || p?.titre || p?.name,
    price: p?.price ?? p?.prix,
    category_id: p?.id_categorie ?? category?.id_categorie ?? category?.id,
    category_name: category?.nom || p?.category_name,
    reference: p?.reference || '',
    description: p?.description || '',
    short_description: p?.description_courte || '',
    stock: p?.stock ?? 0,
    stock_alert: p?.stock_alerte ?? 0,
    statut: p?.statut || 'disponible',
    marque: p?.marque || '',
    modele: p?.modele || '',
    garantie: p?.garantie || '',
    poids: p?.poids ?? '',
    slug: p?.slug || '',
    promo_price: p?.prix_promo ?? '',
    est_nouveau: Boolean(p?.est_nouveau),
    est_en_vedette: Boolean(p?.est_en_vedette),
    en_promo: Boolean(p?.en_promo),
    image_url: coverImage,
    image_urls: imageUrls,
    specifications: p?.specifications ?? {},
  };
}

function normalizeOrder(o) {
  const client = o?.client_compte || {};
  const payment = o?.resume_paiement || null;

  return {
    ...o,
    id: o?.id ?? o?.id_commande,
    total: o?.total ?? o?.montant_total ?? o?.montant,
    customer_name:
      o?.customer_name ||
      client?.nom_complet ||
      o?.client ||
      o?.utilisateur?.email ||
      o?.utilisateur?.nom,
    customer_email: client?.email || o?.utilisateur?.email || null,
    customer_phone: client?.telephone || o?.utilisateur?.telephone || null,
    paid_items: Array.isArray(o?.articles_payes) ? o.articles_payes : [],
    paid_items_text: Array.isArray(o?.details_paiement) ? o.details_paiement : [],
    source_types: Array.isArray(o?.source_types) ? o.source_types : [],
    payment_summary: payment
      ? {
          ...payment,
          amount: payment?.montant ?? o?.montant,
          status: payment?.statut || o?.statut_paiement || null,
          reference: payment?.reference || null,
        }
      : null,
    delivery_status: o?.livraison_statut || o?.livraison?.statut || 'non_planifiee',
  };
}

export async function getUsers() {
  const res = await api.get('/api/utilisateurs');
  return {
    ...res,
    data: asArray(res.data).map(normalizeUser),
  };
}

export async function getCountries(params = { per_page: 250 }) {
  const res = await api.get('/api/pays', { params });
  return {
    ...res,
    data: asArray(res.data).map(normalizeCountry),
  };
}

export async function createAdminAdjoint(payload) {
  return api.post('/api/utilisateurs/admin-adjoint', {
    nom: payload.nom,
    prenom: payload.prenom,
    email: payload.email,
    telephone: payload.telephone || null,
    id_pays: payload.id_pays !== undefined && payload.id_pays !== null && payload.id_pays !== '' ? Number(payload.id_pays) : undefined,
    can_access_client: Boolean(payload.can_access_client),
    two_factor_enabled: payload.two_factor_enabled !== undefined ? Boolean(payload.two_factor_enabled) : true,
  });
}

export async function getProducts(params = {}) {
  const res = await api.get('/api/admin/produits', { params });
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
  const segment = data?.segment || 'general';
  const imageUrls = Array.isArray(data.image_urls)
    ? data.image_urls
    : String(data.image_urls || '')
        .split(/\r?\n|,/)
        .map((value) => value.trim())
        .filter(Boolean);

  const payload = {
    titre: data.title,
    prix: Number(data.price),
    statut: data.statut || 'disponible',
    description: data.description || null,
    description_courte: data.description_courte || null,
    reference: data.reference || null,
    marque: data.marque || null,
    modele: data.modele || null,
    garantie: data.garantie || null,
    poids: data.poids !== undefined && data.poids !== null && data.poids !== '' ? Number(data.poids) : null,
    stock: data.stock !== undefined && data.stock !== null && data.stock !== '' ? Number(data.stock) : 0,
    stock_alerte: data.stock_alerte !== undefined && data.stock_alerte !== null && data.stock_alerte !== '' ? Number(data.stock_alerte) : 5,
    slug: data.slug || null,
    prix_promo: data.prix_promo !== undefined && data.prix_promo !== null && data.prix_promo !== '' ? Number(data.prix_promo) : null,
    est_nouveau: Boolean(data.est_nouveau),
    est_en_vedette: Boolean(data.est_en_vedette),
    en_promo: Boolean(data.en_promo),
    specifications: typeof data.specifications === 'string'
      ? (() => {
          try {
            const parsed = JSON.parse(data.specifications);
            return parsed && typeof parsed === 'object' ? parsed : null;
          } catch (e) {
            return null;
          }
        })()
      : data.specifications || null,
    image_urls: imageUrls,
    segment,
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
  const segment = data?.segment || 'general';
  const imageUrls = Array.isArray(data.image_urls)
    ? data.image_urls
    : (data.image_urls !== undefined
      ? String(data.image_urls || '')
          .split(/\r?\n|,/)
          .map((value) => value.trim())
          .filter(Boolean)
      : undefined);

  const payload = {
    titre: data.title,
    prix: data.price !== undefined ? Number(data.price) : undefined,
    description: data.description,
    description_courte: data.description_courte,
    reference: data.reference,
    marque: data.marque,
    modele: data.modele,
    garantie: data.garantie,
    poids: data.poids !== undefined && data.poids !== null && data.poids !== '' ? Number(data.poids) : data.poids,
    stock: data.stock !== undefined && data.stock !== null && data.stock !== '' ? Number(data.stock) : data.stock,
    stock_alerte: data.stock_alerte !== undefined && data.stock_alerte !== null && data.stock_alerte !== '' ? Number(data.stock_alerte) : data.stock_alerte,
    slug: data.slug,
    prix_promo: data.prix_promo !== undefined && data.prix_promo !== null && data.prix_promo !== '' ? Number(data.prix_promo) : data.prix_promo,
    est_nouveau: data.est_nouveau,
    est_en_vedette: data.est_en_vedette,
    en_promo: data.en_promo,
    specifications: data.specifications !== undefined
      ? (typeof data.specifications === 'string'
          ? (() => {
              try {
                const parsed = JSON.parse(data.specifications);
                return parsed && typeof parsed === 'object' ? parsed : null;
              } catch (e) {
                return null;
              }
            })()
          : data.specifications)
      : undefined,
    image_urls: imageUrls,
    segment,
    statut: data.statut,
    id_categorie: data.id_categorie !== undefined && data.id_categorie !== null && data.id_categorie !== '' ? Number(data.id_categorie) : undefined,
    id_pays: data.id_pays !== undefined && data.id_pays !== null && data.id_pays !== '' ? Number(data.id_pays) : undefined,
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

export async function suspendUser(id) {
  return api.put(`/api/utilisateurs/${id}`, { statut: 'suspendu' });
}

export async function updateUserStatus(id, statut) {
  return api.put(`/api/utilisateurs/${id}`, { statut });
}

export async function updateUser(id, payload) {
  return api.put(`/api/utilisateurs/${id}`, payload);
}

export async function getOrder(id) {
  return api.get(`/api/admin/commandes/${id}`);
}

export async function updateOrderStatus(id, statut) {
  return api.patch(`/api/admin/commandes/${id}/statut`, { statut });
}

export async function updateOrderDeliveryStatus(id, statut) {
  return api.patch(`/api/admin/commandes/${id}/livraison-statut`, { statut });
}

export async function getCategories(params = {}) {
  const res = await api.get('/api/admin/categories-produits', { params });
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
  const formData = new FormData();
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      return;
    }
    formData.append(key, value);
  });
  return api.post('/api/categories-produits', formData);
}

export async function updateCategory(id, data) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.entries(data || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    if (typeof value === 'boolean') {
      formData.append(key, value ? '1' : '0');
      return;
    }
    formData.append(key, value);
  });
  return api.post(`/api/categories-produits/${id}`, formData);
}

export async function deleteCategory(id) {
  return api.delete(`/api/categories-produits/${id}`);
}

export async function syncGeovisionCatalog(payload = {}) {
  return api.post('/api/admin/geovision/sync', payload);
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

export async function deleteImageAdmin(id) {
  return api.delete(`/api/admin/images/${id}`);
}

export async function createImageAdmin(payload) {
  return api.post('/api/admin/images', payload);
}

export async function updateImageAdmin(id, payload) {
  return api.put(`/api/admin/images/${id}`, payload);
}

export async function uploadImageFile(file, folder = 'uploads') {
  const formData = new FormData();
  formData.append('image', file);
  formData.append('folder', folder);
  const res = await api.post('/api/admin/images/upload', formData);
  return res?.data || {};
}

export async function uploadProductImages(id, files) {
  const list = Array.isArray(files) ? files : Array.from(files || []);
  const formData = new FormData();
  list.forEach((file) => {
    if (file) formData.append('images[]', file);
  });
  return api.post(`/api/produits/${id}/images`, formData);
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

export async function getHomeMarketingCardsAdmin(params = {}) {
  const res = await api.get('/api/admin/home-marketing-cards', { params });
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function createHomeMarketingCard(payload) {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post('/api/admin/home-marketing-cards', formData);
}

export async function updateHomeMarketingCard(id, payload) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post(`/api/admin/home-marketing-cards/${id}`, formData);
}

export async function deleteHomeMarketingCard(id) {
  return api.delete(`/api/admin/home-marketing-cards/${id}`);
}

export async function getHomeTestimonialsAdmin(params = {}) {
  const res = await api.get('/api/admin/home-testimonials', { params });
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function createHomeTestimonial(payload) {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post('/api/admin/home-testimonials', formData);
}

export async function updateHomeTestimonial(id, payload) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post(`/api/admin/home-testimonials/${id}`, formData);
}

export async function deleteHomeTestimonial(id) {
  return api.delete(`/api/admin/home-testimonials/${id}`);
}

export async function getHomeCollaboratorsAdmin(params = {}) {
  const res = await api.get('/api/admin/home-collaborators', { params });
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function createHomeCollaborator(payload) {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post('/api/admin/home-collaborators', formData);
}

export async function updateHomeCollaborator(id, payload) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post(`/api/admin/home-collaborators/${id}`, formData);
}

export async function deleteHomeCollaborator(id) {
  return api.delete(`/api/admin/home-collaborators/${id}`);
}

export async function getHomePartnersAdmin(params = {}) {
  const res = await api.get('/api/admin/home-partners', { params });
  return {
    ...res,
    data: asArray(res.data),
  };
}

export async function createHomePartner(payload) {
  const formData = new FormData();
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post('/api/admin/home-partners', formData);
}

export async function updateHomePartner(id, payload) {
  const formData = new FormData();
  formData.append('_method', 'PUT');
  Object.entries(payload || {}).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (value === '') return;
    formData.append(key, value);
  });
  return api.post(`/api/admin/home-partners/${id}`, formData);
}

export async function deleteHomePartner(id) {
  return api.delete(`/api/admin/home-partners/${id}`);
}

export async function submitContactMessage(payload) {
  return api.post('/api/contact-messages', payload);
}

export default api;
