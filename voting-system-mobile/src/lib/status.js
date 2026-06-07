import i18n from "../i18n";

export const STATUS_AR = {
  draft: "مسودة",
  scheduled: "قادمة",
  active: "نشطة",
  closed: "منتهية",
  archived: "مؤرشفة",
};

export const labelStatus = (status, t = null) => {
  if (t) return t(`status.${status}`, { defaultValue: STATUS_AR[status] ?? status ?? "" });
  return STATUS_AR[status] ?? status ?? "";
};

/** Returns RN-compatible color/style info for each status */
export const statusStyle = (status) => {
  switch (status) {
    case "active":
      return { color: "#1B7C3D", bg: "#E6F5EE", border: "#1B7C3D" };
    case "scheduled":
      return { color: "#1D4ED8", bg: "#EFF6FF", border: "#93C5FD" };
    case "closed":
      return { color: "#6B7280", bg: "#F3F4F6", border: "#D1D5DB" };
    case "archived":
      return { color: "#71717A", bg: "#F4F4F5", border: "#D4D4D8" };
    case "draft":
    default:
      return { color: "#B45309", bg: "#FFFBEB", border: "#FCD34D" };
  }
};

export const isVotable = (status) => status === "active";

export const hasPublicResults = (status) =>
  status === "closed" || status === "archived";

/**
 * Formats an ISO date string — dynamically selects locale based on active language.
 */
export const formatDate = (iso, withTime = false, locale) => {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  
  const currentLang = locale || (i18n && i18n.language === "fr" ? "fr-FR" : "ar-EG");
  
  const dateOpts = { year: "numeric", month: "long", day: "numeric" };
  if (withTime) {
    return new Intl.DateTimeFormat(currentLang, {
      ...dateOpts,
      hour: "2-digit",
      minute: "2-digit",
    }).format(d);
  }
  return new Intl.DateTimeFormat(currentLang, dateOpts).format(d);
};

export const formatNumber = (value, locale) => {
  if (value == null) return "";
  const num = Number(value);
  if (Number.isNaN(num)) return String(value);
  
  const currentLang = locale || (i18n && i18n.language === "fr" ? "fr-FR" : "ar-EG");
  
  return num.toLocaleString(currentLang);
};
