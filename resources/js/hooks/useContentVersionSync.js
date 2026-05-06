import { useCallback, useEffect, useRef } from 'react';

const STORAGE_KEY = 'isd-content-version';

export default function useContentVersionSync({
  enabled = true,
  intervalMs = 2500,
  onVersionChange,
} = {}) {
  const inFlightRef = useRef(false);
  const lastVersionRef = useRef(null);
  const onVersionChangeRef = useRef(onVersionChange);

  useEffect(() => {
    onVersionChangeRef.current = onVersionChange;
  }, [onVersionChange]);

  const notifyChange = useCallback((version, updatedAt) => {
    if (!version || version === lastVersionRef.current) return;

    lastVersionRef.current = version;
    onVersionChangeRef.current?.({ version, updatedAt });

    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('isd-content-version', { detail: { version, updatedAt } }));
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ version, updatedAt, at: Date.now() }));
      } catch (_error) {
        // ignore storage errors
      }
    }
  }, []);

  const fetchVersion = useCallback(async () => {
    if (!enabled || inFlightRef.current) return;
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') return;
    if (typeof navigator !== 'undefined' && navigator.onLine === false) return;

    inFlightRef.current = true;
    try {
      const response = await fetch(`/api/content-version?t=${Date.now()}`, {
        cache: 'no-store',
        headers: { Accept: 'application/json' },
      });
      if (!response.ok) return;
      const payload = await response.json();
      const version = String(payload?.version || '').trim();
      const updatedAt = Number(payload?.updated_at || 0);
      if (!lastVersionRef.current) {
        lastVersionRef.current = version;
        return;
      }
      notifyChange(version, updatedAt);
    } catch (_error) {
      // silent
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled, notifyChange]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    fetchVersion();
    const id = window.setInterval(fetchVersion, Math.max(1200, Number(intervalMs) || 2500));
    return () => window.clearInterval(id);
  }, [enabled, intervalMs, fetchVersion]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const onFocus = () => fetchVersion();
    const onOnline = () => fetchVersion();
    const onVisibility = () => {
      if (document.visibilityState === 'visible') fetchVersion();
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onOnline);
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onOnline);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [enabled, fetchVersion]);

  useEffect(() => {
    if (!enabled || typeof window === 'undefined') return;
    const onStorage = (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) return;
      try {
        const payload = JSON.parse(event.newValue);
        notifyChange(String(payload?.version || ''), Number(payload?.updatedAt || 0));
      } catch (_error) {
        // ignore
      }
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [enabled, notifyChange]);
}

