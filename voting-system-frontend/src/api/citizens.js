import { api } from "./client";

/* ------------------------------------------------------------------ */
/* Admin (registre civil)                                              */
/* ------------------------------------------------------------------ */
/**
 * GET /api/citizens/?search=...&wilaya=...&is_eligible=true|false
 *
 * Tous les params sont optionnels.
 */
export const adminListCitizens = ({
  search = "",
  wilaya = "",
  isEligible = "",
} = {}) => {
  const qs = new URLSearchParams();
  if (search) qs.set("search", search);
  if (wilaya) qs.set("wilaya", wilaya);
  if (isEligible !== "" && isEligible !== null && isEligible !== undefined) {
    qs.set("is_eligible", String(isEligible));
  }
  const q = qs.toString();
  return api.get(`/citizens/${q ? `?${q}` : ""}`);
};

export const adminGetCitizen = (id) =>
  api.get(`/citizens/${id}/`);

export const adminCreateCitizen = (data) =>
  api.post("/citizens/", data);

export const adminUpdateCitizen = (id, data) =>
  api.patch(`/citizens/${id}/`, data);

export const adminDeleteCitizen = (id) =>
  api.del(`/citizens/${id}/`);

export const adminSetCitizenEligibility = (id, isEligible) =>
  api.patch(`/citizens/${id}/eligibility/`, {
    is_eligible: isEligible,
  });
