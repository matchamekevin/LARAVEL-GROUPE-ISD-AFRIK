/**
 * Initialisation du système de refresh automatique
 * - Service Worker registration
 * - Manifest versioning
 * - Auto-update handler
 */

const isDev = import.meta.env.DEV;
const isProd = import.meta.env.PROD;
const swFeatureEnabled = String(import.meta.env.VITE_ENABLE_SERVICE_WORKER || '').toLowerCase() === 'true';
const shouldUseServiceWorker = isProd && swFeatureEnabled;
let autoRefreshInitialized = false;

const isLocalHost = (() => {
  if (typeof window === 'undefined') return false;
  const host = String(window.location?.hostname || '').toLowerCase();
  return host === 'localhost' || host === '127.0.0.1' || host === '::1';
})();

/**
 * Enregistrer le Service Worker en production
 */
export const initServiceWorker = async () => {
  if (!shouldUseServiceWorker || isLocalHost) {
    if (isDev || !swFeatureEnabled) {
      console.log('[AutoRefresh] Service Worker disabled');
    }
    return;
  }

  if (!('serviceWorker' in navigator)) {
    console.warn('[AutoRefresh] Service Workers not supported');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    console.log('[AutoRefresh] Service Worker registered');

    // Checker les updates toutes les heures
    setInterval(() => {
      registration.update();
    }, 60 * 60 * 1000);

    // Update found handler
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (!newWorker) {
        return;
      }

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('[AutoRefresh] New Service Worker ready - will update on next load');
          // Dans une app réelle, vous pouvez notifier l'utilisateur ici
          // showUpdateAvailableNotification();
        }
      });
    });
  } catch (error) {
    console.error('[AutoRefresh] Service Worker registration failed:', error);
  }
};

/**
 * Mettre à jour le manifest JSON avec la version actuelle
 * À appeler depuis le backend (ou via un endpoint)
 */
export const updateManifestVersion = async () => {
  try {
    const response = await fetch('/manifest.json?t=' + Date.now());
    if (response.ok) {
      const manifest = await response.json();
      console.log('[AutoRefresh] Manifest version:', manifest.version);
      return manifest;
    }
  } catch (error) {
    console.error('[AutoRefresh] Failed to fetch manifest:', error);
  }
};

/**
 * Vérifier et installer les updates du Service Worker
 */
export const checkServiceWorkerUpdates = () => {
  if (!shouldUseServiceWorker || !('serviceWorker' in navigator)) return;

  navigator.serviceWorker.ready.then((registration) => {
    // Check for updates immediately
    registration.update();

    // Then check every 5 minutes
    setInterval(() => {
      registration.update();
    }, 5 * 60 * 1000);
  });
};

/**
 * Notifier pour appliquer la mise à jour
 */
export const applyServiceWorkerUpdate = () => {
  if (!navigator.serviceWorker.controller) return;

  const messageChannel = new MessageChannel();
  messageChannel.port1.onmessage = () => {
    window.location.reload();
  };

  navigator.serviceWorker.controller.postMessage(
    { type: 'SKIP_WAITING' },
    [messageChannel.port2]
  );
};

/**
 * Initialiser le système complet
 */
export const initAutoRefresh = async () => {
  if (autoRefreshInitialized) {
    return;
  }
  autoRefreshInitialized = true;

  console.log('[AutoRefresh] Initializing auto-refresh system');

  // Enregistrer Service Worker
  await initServiceWorker();
  if (shouldUseServiceWorker) {
    // Checker les updates
    checkServiceWorkerUpdates();
  }

  // Update manifest version
  await updateManifestVersion();
};
