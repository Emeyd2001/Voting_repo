import { api } from "./client";
import { tokenManager } from "./tokenManager";

/**
 * @param   {string} nni
 * @returns {{ user: object, access: string }}
 */
export async function loginWithNni(nni) {
  const data = await api.post("/auth/login/", { nni }, { auth: false });
  await tokenManager.setToken(data.access);
  return data;
}

export async function logoutApi() {
  try {
    await api.post("/auth/logout/", null, { auth: false });
  } catch {
    // ignore logout errors
  }
}

export const fetchMe = () => api.get("/auth/me/");
