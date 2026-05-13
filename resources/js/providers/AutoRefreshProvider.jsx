import React, { useEffect } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import useContentVersionSync from '../hooks/useContentVersionSync';
import { initAutoRefresh } from '../utils/autoRefresh';

/**
 * Provider global pour l'auto-refresh de l'application
 * À wrapper autour de <App /> dans main.jsx/app.jsx
 */
export const AutoRefreshProvider = ({ children }) => {
  // Activer le hot reload sur TOUTES les pages, même en dev/localhost
  // pour tester la synchronisation du contenu en temps réel
  const isDev = import.meta.env.DEV;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  
  // Activer seulement en production et pas en localhost
  const enabled = !isDev && !isLocal;

  // Prévenir reloads répétés et appliquer la mise à jour quand l'utilisateur est actif
  const handleVersionChange = () => {
    if (typeof window === 'undefined') return;

    // Si un reload est déjà en cours, ignorer
    if (window.__autoRefreshReloading) return;

    const now = Date.now();
    const last = window.__autoRefreshLastReloadTime || 0;

    // Cooldown minimal entre reloads (5s)
    if (now - last < 5000) return;

    // Si l'onglet est caché, différer le reload jusqu'au retour
    if (document.visibilityState !== 'visible') {
      window.__autoRefreshPending = true;
      return;
    }

    window.__autoRefreshReloading = true;
    window.__autoRefreshLastReloadTime = now;

    // Laisser un petit délai pour fermer les modales, etc.
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  useAutoRefresh();
  useContentVersionSync({
    enabled,
    intervalMs: 2500,
    onVersionChange: handleVersionChange,
  });

  // Initialiser le Service Worker et système complet
  useEffect(() => {
    if (!enabled) {
      console.log('[AutoRefreshProvider] AutoRefresh disabled');
      return;
    }

    console.log('[AutoRefreshProvider] AutoRefresh enabled globally');
    initAutoRefresh();
  }, [enabled]);

  // Appliquer la mise à jour différée quand l'utilisateur revient sur l'onglet
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && window.__autoRefreshPending) {
        window.__autoRefreshPending = false;
        handleVersionChange();
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, []);

  return <>{children}</>;
};

export default AutoRefreshProvider;
