import { getApiBase } from "./apiBase";

export function resolveFormationImageUrl(rawUrl, apiBase = getApiBase()) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  const trimmed = rawUrl.trim();
  if (!trimmed) return null;

  if (/^https?:\/\//i.test(trimmed)) {
      try {
        return encodeURI(trimmed);
      } catch (e) {
        return trimmed;
      }
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  if (typeof window !== "undefined") {
    const hostIsLocal = ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (!hostIsLocal) {
      const origin = window.location.origin.replace(/\/$/, "");
        try {
          return encodeURI(`${origin}${normalizedPath}`);
        } catch (e) {
          return `${origin}${normalizedPath}`;
        }
    }
  }

  const base = (apiBase || "").replace(/\/$/, "");
    try {
      const final = base ? `${base}${normalizedPath}` : normalizedPath;
      return encodeURI(final);
    } catch (e) {
      return base ? `${base}${normalizedPath}` : normalizedPath;
    }
}