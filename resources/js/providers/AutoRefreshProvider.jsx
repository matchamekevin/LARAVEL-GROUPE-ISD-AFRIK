import React, { useCallback, useEffect, useRef } from 'react';
import useContentVersionSync from '../hooks/useContentVersionSync';
import { useRealtimeContent } from '../hooks/useRealtime';

const STORAGE_KEY = 'isd-content-version';

export const AutoRefreshProvider = ({ children }) => {
  const isDev = import.meta.env.DEV;
  const host = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocal = host === 'localhost' || host === '127.0.0.1' || host === '::1';
  const enabled = !isDev && !isLocal;
  const cooldownRef = useRef(0);

  const handleContentChanged = useCallback(() => {
    const now = Date.now();
    if (now - cooldownRef.current < 2000) return;

    if (document.visibilityState !== 'visible') {
      window.__autoRefreshPending = true;
      return;
    }

    cooldownRef.current = now;
    window.dispatchEvent(new CustomEvent('content-changed', { detail: { at: now } }));
  }, []);

  // Real-time WebSocket: instant updates
  useRealtimeContent({ onContentChange: handleContentChanged });

  // Fallback polling (long interval, only when WebSocket is unavailable)
  useContentVersionSync({
    enabled,
    intervalMs: 60000,
    onVersionChange: handleContentChanged,
  });

  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && window.__autoRefreshPending) {
        window.__autoRefreshPending = false;
        handleContentChanged();
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [handleContentChanged]);

  return <>{children}</>;
};

export default AutoRefreshProvider;
