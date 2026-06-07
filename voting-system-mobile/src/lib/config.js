/**
 * App configuration for React Native.
 * Note: No import.meta.env (Vite-only). Use hardcoded values or expo-constants.
 */

// ⚠️ غيّر هذا العنوان ليطابق IP جهازك الذي يشغّل الـ Backend
// مثال: http://192.168.1.10:8000/api
export const API_BASE_URL = "http://192.168.100.47:8000/api";
export const MEDIA_URL = "http://192.168.100.47:8000";

export const TOKEN_STORAGE_KEY = "elections_auth";

/** Version displayed on the Profile page. */
export const APP_VERSION = "v2.0.0-mobile";
