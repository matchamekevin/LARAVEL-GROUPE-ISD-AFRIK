import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook pour le refresh automatique invisible de l'application
 * - En DEV: Utilise Vite HMR (déjà configuré)
 * - En PROD: Polling intelligent du manifest + service worker
 * - Aucun flicker ou interruption visible pour l'utilisateur
 */
export const useAutoRefresh = () => {
  const pollingIntervalRef = useRef(null);
  const lastVersionRef = useRef(null);
  const isCheckingRef = useRef(false);
  const isDev = import.meta.env.DEV;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const isEnabled = !isDev && !isLocal;

  // Checker le manifest pour les mises à jour
  const checkForUpdates = useCallback(async (reason = 'polling') => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

    if (reason !== 'polling') {
      console.log(`[AutoRefresh] Checking for updates (reason: ${reason})`);
    }

    try {
      const response = await fetch('/manifest.json?t=' + Date.now(), {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      });

      if (!response.ok) {
        isCheckingRef.current = false;
        return;
      }

      const manifest = await response.json();
      const currentVersion = manifest.version;

      if (!lastVersionRef.current) {
        lastVersionRef.current = currentVersion;
        isCheckingRef.current = false;
        return;
      }

      // Si version différente = mise à jour disponible
      if (currentVersion !== lastVersionRef.current) {
        console.log('[AutoRefresh] Mise à jour détectée:', lastVersionRef.current, '->', currentVersion);
        lastVersionRef.current = currentVersion;

        // Hard refresh invisible après délai
        setTimeout(() => {
          window.location.reload();
        }, 500);
      }
    } catch (error) {
      console.warn('[AutoRefresh] Erreur lors du check:', error.message);
    } finally {
      isCheckingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isEnabled) {
      return;
    }

    // En production: polling toutes les 30 secondes
    pollingIntervalRef.current = setInterval(() => checkForUpdates('polling'), 30000);

    // Check immédiat au montage
    checkForUpdates('mount');

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [checkForUpdates, isEnabled]);

  // Checker au focus de la fenêtre (l'utilisateur revient à l'app)
  useEffect(() => {
    if (!isEnabled) return;
    const handleFocus = () => {
      checkForUpdates('focus');
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkForUpdates, isEnabled]);

  // Checker quand la connexion revient
  useEffect(() => {
    if (!isEnabled) return;
    const handleOnline = () => {
      checkForUpdates('online');
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkForUpdates, isEnabled]);
};
