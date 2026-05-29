const COUNTRY_CODE_TO_ID = { TG: "4b019109-b586-4450-a420-c36cb065ace8" };
const COUNTRY_ID_TO_CODE = { "4b019109-b586-4450-a420-c36cb065ace8": "TG" };

export function countryCodeToId(code) {
  return COUNTRY_CODE_TO_ID[code] || "4b019109-b586-4450-a420-c36cb065ace8";
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
