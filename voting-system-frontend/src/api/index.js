/**
 * Unified API client with automatic role-based endpoint selection.
 * No duplication, no boilerplate, just clean resource functions.
 */

import { api } from "./client";

/**
 * Resource factory: creates CRUD functions for a given endpoint pattern.
 * Pattern: /resource/{role}/... where role is "admin" or "public"
 */
function createResource(name) {
  return {
    list: (role = "admin") => {
      return api.get(`/${name}/`);
    },
    get: (id, role = "admin") => {
      return api.get(`/${name}/${id}/`);
    },
    create: (data) => api.post(`/${name}/`, data),
    update: (id, data) => api.patch(`/${name}/${id}/`, data),
    delete: (id) => api.del(`/${name}/${id}/`),
  };
}
export const tokenManager = {
  getToken: () => localStorage.getItem("access"),
  setToken: (token) => localStorage.setItem("access", token),
  clear: () => localStorage.removeItem("access"),
}
// Auth
export const auth = {
  login: (nni) => api.post("/auth/login/", { nni }, { auth: false }),
  setToken: (res) => tokenManager.setToken(res.access),
  // logout: () => api.post("/auth/logout/", null, { auth: false }),
  // me: () => api.get("/auth/me"),
  // 
};

// Elections with transitions
export const elections = {
  ...createResource("elections"),
  activate: (id) => api.post(`/elections/${id}/activate/`),
  deactivate: (id) => api.post(`/elections/${id}/deactivate/`),
  close: (id) => api.post(`/elections/${id}/close/`),
  archive: (id) => api.post(`/elections/${id}/archive/`),
  candidates: (id, role = "public") => {
    return api.get(`/candidates/?election=${id}`);
  },
};

// Candidates
export const candidates = {
  ...createResource("candidates"),
};

export const parties = {
  // List all parties (admin)
  list: (role = "admin") => api.get(`/elections/parties/`),
  // Get a single party by ID
  get: (id, role = "admin") => api.get(`/elections/parties/${id}/`),
  // Create a new party
  create: (data) => api.post(`/elections/parties/`, data),
  // Update an existing party
  update: (id, data) => api.patch(`/elections/parties/${id}/`, data),
  // Delete a party
  delete: (id) => api.del(`/elections/parties/${id}/`),
};

// Votes
export const votes = {
  cast: (election, candidate) =>
    api.post("/votes/cast/", { election, candidate }),
  my: () => api.get("/votes/me/"),
  hasVoted: (electionId) =>
    api.get(`/votes/me/results/?election=${electionId}`),
  results: (electionId, role = "public") => {
    return api.get(`/elections/${electionId}/results/`);
  },
};

// Citizens (managed under auth module in backend)
export const citizens = {
  list: (role = "admin") => api.get("/auth/admin/users/"),
  get: (id, role = "admin") => api.get(`/auth/admin/users/${id}/`),
  create: (data) => api.post("/auth/admin/users/", data),
  update: (id, data) => api.patch(`/auth/admin/users/${id}/`, data),
  delete: (id) => api.del(`/auth/admin/users/${id}/`),
  eligibility: (id, isEligible) =>
    api.patch(`/auth/admin/users/${id}/eligibility/`, { is_eligible: isEligible }),
};

// Users (alias for citizens)
export const users = {
  list: () => api.get("/auth/admin/users/"),
};

// Stats
export const stats = {
  summary: () => api.get("/elections/stats/"),
  trends: () => Promise.resolve([]),
};
