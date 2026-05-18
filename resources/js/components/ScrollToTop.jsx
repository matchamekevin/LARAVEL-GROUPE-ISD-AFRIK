import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  const prevPath = useRef(pathname);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (pathname === prevPath.current) return;
    prevPath.current = pathname;

    const scroll = () => window.scrollTo(0, 0);

    // Try immediately
    scroll();
    // Retry after a frame (lazy components may not be rendered yet)
    const raf = requestAnimationFrame(() => requestAnimationFrame(scroll));
    // Final retry after a small delay
    const timer = setTimeout(scroll, 100);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
