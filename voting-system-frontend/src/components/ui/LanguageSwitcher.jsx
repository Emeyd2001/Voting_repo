import { useTranslation } from "react-i18next";
import { applyLangAttributes } from "../../i18n";

/**
 * Minimal language toggle button: Arabic ↔ French.
 * Persists selection in localStorage (key: "lang").
 */
export default function LanguageSwitcher({ className = "" }) {
  const { i18n, t } = useTranslation();
  const currentLang = i18n.language?.startsWith("fr") ? "fr" : "ar";

  const toggle = () => {
    const next = currentLang === "ar" ? "fr" : "ar";
    i18n.changeLanguage(next);
    applyLangAttributes(next);
  };

  return (
    <button
      onClick={toggle}
      title={t("lang.switch")}
      className={`flex items-center gap-1.5 rounded-xl border border-outline-variant/30 bg-surface-container px-3 py-1.5 text-xs font-bold text-on-surface transition-all hover:bg-surface-container-high hover:shadow-sm active:scale-[0.97] ${className}`}
    >
      <span className="text-sm leading-none">
        {currentLang === "ar" ? "🇲🇷" : "🇫🇷"}
      </span>
      {t("lang.switch")}
    </button>
  );
}
