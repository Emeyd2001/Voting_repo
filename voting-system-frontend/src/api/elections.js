import { api } from "./client";

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */
export const adminListElections = () =>
  api.get("/elections/");

/** Server-Side Pagination: يُرجع { count, next, previous, results } */
export const adminListElectionsPaginated = (page = 1) =>
  api.getPaginated(`/elections/?page=${page}`);

export const adminGetElection = (id) =>
  api.get(`/elections/${id}/`);

export const adminCreateElection = (data) =>
  api.post("/elections/", data);

export const adminUpdateElection = (id, data) =>
  api.patch(`/elections/${id}/`, data);

export const adminDeleteElection = (id) =>
  api.del(`/elections/${id}/`);

/* State transitions
 * activate   : DRAFT -> SCHEDULED ou ACTIVE selon les dates
 * deactivate : SCHEDULED -> DRAFT (avant le start_date)
 * close      : SCHEDULED/ACTIVE -> CLOSED
 * archive    : CLOSED -> ARCHIVED
 */
export const adminActivateElection = (id) =>
  api.post(`/elections/${id}/activate/`);

export const adminDeactivateElection = (id) =>
  api.post(`/elections/${id}/deactivate/`);

export const adminCloseElection = (id) =>
  api.post(`/elections/${id}/close/`);

export const adminArchiveElection = (id) =>
  api.post(`/elections/${id}/archive/`);

/* ------------------------------------------------------------------ */
/* Public (voter)                                                       */
/* ------------------------------------------------------------------ */
export const publicListElections = () =>
  api.get("/elections/");

/** Server-Side Pagination: يُرجع { count, next, previous, results } */
export const publicListElectionsPaginated = (page = 1) =>
  api.getPaginated(`/elections/?page=${page}`);


export const publicGetElection = (id) =>
  api.get(`/elections/${id}/`);

export const publicGetElectionCandidates = (id) =>
  api.get(`/elections/${id}/candidates/`);
// Inscription à une élection
export const registerForElection = (electionId) =>
  api.post(`/elections/${electionId}/register/`);