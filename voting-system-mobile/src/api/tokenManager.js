/**
 * Secure token manager using expo-secure-store.
 * Replaces the in-memory approach used in the web app.
 */
import * as SecureStore from "expo-secure-store";

const TOKEN_KEY = "elections_jwt_access";

export const tokenManager = {
  /** Returns the current access token synchronously from cache, or null. */
  _cache: null,

  getToken() {
    return this._cache;
  },

  /** Stores token in both memory cache and SecureStore. */
  async setToken(token) {
    this._cache = token;
    try {
      await SecureStore.setItemAsync(TOKEN_KEY, token);
    } catch {
      // SecureStore unavailable on web/emulator without setup
    }
  },

  /** Restores token from SecureStore into memory on app boot. */
  async restore() {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      this._cache = token;
      return token;
    } catch {
      return null;
    }
  },

  /** Clears token from both memory and SecureStore. */
  async clear() {
    this._cache = null;
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
    } catch {
      // ignore
    }
  },
};
