/**
 * Service Worker pour ISD AFRIK Platform
 * Gère le cache, offline-first, et updates invisibles
 */

const CACHE_VERSION = '2026-04-09-1';
const CACHE_NAME = `isd-afrik-${CACHE_VERSION}`;
const RUNTIME_CACHE = `isd-afrik-runtime-${CACHE_VERSION}`;
const API_CACHE = `isd-afrik-api-${CACHE_VERSION}`;
const ASSET_CACHE = `isd-afrik-assets-${CACHE_VERSION}`;

// Ressources à précacher au premier load
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

// Événement d'installation
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[ServiceWorker] Precaching core assets');
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // Ignore errors - not all might be available
      });
    })
  );
  self.skipWaiting(); // Activate immediately
});

// Événement d'activation
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      const activeCaches = new Set([CACHE_NAME, RUNTIME_CACHE, API_CACHE, ASSET_CACHE]);

      return Promise.all(
        cacheNames
          .filter((cacheName) => cacheName.startsWith('isd-afrik-') && !activeCaches.has(cacheName))
          .map((cacheName) => {
            console.log('[ServiceWorker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  self.clients.claim(); // Claim all clients
});

// Stratégie Network First pour API (données fraîches d'abord)
const networkFirstStrategy = async (request) => {
  const cacheName = request.url.includes('/api/') ? API_CACHE : RUNTIME_CACHE;

  try {
    const networkResponse = await fetch(request);

    if (networkResponse.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }

    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Network failed, trying cache:', request.url);
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    throw error;
  }
};

// Stratégie Cache First pour assets statiques
const cacheFirstStrategy = async (request) => {
  const cached = await caches.match(request);
  if (cached) {
    return cached;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(ASSET_CACHE);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('[ServiceWorker] Cannot fetch:', request.url);
    throw error;
  }
};

// Événement de fetch
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Ignorer les requêtes chrome-extension et autres non-http
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // API calls: Network First (données fraîches)
  if (url.pathname.includes('/api/')) {
    event.respondWith(networkFirstStrategy(request).catch(() => {
      if (request.method === 'GET') {
        return caches.match(request);
      }
      return new Response('Network error', { status: 408 });
    }));
    return;
  }

  // Static assets: Cache First
  if (
    request.destination === 'style' ||
    request.destination === 'script' ||
    request.destination === 'font' ||
    request.destination === 'image' ||
    url.pathname.endsWith('.js') ||
    url.pathname.endsWith('.css') ||
    url.pathname.endsWith('.woff') ||
    url.pathname.endsWith('.woff2')
  ) {
    event.respondWith(cacheFirstStrategy(request).catch(() => {
      return new Response('Asset not found', { status: 404 });
    }));
    return;
  }

  // HTML documents: Network First
  if (request.method === 'GET' && request.destination === 'document') {
    event.respondWith(networkFirstStrategy(request).catch(() => {
      return caches.match('/');
    }));
    return;
  }

  // Everything else: Network only
  event.respondWith(fetch(request).catch(() => {
    return new Response('Network error', { status: 408 });
  }));
});

// Message handler pour updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[ServiceWorker] Skip waiting command received');
    self.skipWaiting();
  }
});

// Sync background pour retrier envoyer les requêtes offline
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-requests') {
    event.waitUntil(syncPendingRequests());
  }
});

async function syncPendingRequests() {
  try {
    const requests = await caches.open(API_CACHE);
    const keys = await requests.keys();

    for (const request of keys) {
      try {
        const response = await fetch(request);
        if (response.ok) {
          await requests.put(request, response);
        }
      } catch (error) {
        console.log('[ServiceWorker] Sync retry failed:', request.url);
      }
    }
  } catch (error) {
    console.log('[ServiceWorker] Sync error:', error);
  }
}
