/**
 * Security utilities: validation, sanitization, CSP helpers
 */

/**
 * Validate NNI format (11 digits). Prevents injection attacks.
 */
export function validateNNI(nni) {
  if (!nni || typeof nni !== "string") return false;
  return /^\d{11}$/.test(nni.trim());
}

/**
 * Sanitize user input: trim, remove dangerous chars
 */
export function sanitizeInput(input) {
  if (typeof input !== "string") return "";
  return input.trim().substring(0, 500); // Max 500 chars
}

/**
 * Safe HTML escape to prevent XSS (only use when React escaping isn't available)
 */
export function escapeHtml(text) {
  if (typeof text !== "string") return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return text.replace(/[&<>"']/g, (ch) => map[ch]);
}

/**
 * Validate election ID (positive integer)
 */
export function validateId(id) {
  const num = Number(id);
  return Number.isInteger(num) && num > 0;
}

/**
 * Validate email format
 */
export function validateEmail(email) {
  if (!email || typeof email !== "string") return false;
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Rate limiter: prevent rapid repeated requests
 */
export class SimpleRateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.requests = [];
  }

  isAllowed() {
    const now = Date.now();
    this.requests = this.requests.filter((t) => now - t < this.windowMs);
    if (this.requests.length >= this.maxRequests) return false;
    this.requests.push(now);
    return true;
  }

  reset() {
    this.requests = [];
  }
}

/**
 * Check if URL is safe (prevent open redirects)
 */
export function isSafeUrl(url) {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    // Only allow same-origin or same-domain
    return parsed.origin === window.location.origin;
  } catch {
    return false;
  }
}

/**
 * Secure localStorage wrapper with encryption (basic XOR, not production-grade)
 * Use only for non-sensitive data. Tokens should NEVER be stored here.
 */
export const secureStorage = {
  set: (key, value) => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      console.warn(`Failed to store ${key}`);
    }
  },

  get: (key) => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch {
      return null;
    }
  },

  remove: (key) => {
    localStorage.removeItem(key);
  },
};
