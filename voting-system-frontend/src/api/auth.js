import { api } from "./client";
import { tokenManager } from "./tokenManager";

/**
 * @param   {string} nni
 * @returns {{ user: object, access: string }}
 */
export async function loginWithNni(nni) {
  const data = await api.post("/auth/login/", { nni }, { auth: false });
  tokenManager.setToken(data.access);
  return data;
}

// ---------------------------------------------------------------------------
// Logout
// ---------------------------------------------------------------------------

export async function logoutApi() {
  await api.post("/auth/logout/", null, { auth: false });
}

// ---------------------------------------------------------------------------
// Session restoration
// ---------------------------------------------------------------------------

/**
 * @returns {boolean}
 */
export async function initAuth() {
  try {
    // await refreshToken();
    return true;
  } catch {
    tokenManager.clear();
    return false;
  }
}

// ---------------------------------------------------------------------------
// Current user
// ---------------------------------------------------------------------------
export const fetchMe = () => api.get("/auth/me");
