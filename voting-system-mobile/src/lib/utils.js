import { MEDIA_URL } from "./config";

/**
 * Builds a full image URL from a backend relative path.
 */
export function getImageUrl(path) {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${MEDIA_URL}${normalizedPath}`;
}

/**
 * Given a candidate-like object, return the best image path (string) if available.
 * Checks multiple common backend field names used across APIs.
 */
export function pickCandidateImage(candidate) {
  if (!candidate || typeof candidate !== "object") return null;
  return (
    candidate.image ||
    candidate.profile_image ||
    candidate.photo ||
    candidate.avatar ||
    candidate.image_url ||
    candidate.profile_image_url ||
    candidate.photo_url ||
    candidate.picture ||
    candidate.image_path ||
    candidate.photo_path ||
    null
  );
}

/**
 * Helper that returns an RN Image `source` object for a candidate.
 */
export function candidateImageSource(candidate) {
  const path = pickCandidateImage(candidate);
  if (!path) return null;
  const url = getImageUrl(path);
  return url ? { uri: url } : null;
}
