import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import ar from "./locales/ar/translation.json";
import fr from "./locales/fr/translation.json";

const deviceLang = Localization.getLocales()[0]?.languageCode ?? "ar";
const fallbackLng = deviceLang.startsWith("fr") ? "fr" : "ar";

i18n.use(initReactI18next).init({
  compatibilityJSON: "v3",
  resources: {
    ar: { translation: ar },
    fr: { translation: fr },
  },
  lng: fallbackLng,
  fallbackLng: "ar",
  interpolation: { escapeValue: false },
});

export default i18n;
