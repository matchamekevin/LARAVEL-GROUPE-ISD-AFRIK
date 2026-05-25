import { useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "scroll_positions";

function loadPositions() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function savePositions(positions) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
  } catch {}
}

function forceScroll(y) {
  const top = y || 0;
  window.scrollTo(0, top);
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const cache = useRef(null);
  const debounceTimer = useRef(null);
  const prevPathname = useRef(pathname);

  useLayoutEffect(() => {
    window.history.scrollRestoration = "manual";
  });

  useLayoutEffect(() => {
    if (!cache.current) {
      cache.current = loadPositions();
    }
    const positions = cache.current;

    if (prevPathname.current !== pathname) {
      prevPathname.current = pathname;
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
        savePositions(cache.current);
      }
    }

    if (navigationType === "POP") {
      const savedY = positions[pathname];
      console.log(`[ScrollToTop] POP path=${pathname} savedY=${savedY}`, JSON.stringify(positions));
      if (savedY !== undefined) {
        forceScroll(savedY);

        const raf = requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            console.log(`[ScrollToTop] POP RAF restore -> scrollY=${window.scrollY}`);
            forceScroll(savedY);
          });
        });
        const t1 = setTimeout(() => {
          console.log(`[ScrollToTop] POP 200ms restore -> scrollY=${window.scrollY}`);
          forceScroll(savedY);
        }, 200);
        const t2 = setTimeout(() => {
          console.log(`[ScrollToTop] POP 800ms restore -> scrollY=${window.scrollY}`);
          forceScroll(savedY);
        }, 800);
        const t3 = setTimeout(() => {
          console.log(`[ScrollToTop] POP 1500ms restore -> scrollY=${window.scrollY}`);
          forceScroll(savedY);
        }, 1500);

        return () => {
          cancelAnimationFrame(raf);
          clearTimeout(t1);
          clearTimeout(t2);
          clearTimeout(t3);
        };
      }
    }

    // PUSH / REPLACE — scroll to top
    forceScroll(0);
    console.log(`[ScrollToTop] ${navigationType} path=${pathname} -> scrollY=${window.scrollY}`);
    delete positions[pathname];
    savePositions(positions);

    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => forceScroll(0));
    });
    const t1 = setTimeout(() => forceScroll(0), 200);
    const t2 = setTimeout(() => {
      if (window.scrollY !== 0) forceScroll(0);
    }, 800);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [pathname, navigationType]);

  useEffect(() => {
    if (!cache.current) cache.current = {};

    const save = () => {
      const y = window.scrollY;
      if (y === 0) {
        delete cache.current[pathname];
      } else {
        cache.current[pathname] = y;
      }
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => savePositions(cache.current), 300);
    };

    window.addEventListener("scroll", save, { passive: true });
    return () => window.removeEventListener("scroll", save);
  }, [pathname]);

  useEffect(() => {
    const sync = () => {
      if (cache.current) savePositions(cache.current);
    };
    window.addEventListener("beforeunload", sync);
    return () => window.removeEventListener("beforeunload", sync);
  }, []);

  return null;
}
