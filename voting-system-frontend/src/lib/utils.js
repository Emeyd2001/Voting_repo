import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"
import { MEDIA_URL } from "./config";

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Handles relative media paths from the backend.
 * @param {string} path - Relative or absolute image path.
 * @returns {string|null} - Full URL or null.
 */
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${MEDIA_URL}${normalizedPath}`;
}
