const COUNTRY_CODE_TO_ID = { TG: "2185de10-a169-43af-8513-5fa9a2117031" };
const COUNTRY_ID_TO_CODE = { "2185de10-a169-43af-8513-5fa9a2117031": "TG" };

export function countryCodeToId(code) {
  return COUNTRY_CODE_TO_ID[code] || "2185de10-a169-43af-8513-5fa9a2117031";
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
