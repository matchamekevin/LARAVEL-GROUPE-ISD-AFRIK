import { getApiBase } from "./apiBase";

const ABSOLUTE_URL_REGEX = /^https?:\/\//i;
const LOCAL_HOSTNAME_REGEX = /^(localhost|127\.0\.0\.1|::1)$/i;

function isLocalMediaUrl(url) {
  try {
    const parsed = new URL(url);
    return LOCAL_HOSTNAME_REGEX.test(parsed.hostname);
  } catch (_error) {
    return false;
  }
}

function normalizeStorageCandidate(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (trimmed.startsWith("/storage/")) {
    return trimmed;
  }

  if (ABSOLUTE_URL_REGEX.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      if (parsed.pathname.startsWith("/storage/")) {
        const currentOrigin = typeof window !== "undefined" ? window.location.origin : "";
        const currentHost = typeof window !== "undefined" ? window.location.hostname : "";
        const isLocalHost = LOCAL_HOSTNAME_REGEX.test(currentHost);
        const isNgrokMedia = /\.ngrok-free\.dev$/i.test(parsed.hostname);

        // If we are running locally, or the media URL is from an old ngrok domain,
        // always downgrade absolute storage URLs to a same-origin path.
        // This avoids browsers blocking unexpected HTML/error responses as "opaque"
        // and fixes stale APP_URL absolute links stored in DB.
        if (isLocalHost || isNgrokMedia) {
          return parsed.pathname;
        }

        if (!currentOrigin || parsed.origin === currentOrigin || isLocalMediaUrl(trimmed)) {
          return parsed.pathname;
        }
      }
    } catch (_error) {
      return null;
    }
  }

  return null;
}

export function pickDisplayMediaUrl(candidates = [], fallback = null) {
  const list = Array.isArray(candidates) ? candidates : [candidates];

  for (const candidate of list) {
    if (typeof candidate !== "string") continue;

    const value = candidate.trim();
    if (!value) continue;

    const localStoragePath = normalizeStorageCandidate(value);
    if (localStoragePath) {
      return localStoragePath;
    }

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
