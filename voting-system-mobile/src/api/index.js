/**
 * Unified API façade for the mobile voter app.
 */
import { api } from "./client";

// Elections
export const elections = {
  list: () => api.get("/elections/"),
  get: (id) => api.get(`/elections/${id}/`),
  candidates: (id) => api.get(`/candidates/?election=${id}`),
};

// Candidates (single candidate detail)
export const candidates = {
  get: (id) => api.get(`/candidates/${id}/`),
};

// Registrations
export const registrations = {
  // POST /elections/:id/register/  -> register current user for election
  register: (id) => api.post(`/elections/${id}/register/`),
  // GET /elections/:id/registration/ -> returns { registered: true/false }
  status: (id) => api.get(`/elections/${id}/registration/`),
};

// Votes
export const votes = {
  cast: (election, candidate) =>
    api.post("/votes/cast/", { election, candidate }),
  my: () => api.get("/votes/me/"),
  hasVoted: (electionId) =>
    api.get(`/votes/me/results/?election=${electionId}`),
  results: (electionId) => api.get(`/elections/${electionId}/results/`),
};
