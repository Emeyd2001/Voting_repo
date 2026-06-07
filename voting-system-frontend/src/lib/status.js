/**
 * Mapping des statuts d'election entre la valeur backend (anglais) et l'affichage (arabe).
 *
 * Backend statuses : draft | scheduled | active | closed | archived
 */

export const STATUS_AR = {
  draft: "مسودة",
  scheduled: "قادمة",
  active: "نشطة",
  closed: "منتهية",
  archived: "مؤرشفة",
};

/**
 * Renvoie le libellé localisé d'un statut backend.
 * Pass `t` (from useTranslation) for i18n support; falls back to Arabic labels.
 */
export const labelStatus = (status, t = null) => {
  if (t) return t(`status.${status}`, { defaultValue: STATUS_AR[status] ?? status ?? "" });
  return STATUS_AR[status] ?? status ?? "";
};

/**
 * Couleurs/styles associes a chaque statut pour les badges.
 * Retourne un objet { className, dot? }.
 */
export const statusStyle = (status) => {
  switch (status) {
    case "active":
      return {
        badge:
          "bg-[#e6f5ee] text-primary border border-primary/20 shadow-sm shadow-primary/10",
        dot: "bg-primary animate-pulse",
        accent: "bg-primary",
      };
    case "scheduled":
      return {
        badge: "bg-blue-50 text-blue-700 border border-blue-200",
        dot: "bg-blue-500",
        accent: "bg-blue-500",
      };
    case "closed":
      return {
        badge:
          "bg-surface-container text-secondary border border-outline-variant/20",
        dot: "bg-secondary",
        accent: "bg-outline-variant/40",
      };
    case "archived":
      return {
        badge: "bg-zinc-100 text-zinc-600 border border-zinc-200",
        dot: "bg-zinc-500",
        accent: "bg-zinc-300",
      };
    case "draft":
    default:
      return {
        badge: "bg-amber-50 text-amber-700 border border-amber-200",
        dot: "bg-amber-500",
        accent: "bg-amber-300",
      };
  }
};

export const isVotable = (status) => status === "active";

/** Indique si les resultats publics sont disponibles. */
export const hasPublicResults = (status) =>
  status === "closed" || status === "archived";

/** Formate une date ISO en format lisible selon la langue active. */
export const formatDate = (iso, withTime = false, locale = null) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const resolvedLocale =
    locale ?? (document.documentElement.lang === "fr" ? "fr-FR" : "ar-EG");
  const dateOpts = { year: "numeric", month: "long", day: "numeric" };
  if (withTime) {
    return new Intl.DateTimeFormat(resolvedLocale, {
      ...dateOpts,
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat(resolvedLocale, dateOpts).format(d);
};

/** Convertit une date ISO en valeur "yyyy-MM-ddTHH:mm" pour <input type="datetime-local">. */
export const toDatetimeLocalValue = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}`
  );
};

/** Convertit une valeur de <input type="datetime-local"> en ISO 8601 (UTC). */
export const fromDatetimeLocalValue = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

/** Formate un nombre selon la langue active (fr-FR pour le français, ar-EG pour l'arabe). */
export const formatNumber = (value, locale = null) => {
  if (value == null) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return value;
  const resolvedLocale =
    locale ?? (document.documentElement.lang === "fr" ? "fr-FR" : "ar-EG");
  return num.toLocaleString(resolvedLocale);
};

