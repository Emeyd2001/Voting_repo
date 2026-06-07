/**
 * In-memory access token store.
 *
 * The access token is intentionally NOT written to localStorage or
 * sessionStorage. It exists only for the lifetime of the current browser tab.
 * On every fresh page load the token is silently restored from the HttpOnly
 * refresh cookie via initAuth() (see auth.js).
 *
 * This module has zero dependencies and must never import from the rest of the
 * app to avoid circular import chains.
 */

let _accessToken = null;

export const tokenManager = {
  /** Returns the current access token, or null when not authenticated. */
  getToken: () => _accessToken,

  /** Stores a new access token obtained from the login or refresh endpoint. */
  setToken: (token) => {
    _accessToken = token;
  },

  /** Clears the token — called on logout or when a refresh attempt fails. */
  clear: () => {
    _accessToken = null;
  },
};
