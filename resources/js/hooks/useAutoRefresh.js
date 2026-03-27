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

  // Checker le manifest pour les mises à jour
  const checkForUpdates = useCallback(async () => {
    if (isCheckingRef.current) return;
    isCheckingRef.current = true;

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
    // Only enable polling in production
    const isDev = import.meta.env.DEV;
    if (isDev) {
      // Vite HMR handle it already
      return;
    }

    // En production: polling toutes les 30 secondes
    pollingIntervalRef.current = setInterval(checkForUpdates, 30000);

    // Check immédiat au montage
    checkForUpdates();

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [checkForUpdates]);

  // Checker au focus de la fenêtre (l'utilisateur revient à l'app)
  useEffect(() => {
    const handleFocus = () => {
      console.log('[AutoRefresh] App focused - checking for updates');
      checkForUpdates();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [checkForUpdates]);

  // Checker quand la connexion revient
  useEffect(() => {
    const handleOnline = () => {
      console.log('[AutoRefresh] Connexion restored - checking for updates');
      checkForUpdates();
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [checkForUpdates]);
};
