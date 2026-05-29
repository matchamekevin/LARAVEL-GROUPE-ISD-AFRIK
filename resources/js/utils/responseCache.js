const cache = new Map();
const pendingFetches = new Map();

const DEFAULT_TTL = 5 * 60 * 1000;

function hashKey(url, params = {}) {
  const sorted = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
  return `${url}|${sorted}`;
}

export function getCachedResponse(url, params = {}) {
  const key = hashKey(url, params);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setCachedResponse(url, params = {}, data, ttl = DEFAULT_TTL) {
  const key = hashKey(url, params);
  cache.set(key, { data, expiresAt: Date.now() + ttl });
}

export function invalidateCache(pattern) {
  if (!pattern) {
    cache.clear();
    return;
  }
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

export async function fetchWithCache(axiosInstance, url, config = {}, ttl = DEFAULT_TTL) {
  const params = config.params || {};
  const key = hashKey(url, params);
  const cached = getCachedResponse(url, params);
  if (cached) return cached;

  const pending = pendingFetches.get(key);
  if (pending) return pending;

  const promise = axiosInstance.get(url, config).then(res => {
    const data = res.data;
    setCachedResponse(url, params, data, ttl);
    pendingFetches.delete(key);
    return data;
  }).catch(err => {
    pendingFetches.delete(key);
    throw err;
  });

  pendingFetches.set(key, promise);
  return promise;
}

if (typeof window !== 'undefined') {
  window.__responseCache = { get: getCachedResponse, set: setCachedResponse, clear: () => cache.clear(), invalidate: invalidateCache };
}
