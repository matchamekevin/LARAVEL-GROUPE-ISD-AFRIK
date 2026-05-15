import { useCallback, useEffect, useRef } from "react";
import { getMutationTimestamp } from "../utils/mutationBus";

export function useLivePolling(
  refreshFn,
  {
    enabled = true,
    intervalMs = 2500,
    runOnFocus = true,
    runOnOnline = true,
    runOnVisibility = true,
    listenMutations = true,
  } = {}
) {
  const refreshRef = useRef(refreshFn);
  const inFlightRef = useRef(false);
  const lastMutationRef = useRef(getMutationTimestamp());

  useEffect(() => {
    refreshRef.current = refreshFn;
  }, [refreshFn]);

  const safeRefresh = useCallback(async () => {
    if (!enabled || inFlightRef.current) {
      return;
    }
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      return;
    }
    if (typeof navigator !== "undefined" && navigator.onLine === false) {
      return;
    }
    inFlightRef.current = true;
    try {
      await Promise.resolve(refreshRef.current?.());
    } catch {
      // Silence: les pages gerent deja leurs messages d'erreur
    } finally {
      inFlightRef.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled || typeof window === "undefined") {
      return;
    }
    safeRefresh();
    const timerId = window.setInterval(() => {
      safeRefresh();
    }, Math.max(2000, Number(intervalMs) || 2500));
    return () => {
      window.clearInterval(timerId);
    };
  }, [enabled, intervalMs, safeRefresh]);

  useEffect(() => {
    if (!enabled || !listenMutations || typeof window === "undefined") {
      return;
    }
    const onMutation = () => {
      const now = getMutationTimestamp();
      if (now !== lastMutationRef.current) {
        lastMutationRef.current = now;
        safeRefresh();
      }
    };
    window.addEventListener("isd-mutation", onMutation);
    window.addEventListener("storage", (e) => {
      if (e.key === "_isd_mutation") onMutation();
    });
    return () => {
      window.removeEventListener("isd-mutation", onMutation);
    };
  }, [enabled, listenMutations, safeRefresh]);

  useEffect(() => {
    if (!enabled || !runOnFocus || typeof window === "undefined") {
      return;
    }
    const onFocus = () => { safeRefresh(); };
    window.addEventListener("focus", onFocus);
    return () => { window.removeEventListener("focus", onFocus); };
  }, [enabled, runOnFocus, safeRefresh]);

  useEffect(() => {
    if (!enabled || !runOnOnline || typeof window === "undefined") {
      return;
    }
    const onOnline = () => { safeRefresh(); };
    window.addEventListener("online", onOnline);
    return () => { window.removeEventListener("online", onOnline); };
  }, [enabled, runOnOnline, safeRefresh]);

  useEffect(() => {
    if (!enabled || !runOnVisibility || typeof document === "undefined") {
      return;
    }
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        safeRefresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [enabled, runOnVisibility, safeRefresh]);
}

export default useLivePolling;
