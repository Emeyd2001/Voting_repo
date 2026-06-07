import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { loginWithNni, logoutApi } from "../api/auth";
import { tokenManager } from "../api/tokenManager";
import { TOKEN_STORAGE_KEY } from "../lib/config";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      /* ── state ────────────────────────────────────────────────────── */
      user: null,
      _accessToken: null,
      bootstrapping: true,

      /* ── derived getters ─────────────────────────────────────────── */
      isAuthenticated: () => Boolean(tokenManager.getToken() && get().user),
      isVoter: () => get().user?.role === "voter",

      /* ── actions ─────────────────────────────────────────────────── */
      async login(nni) {
        const data = await loginWithNni(nni);
        set({ user: data.user, _accessToken: data.access });
        await tokenManager.setToken(data.access);
        return data.user;
      },

      async logout() {
        await tokenManager.clear();
        set({ user: null, _accessToken: null });
        logoutApi().catch(() => {});
      },

      /**
       * Called once on app start.
       * Restores token from persisted state (AsyncStorage via Zustand persist).
       */
      async bootstrap() {
        const state = get();
        if (state.user && state._accessToken) {
          await tokenManager.setToken(state._accessToken);
          set({ bootstrapping: false });
        } else {
          await tokenManager.clear();
          set({ user: null, _accessToken: null, bootstrapping: false });
        }
      },

      setUser(user) {
        set({ user });
      },
    }),
    {
      name: TOKEN_STORAGE_KEY,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        user: state.user,
        _accessToken: state._accessToken,
      }),
    }
  )
);
