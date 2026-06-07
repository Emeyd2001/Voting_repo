import { api } from "./client";

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */
/**
 * GET /api/candidates/admin/candidates/?election=<id>
 * Si electionId est fourni, filtre par election.
 */
export const adminListCandidates = (electionId) => {
  const qs = electionId ? `?election=${electionId}` : "";
  return api.get(`/candidates/${qs}`);
};

/** Server-Side Pagination: يقبل رقم الصفحة و filter اختياري للانتخابات. */
export const adminListCandidatesPaginated = (electionId, page = 1) => {
  const params = new URLSearchParams({ page });
  if (electionId) params.set("election", electionId);
  return api.getPaginated(`/candidates/?${params}`);
};


export const adminGetCandidate = (id) =>
  api.get(`/candidates/${id}/`);

export const adminCreateCandidate = (data) =>
  api.post("/candidates/", data);

export const adminUpdateCandidate = (id, data) =>
  api.patch(`/candidates/${id}/`, data);

export const adminDeleteCandidate = (id) =>
  api.del(`/candidates/${id}/`);
