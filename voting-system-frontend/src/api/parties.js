import { api } from "./client";

/* Admin */
export const adminListParties = () => api.get("/elections/parties/");
/** Server-Side Pagination */
export const adminListPartiesPaginated = (page = 1) =>
  api.getPaginated(`/elections/parties/?page=${page}`);

export const adminGetParty = (id) => api.get(`/elections/parties/${id}/`);
export const adminCreateParty = (data) =>
  api.post("/elections/parties/", data);
export const adminUpdateParty = (id, data) =>
  api.patch(`/elections/parties/${id}/`, data);
export const adminDeleteParty = (id) =>
  api.del(`/elections/parties/${id}/`);

/* Public */
export const publicListParties = () => api.get("/elections/parties/");
/** Server-Side Pagination */
export const publicListPartiesPaginated = (page = 1) =>
  api.getPaginated(`/elections/parties/?page=${page}`);
