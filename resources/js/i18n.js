import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import fr from "./locales/fr/translation.json";
import en from "./locales/en/translation.json";
import es from "./locales/es/translation.json";
import de from "./locales/de/translation.json";

i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: fr },
    en: { translation: en },
    es: { translation: es },
    de: { translation: de }
  },
  lng: localStorage.getItem("lang") || "fr",
  fallbackLng: "fr",
  interpolation: { escapeValue: false }
});

export default i18n;