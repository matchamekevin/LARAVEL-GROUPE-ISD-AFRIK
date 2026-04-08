import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

export default function ScrollToTop() {
  const location = useLocation();
  const navigationType = useNavigationType();
  const isFirstRender = useRef(true);
  const previousPathnameRef = useRef("");
  const positionsByKeyRef = useRef(new Map());

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
      positionsByKeyRef.current.set(location.key, window.scrollY || window.pageYOffset || 0);
    };
  }, [location.key]);

  useLayoutEffect(() => {
    const currentPathname = location.pathname;

    // Preserve native initial paint behavior on first render.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      previousPathnameRef.current = currentPathname;
      return;
    }

    if (navigationType === "POP") {
      const savedTop = positionsByKeyRef.current.get(location.key);
      scrollInstant(typeof savedTop === "number" ? savedTop : 0);
      previousPathnameRef.current = currentPathname;
      return;
    }

    // For normal app navigation (navbar, links, buttons), go to top immediately.
    if (previousPathnameRef.current !== currentPathname) {
      scrollInstant(0);
    }

    previousPathnameRef.current = currentPathname;
  }, [location.key, location.pathname, navigationType]);


  return null;
}
