const COUNTRY_CODE_TO_ID = { TG: 1, BJ: 2, BF: 3, CI: 4, NE: 5, OT: 6 };
const COUNTRY_ID_TO_CODE = { 1: "TG", 2: "BJ", 3: "BF", 4: "CI", 5: "NE", 6: "OT" };

export function countryCodeToId(code) {
  return COUNTRY_CODE_TO_ID[code] || 1;
}

export function countryIdToCode(id) {
  return COUNTRY_ID_TO_CODE[id] || "TG";
}

const SELECTED_COUNTRY_KEY = "isd_selected_country";

export function getStoredCountry() {
  return localStorage.getItem(SELECTED_COUNTRY_KEY) || "TG";
}

export function setStoredCountry(code) {
  localStorage.setItem(SELECTED_COUNTRY_KEY, code);
}
