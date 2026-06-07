
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  const host = window.location.hostname;
  return `http://${host}:8000/api`;
};

const getMediaUrl = () => {
  if (import.meta.env.VITE_MEDIA_URL) return import.meta.env.VITE_MEDIA_URL;
  const host = window.location.hostname;
  return `http://${host}:8000`;
};

export const API_BASE_URL = getApiUrl();
export const MEDIA_URL = getMediaUrl();


export const TOKEN_STORAGE_KEY = "elections_auth";

/** Version displayed on the Settings page. */
export const APP_VERSION = "v2.0.0";
