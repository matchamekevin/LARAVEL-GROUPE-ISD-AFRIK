import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "isd:scroll:positions:v1";
const MAX_ENTRIES = 200;
const PERSIST_DELAY_MS = 120;

function resolveScrollKey(location) {
  if (location?.key && location.key !== "default") {
    return `k:${location.key}`;
  }

  return `u:${location?.pathname || ""}${location?.search || ""}${location?.hash || ""}`;
}

function clampScroll(value) {
  const nextValue = Number(value);
  if (!Number.isFinite(nextValue) || nextValue <= 0) {
    return 0;
  }

  return Math.floor(nextValue);
}

function normalizePositions(payload) {
  const source = payload?.positions && typeof payload.positions === "object"
    ? payload.positions
    : payload && typeof payload === "object"
      ? payload
      : {};

  const normalized = {};

  Object.entries(source).forEach(([key, entry]) => {
    if (!key) {
      return;
    }

    if (typeof entry === "number") {
      const y = clampScroll(entry);
      if (y > 0) {
        normalized[key] = { y, updatedAt: Date.now() };
      }
      return;
    }

    if (entry && typeof entry === "object") {
      const y = clampScroll(entry.y);
      if (y > 0) {
        normalized[key] = {
          y,
          updatedAt: Number(entry.updatedAt) || Date.now(),
        };
      }
    }
  });

  return normalized;
}

function prunePositions(positions) {
  const entries = Object.entries(positions || {}).sort(
    (a, b) => Number(b[1]?.updatedAt || 0) - Number(a[1]?.updatedAt || 0)
  );

  return Object.fromEntries(entries.slice(0, MAX_ENTRIES));
}

function loadPositions() {
  if (typeof window === "undefined") {
    return {};
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {};
    }
    return normalizePositions(JSON.parse(raw));
  } catch {
    return {};
  }
}

function persistPositions(positions) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    const pruned = prunePositions(positions);
    window.sessionStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, positions: pruned })
    );
  } catch {}
}

function setWindowScroll(y) {
  if (typeof window === "undefined") {
    return;
  }

  const top = clampScroll(y);
  window.scrollTo(0, top);
  if (document?.documentElement) {
    document.documentElement.scrollTop = top;
  }
  if (document?.body) {
    document.body.scrollTop = top;
  }
}

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const scrollKey = resolveScrollKey(location);
  const positionsRef = useRef(loadPositions());
  const activeKeyRef = useRef(scrollKey);
  const persistTimerRef = useRef(null);
  const rafSaveRef = useRef(null);

  const flushPersist = () => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
      persistTimerRef.current = null;
    }
    persistPositions(positionsRef.current);
  };

  const schedulePersist = () => {
    if (persistTimerRef.current) {
      clearTimeout(persistTimerRef.current);
    }
    persistTimerRef.current = setTimeout(flushPersist, PERSIST_DELAY_MS);
  };

  const saveCurrentPosition = (key) => {
    if (typeof window === "undefined" || !key) {
      return;
    }

    const currentY = clampScroll(window.scrollY || window.pageYOffset || 0);

    if (currentY === 0) {
      delete positionsRef.current[key];
    } else {
      positionsRef.current[key] = {
        y: currentY,
        updatedAt: Date.now(),
      };
    }

    schedulePersist();
  };

  const restoreScrollPosition = (targetY, withRetry = false) => {
    setWindowScroll(targetY);
    const rafOne = requestAnimationFrame(() => {
      setWindowScroll(targetY);
    });
    const rafTwo = requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setWindowScroll(targetY);
      });
    });
    const timers = [];

    if (withRetry && targetY > 0 && typeof window !== "undefined") {
      [120, 280, 520, 900, 1400].forEach((delay) => {
        const timer = window.setTimeout(() => {
          const delta = Math.abs((window.scrollY || 0) - targetY);
          if (delta > 2) {
            setWindowScroll(targetY);
          }
        }, delay);
        timers.push(timer);
      });
    }

    return () => {
      cancelAnimationFrame(rafOne);
      cancelAnimationFrame(rafTwo);
      timers.forEach((timerId) => {
        clearTimeout(timerId);
      });
    };
  };

  useEffect(() => {
    if (typeof window === "undefined" || !("scrollRestoration" in window.history)) {
      return;
    }

    const previousValue = window.history.scrollRestoration;
    window.history.scrollRestoration = "manual";

    return () => {
      window.history.scrollRestoration = previousValue;
    };
  }, []);

  useLayoutEffect(() => {
    const previousKey = activeKeyRef.current;
    if (previousKey && previousKey !== scrollKey) {
      saveCurrentPosition(previousKey);
      flushPersist();
    }

    activeKeyRef.current = scrollKey;

    const targetY =
      navigationType === "POP" ? clampScroll(positionsRef.current?.[scrollKey]?.y) : 0;

    const cleanupRestore = restoreScrollPosition(targetY, navigationType === "POP");

    return () => {
      cleanupRestore();
    };
  }, [navigationType, scrollKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleScroll = () => {
      if (rafSaveRef.current !== null) {
        return;
      }

      rafSaveRef.current = requestAnimationFrame(() => {
        rafSaveRef.current = null;
        saveCurrentPosition(scrollKey);
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafSaveRef.current !== null) {
        cancelAnimationFrame(rafSaveRef.current);
        rafSaveRef.current = null;
      }
      saveCurrentPosition(scrollKey);
      flushPersist();
    };
  }, [scrollKey]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        saveCurrentPosition(scrollKey);
        flushPersist();
      }
    };

    const handlePageHide = () => {
      saveCurrentPosition(scrollKey);
      flushPersist();
    };

    window.addEventListener("pagehide", handlePageHide);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      window.removeEventListener("pagehide", handlePageHide);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [scrollKey]);

  return null;
}
