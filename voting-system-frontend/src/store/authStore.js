import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

import { loginWithNni, logoutApi } from "../api/auth";
import { tokenManager } from "../api/tokenManager";
import { TOKEN_STORAGE_KEY } from "../lib/config";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      /* ── state ────────────────────────────────────────────────────────── */
      user: null,
      // True from app start until bootstrap() resolves (success or failure).
      // ProtectedRoute must wait for this to be false before deciding to redirect.
      bootstrapping: true,

      /* ── derived getters ─────────────────────────────────────────────── */
      isAuthenticated: () => Boolean(tokenManager.getToken() && get().user),
      isAdmin:         () => get().user?.role === "admin",
      isVoter:         () => get().user?.role === "voter",

      /* ── actions ─────────────────────────────────────────────────────── */

      async login(nni) {
        const data = await loginWithNni(nni);
        // Persist both user and token so they survive page refresh
        set({ user: data.user, _accessToken: data.access });
        tokenManager.setToken(data.access);
        return data.user;
      },

      logout() {
        tokenManager.clear();
        set({ user: null, _accessToken: null });
        logoutApi().catch(() => {});
      },

      /**
       * Called once on app start.
       * Restores the in-memory token from the persisted state so the user
       * stays logged in after a page refresh.
       */
      async bootstrap() {
        const state = get();

        // Zustand persist middleware will have rehydrated `user` and `_accessToken`
        // from localStorage by the time bootstrap() is called.
        if (state.user && state._accessToken) {
          // Restore the in-memory token so API calls are authenticated
          tokenManager.setToken(state._accessToken);
          set({ bootstrapping: false });
        } else {
          // No saved session — clear everything
          tokenManager.clear();
          set({ user: null, _accessToken: null, bootstrapping: false });
        }
      },

      setUser(user) {
        set({ user });
      },
    }),
    {
      name: TOKEN_STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      // Persist both user AND the access token so they survive refresh
      partialize: (state) => ({
        user: state.user,
        _accessToken: state._accessToken,
      }),
    }
  )
);
