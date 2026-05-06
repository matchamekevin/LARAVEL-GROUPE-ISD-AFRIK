import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "isd-scroll-positions-v1";

function readStoredPositions() {
  if (typeof window === "undefined") return new Map();
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return new Map();
    return new Map(Object.entries(parsed).map(([key, value]) => [key, Number(value) || 0]));
  } catch {
    return new Map();
  }
}

function writeStoredPositions(map) {
  if (typeof window === "undefined") return;
  try {
    const data = Object.fromEntries(map.entries());
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
}

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);
  const previousPathnameRef = useRef("");
  const positionsRef = useRef(readStoredPositions());

  const getRouteStorageKey = (entry) => `${entry.pathname || ""}${entry.search || ""}${entry.hash || ""}`;
  const keyByLocationKey = `key:${location.key}`;
  const keyByRoute = `route:${getRouteStorageKey(location)}`;

  const scrollInstant = (top) => {
    const root = document.documentElement;
    const previousInlineBehavior = root.style.scrollBehavior;

    // Force immediate scroll, independent from global `scroll-behavior: smooth`.
    root.style.scrollBehavior = "auto";
    window.scrollTo({ top, left: 0, behavior: "auto" });

    if (previousInlineBehavior) {
      root.style.scrollBehavior = previousInlineBehavior;
    } else {
      root.style.removeProperty("scroll-behavior");
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && window.history?.scrollRestoration) {
      const previous = window.history.scrollRestoration;
      window.history.scrollRestoration = "manual";

      return () => {
        window.history.scrollRestoration = previous;
      };
    }
    return undefined;
  }, []);

  useEffect(() => {
    return () => {
      const top = window.scrollY || window.pageYOffset || 0;
      positionsRef.current.set(keyByLocationKey, top);
      positionsRef.current.set(keyByRoute, top);
      writeStoredPositions(positionsRef.current);
    };
  }, [keyByLocationKey, keyByRoute]);

  useEffect(() => {
    const onScroll = () => {
      const top = window.scrollY || window.pageYOffset || 0;
      positionsRef.current.set(keyByLocationKey, top);
      positionsRef.current.set(keyByRoute, top);
      writeStoredPositions(positionsRef.current);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [keyByLocationKey, keyByRoute]);

  useLayoutEffect(() => {
    const currentPathname = location.pathname;

    // Preserve native initial paint behavior on first render.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathnameRef.current = currentPathname;
      return;
    }

    if (navigationType === "POP") {
      const savedTop = positionsRef.current.get(keyByLocationKey)
        ?? positionsRef.current.get(keyByRoute);
      scrollInstant(typeof savedTop === "number" ? savedTop : 0);
      previousPathnameRef.current = currentPathname;
      return;
    }

    // For normal app navigation (navbar, links, buttons), go to top immediately.
    if (previousPathnameRef.current !== currentPathname) {
      scrollInstant(0);
    }

    previousPathnameRef.current = currentPathname;
  }, [keyByLocationKey, keyByRoute, location.pathname, navigationType]);


  return null;
}
