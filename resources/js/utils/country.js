import api from "../axios";

const CACHE_KEY = "isd_country_map";
const CACHE_TTL = 86400000; // 24h

let codeToId = {};
let idToCode = {};
let defaultId = null;

function isExpired(timestamp) {
  return Date.now() - timestamp > CACHE_TTL;
}

async function fetchCountryMap() {
  try {
    const { data } = await api.get("/pays");
    const list = Array.isArray(data) ? data : data?.data ?? [];
    const now = Date.now();
    const map = { alpha2: {}, id: {} };
    let def = null;

    for (const country of list) {
      const code = country.alpha2 || country.code;
      if (code && country.id) {
        map.alpha2[code] = country.id;
        map.id[country.id] = code;
      }
      if (!def && country.id) {
        def = country.id;
      }
    }

    localStorage.setItem(CACHE_KEY, JSON.stringify({ map, defaultId: def, timestamp: now }));
    codeToId = map.alpha2;
    idToCode = map.id;
    defaultId = def;
  } catch {
    // silencieux
  }
}

function loadFromCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return false;

    const { map, defaultId: defId, timestamp } = JSON.parse(raw);
    if (isExpired(timestamp)) {
      localStorage.removeItem(CACHE_KEY);
      return false;
    }

    if (map?.alpha2 && Object.keys(map.alpha2).length > 0) {
      codeToId = map.alpha2;
      idToCode = map.id ?? {};
      defaultId = defId ?? null;
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

// Charge le cache au démarrage, rafraîchit en arrière-plan si expiré
loadFromCache();
fetchCountryMap();

export function countryCodeToId(code) {
  return codeToId[code] || defaultId || null;
}

export function countryIdToCode(id) {
  return idToCode[id] || "TG";
}

export async function refreshCountryMap() {
  localStorage.removeItem(CACHE_KEY);
  await fetchCountryMap();
}

const SELECTED_COUNTRY_KEY = "isd_selected_country";

export function getStoredCountry() {
  return localStorage.getItem(SELECTED_COUNTRY_KEY) || "TG";
}

export function setStoredCountry(code) {
  localStorage.setItem(SELECTED_COUNTRY_KEY, code);
}
