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

function getProductId(item) {
  return Number(item?.id_produit || item?.id || 0);
}

function normalizeProductSnapshot(product) {
  const id = getProductId(product);
  return {
    id_produit: id,
    id,
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

function normalizeStoredCartItems(items) {
  return (Array.isArray(items) ? items : [])
    .map((item) => {
      const id = getProductId(item);
      if (!Number.isFinite(id) || id <= 0) return null;
      return {
        ...item,
        id_produit: id,
      };
    })
    .filter(Boolean);
}

function writeArray(prefix, scope, data, shouldNotify = true) {
  const key = buildKey(prefix, scope);
  localStorage.setItem(key, safeStringify(data));
  if (shouldNotify) {
    notifyStoreUpdated();
  }
}

function mergeGuestDataForUser(userId) {
  const markerKey = `${MERGE_MARKER_PREFIX}:${userId}`;
  if (localStorage.getItem(markerKey)) {
    return false;
  }

  const guestScope = `guest:${getGuestId()}`;
  const userScope = `user:${userId}`;

  const guestFavorites = readArray(FAVORITES_KEY_PREFIX, guestScope);
  const userFavorites = readArray(FAVORITES_KEY_PREFIX, userScope);
  const favoriteMap = new Map();
  [...userFavorites, ...guestFavorites].forEach((item) => {
    const id = getProductId(item);
    if (id > 0) {
      favoriteMap.set(id, {
        ...item,
        id_produit: id,
      });
    }
  });
  writeArray(FAVORITES_KEY_PREFIX, userScope, Array.from(favoriteMap.values()), false);

  const guestCart = normalizeStoredCartItems(readArray(CART_KEY_PREFIX, guestScope));
  const userCart = normalizeStoredCartItems(readArray(CART_KEY_PREFIX, userScope));
  const cartMap = new Map();
  userCart.forEach((item) => {
    const id = getProductId(item);
    if (id > 0) {
      cartMap.set(id, { ...item, id_produit: id });
    }
  });
  guestCart.forEach((item) => {
    const id = getProductId(item);
    if (id <= 0) return;

    const existing = cartMap.get(id);
    if (existing) {
      existing.quantite = Number(existing.quantite || 0) + Number(item.quantite || 0);
      cartMap.set(id, existing);
    } else {
      cartMap.set(id, { ...item, id_produit: id });
    }
  });
  writeArray(CART_KEY_PREFIX, userScope, Array.from(cartMap.values()), false);

  localStorage.removeItem(buildKey(FAVORITES_KEY_PREFIX, guestScope));
  localStorage.removeItem(buildKey(CART_KEY_PREFIX, guestScope));
  localStorage.setItem(markerKey, "1");

  // Emit once after migration to avoid recursive update loops.
  notifyStoreUpdated();
  return true;
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
  return getFavorites().some((item) => getProductId(item) === id);
}

export function toggleFavorite(product) {
  const scope = ensureScopeReady();
  const list = readArray(FAVORITES_KEY_PREFIX, scope);
  const snapshot = normalizeProductSnapshot(product);
  const id = Number(snapshot.id_produit);

  const exists = list.some((item) => getProductId(item) === id);
  const next = exists
    ? list.filter((item) => getProductId(item) !== id)
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
  return normalizeStoredCartItems(readArray(CART_KEY_PREFIX, scope));
}

export function addToCart(product, quantite = 1) {
  const scope = ensureScopeReady();
  const list = normalizeStoredCartItems(readArray(CART_KEY_PREFIX, scope));
  const snapshot = normalizeProductSnapshot(product);
  const id = Number(snapshot.id_produit);
  const qtyToAdd = Math.max(1, Number(quantite || 1));

  const index = list.findIndex((item) => getProductId(item) === id);
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
  const qty = Number(quantite ?? 1);
  let list = normalizeStoredCartItems(readArray(CART_KEY_PREFIX, scope));

  if (qty <= 0) {
    list = list.filter((item) => getProductId(item) !== id);
  } else {
    list = list.map((item) =>
      getProductId(item) === id
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
