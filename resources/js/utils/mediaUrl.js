import { getApiBase } from "./apiBase";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;

export function pickDisplayMediaUrl(candidates = [], fallback = null) {
  const list = Array.isArray(candidates) ? candidates : [candidates];

  for (const candidate of list) {
    if (typeof candidate !== "string") continue;

    const value = candidate.trim();
    if (!value) continue;

    if (ABSOLUTE_URL_REGEX.test(value) || value.startsWith("/")) {
      return value;
    }
  }

  return fallback;
}

export function resolveFormationImageUrl(rawUrl, apiBase = getApiBase()) {
  if (!rawUrl || typeof rawUrl !== "string") return null;

  let trimmed = rawUrl.trim();
  if (!trimmed) return null;

  // Defensive fix for legacy malformed URLs like '/http://...'
  if (/^\/+https?:\/\//i.test(trimmed)) {
    trimmed = trimmed.replace(/^\/+/, "");
  }

  if (ABSOLUTE_URL_REGEX.test(trimmed)) {
      try {
        return encodeURI(trimmed);
      } catch (e) {
        return trimmed;
      }
  }

  const normalizedPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;

  // En production, le frontend peut être servi sur un domaine différent du backend.
  // On doit donc toujours privilégier la base API pour les chemins relatifs.
  const base = (apiBase || "").replace(/\/$/, "");
  const fallbackOrigin = typeof window !== "undefined"
    ? window.location.origin.replace(/\/$/, "")
    : "";
  const finalBase = base || fallbackOrigin;
  const finalUrl = finalBase ? `${finalBase}${normalizedPath}` : normalizedPath;

  try {
    return encodeURI(finalUrl);
  } catch (e) {
    return finalUrl;
  }
}
