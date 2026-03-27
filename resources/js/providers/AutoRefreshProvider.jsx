import React, { useEffect } from 'react';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { initAutoRefresh } from '../utils/autoRefresh';

/**
 * Provider global pour l'auto-refresh de l'application
 * À wrapper autour de <App /> dans main.jsx/app.jsx
 */
export const AutoRefreshProvider = ({ children }) => {
  // Initialiser le hook
  useAutoRefresh();

  // Initialiser le Service Worker et système complet
  useEffect(() => {
    initAutoRefresh();
  }, []);

  return <>{children}</>;
};

export default AutoRefreshProvider;
