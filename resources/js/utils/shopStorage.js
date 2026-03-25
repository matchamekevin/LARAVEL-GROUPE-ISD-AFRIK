const FAVORITES_KEY_PREFIX = "isd_favorites";
const CART_KEY_PREFIX = "isd_cart";
const GUEST_ID_KEY = "isd_guest_id";
const MERGE_MARKER_PREFIX = "isd_guest_merged_to_user";
const STORE_UPDATED_EVENT = "isd:store-updated";

function safeParse(value, fallback) {
  try {
    const parsed = JSON.parse(value);
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function safeStringify(value) {
  try {
    return JSON.stringify(value);
  } catch {
    return "[]";
  }
}

function getCurrentUserId() {
  try {
    const raw = localStorage.getItem("user");
    if (!raw) return null;
    const user = JSON.parse(raw);
    return user?.id_utilisateur || user?.id || null;
  } catch {
    return null;
  }
}

function getGuestId() {
  let guestId = localStorage.getItem(GUEST_ID_KEY);
  if (!guestId) {
    guestId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(GUEST_ID_KEY, guestId);
  }
  return guestId;
}

function getScope() {
  const userId = getCurrentUserId();
  if (userId) {
    return `user:${userId}`;
  }
  return `guest:${getGuestId()}`;
}

function buildKey(prefix, scope) {
  return `${prefix}:${scope}`;
}

function normalizeProductSnapshot(product) {
  const id = Number(product?.id_produit || product?.id);
  return {
    id_produit: id,
    slug: product?.slug || "",
    titre: product?.titre || product?.title || "Produit",
    prix: Number(product?.prix || product?.price || 0),
    prix_promo: product?.prix_promo != null ? Number(product.prix_promo) : null,
    image_url:
      product?.image_url ||
      (Array.isArray(product?.images) && product.images[0] ? (product.images[0].url || product.images[0].path || "") : "") ||
      "/placeholder.webp",
    stock: Number(product?.stock || 0),
    marque: product?.marque || "",
  };
}

function readArray(prefix, scope) {
  const key = buildKey(prefix, scope);
  const raw = localStorage.getItem(key);
  const parsed = safeParse(raw, []);
  return Array.isArray(parsed) ? parsed : [];
}

function writeArray(prefix, scope, data) {
  const key = buildKey(prefix, scope);
  localStorage.setItem(key, safeStringify(data));
  notifyStoreUpdated();
}

function mergeGuestDataForUser(userId) {
  const markerKey = `${MERGE_MARKER_PREFIX}:${userId}`;
  if (localStorage.getItem(markerKey)) {
    return;
  }

  const guestScope = `guest:${getGuestId()}`;
  const userScope = `user:${userId}`;

  const guestFavorites = readArray(FAVORITES_KEY_PREFIX, guestScope);
  const userFavorites = readArray(FAVORITES_KEY_PREFIX, userScope);
  const favoriteMap = new Map();
  [...userFavorites, ...guestFavorites].forEach((item) => {
    favoriteMap.set(Number(item.id_produit), item);
  });
  writeArray(FAVORITES_KEY_PREFIX, userScope, Array.from(favoriteMap.values()));

  const guestCart = readArray(CART_KEY_PREFIX, guestScope);
  const userCart = readArray(CART_KEY_PREFIX, userScope);
  const cartMap = new Map();
  userCart.forEach((item) => cartMap.set(Number(item.id_produit), { ...item }));
  guestCart.forEach((item) => {
    const existing = cartMap.get(Number(item.id_produit));
    if (existing) {
      existing.quantite = Number(existing.quantite || 0) + Number(item.quantite || 0);
      cartMap.set(Number(item.id_produit), existing);
    } else {
      cartMap.set(Number(item.id_produit), { ...item });
    }
  });
  writeArray(CART_KEY_PREFIX, userScope, Array.from(cartMap.values()));

  localStorage.removeItem(buildKey(FAVORITES_KEY_PREFIX, guestScope));
  localStorage.removeItem(buildKey(CART_KEY_PREFIX, guestScope));
  localStorage.setItem(markerKey, "1");
}

function ensureScopeReady() {
  const userId = getCurrentUserId();
  if (userId) {
    mergeGuestDataForUser(userId);
  }
  return getScope();
}

export function getFavorites() {
  const scope = ensureScopeReady();
  return readArray(FAVORITES_KEY_PREFIX, scope);
}

export function isFavorite(productId) {
  const id = Number(productId);
  return getFavorites().some((item) => Number(item.id_produit) === id);
}

export function toggleFavorite(product) {
  const scope = ensureScopeReady();
  const list = readArray(FAVORITES_KEY_PREFIX, scope);
  const snapshot = normalizeProductSnapshot(product);
  const id = Number(snapshot.id_produit);

  const exists = list.some((item) => Number(item.id_produit) === id);
  const next = exists
    ? list.filter((item) => Number(item.id_produit) !== id)
    : [snapshot, ...list];

  writeArray(FAVORITES_KEY_PREFIX, scope, next);

  return {
    isFavorite: !exists,
    items: next,
  };
}

export function getFavoritesCount() {
  return getFavorites().length;
}

export function getCartItems() {
  const scope = ensureScopeReady();
  return readArray(CART_KEY_PREFIX, scope);
}

export function addToCart(product, quantite = 1) {
  const scope = ensureScopeReady();
  const list = readArray(CART_KEY_PREFIX, scope);
  const snapshot = normalizeProductSnapshot(product);
  const id = Number(snapshot.id_produit);
  const qtyToAdd = Math.max(1, Number(quantite || 1));

  const index = list.findIndex((item) => Number(item.id_produit) === id);
  if (index >= 0) {
    const current = list[index];
    const maxStock = Number(snapshot.stock || current.stock || 9999);
    const nextQty = Math.min(Number(current.quantite || 0) + qtyToAdd, Math.max(1, maxStock));
    list[index] = {
      ...current,
      ...snapshot,
      quantite: nextQty,
    };
  } else {
    list.unshift({
      ...snapshot,
      quantite: qtyToAdd,
    });
  }

  writeArray(CART_KEY_PREFIX, scope, list);
  return list;
}

export function setCartItemQuantity(productId, quantite) {
  const scope = ensureScopeReady();
  const id = Number(productId);
  const qty = Number(quantite || 1);
  let list = readArray(CART_KEY_PREFIX, scope);

  if (qty <= 0) {
    list = list.filter((item) => Number(item.id_produit) !== id);
  } else {
    list = list.map((item) =>
      Number(item.id_produit) === id
        ? { ...item, quantite: Math.max(1, qty) }
        : item
    );
  }

  writeArray(CART_KEY_PREFIX, scope, list);
  return list;
}

export function removeFromCart(productId) {
  return setCartItemQuantity(productId, 0);
}

export function clearCart() {
  const scope = ensureScopeReady();
  writeArray(CART_KEY_PREFIX, scope, []);
}

export function getCartCount() {
  return getCartItems().reduce((sum, item) => sum + Number(item.quantite || 0), 0);
}

export function notifyStoreUpdated() {
  window.dispatchEvent(new CustomEvent(STORE_UPDATED_EVENT));
}

export function subscribeStoreUpdates(callback) {
  const handler = () => callback();
  window.addEventListener(STORE_UPDATED_EVENT, handler);
  window.addEventListener("storage", handler);

  return () => {
    window.removeEventListener(STORE_UPDATED_EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
