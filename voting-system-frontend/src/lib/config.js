
const normalize = (raw) => {
  if (!raw) return raw;
  let v = String(raw).trim();
  // ensure protocol is present (default to https)
  if (!/^https?:\/\//i.test(v)) {
    v = `https://${v}`;
  }
  // remove trailing slash(s)
  v = v.replace(/\/+$/g, "");
  // ensure API base contains /api
  if (!v.endsWith("/api")) v = v + "/api";
  return v;
};

const getApiUrl = () => {
  const raw = import.meta.env.VITE_API_URL;
  if (raw) return normalize(raw);
  const host = window.location.hostname;
  return `http://${host}:8000/api`;
};

const getMediaUrl = () => {
  const raw = import.meta.env.VITE_MEDIA_URL;
  if (raw) {
    return String(raw).trim().replace(/\/+$/, "");
  }
  const host = window.location.hostname;
  return `http://${host}:8000`;
};

export const API_BASE_URL = getApiUrl();
export const MEDIA_URL = getMediaUrl();


export const TOKEN_STORAGE_KEY = "elections_auth";

/** Version displayed on the Settings page. */
export const APP_VERSION = "v2.0.0";
