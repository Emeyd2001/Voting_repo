/**
 * i18next configuration.
 * Supports: Arabic (ar) and French (fr).
 * Default language: Arabic (RTL).
 * Language preference is persisted in localStorage under key "lang".
 */
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import ar from "./locales/ar/translation.json";
import fr from "./locales/fr/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      ar: { translation: ar },
      fr: { translation: fr },
    },
    fallbackLng: "ar",
    supportedLngs: ["ar", "fr"],
    detection: {
      order: ["localStorage", "navigator"],
      lookupLocalStorage: "lang",
      caches: ["localStorage"],
    },
    interpolation: {
      escapeValue: false,
    },
  });

/** Apply HTML dir + lang attributes based on the active language. */
export function applyLangAttributes(lng) {
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === "ar" ? "rtl" : "ltr";
}

// Apply on initial load
applyLangAttributes(i18n.language?.startsWith("fr") ? "fr" : "ar");

// Re-apply whenever the language changes
i18n.on("languageChanged", (lng) => {
  applyLangAttributes(lng === "fr" ? "fr" : "ar");
});

export default i18n;
