import React, { useCallback, useEffect, useRef, useState } from 'react';

const DEFAULT_TOAST_DURATION_MS = 3500;

export function useAdminToast(durationMs = DEFAULT_TOAST_DURATION_MS) {
  const [toast, setToast] = useState(null);
  const timerRef = useRef(null);

  const clearToast = useCallback(() => {
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    setToast(null);
  }, []);

  const showToast = useCallback(
    (message, type = 'success') => {
      if (!message) return;

      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }

      setToast({ message, type });
      timerRef.current = window.setTimeout(() => {
        setToast(null);
        timerRef.current = null;
      }, durationMs);
    },
    [durationMs]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toast, showToast, clearToast };
}

export default function AdminToast({ toast }) {
  if (!toast?.message) {
    return null;
  }

  const typeClass = toast.type === 'error' ? 'error' : 'success';

  return <div className={`admin-toast ${typeClass}`}>{toast.message}</div>;
}
