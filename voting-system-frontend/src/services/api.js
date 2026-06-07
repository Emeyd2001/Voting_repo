import axios from "axios";

const getBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
  const host = window.location.hostname;
  return `http://${host}:8000`;
};
const BASE_URL = getBaseUrl();

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const login = (nni) => api.post("/api/auth/login/", { nni });
export const getProfile = () => api.get("/api/auth/profile/");
export const getCandidates = () => api.get("/api/candidates/");
export const postVote = (candidateId) => api.post("/api/votes/", { candidateId });
export const getResults = () => api.get("/api/votes/results/");
export const getAdminStats = () => api.get("/api/elections/stats/");
export const getElections = () => api.get("/api/elections/");
export const getElectionDetail = (id) => api.get(`/api/elections/${id}/`);
export const getParties = () => api.get("/api/elections/parties/");
export const createParty = (data) => api.post("/api/elections/parties/", data);
export const updateParty = (id, data) => api.put(`/api/elections/parties/${id}/`, data);
export const deleteParty = (id) => api.delete(`/api/elections/parties/${id}/`);
export const getCandidatesAdmin = () => api.get("/api/candidates/");
export const getCandidateDetail = (id) => api.get(`/api/candidates/${id}/`);
export const createCandidate = (data) => api.post("/api/candidates/", data);
export const updateCandidate = (id, data) => api.put(`/api/candidates/${id}/`, data);
export const deleteCandidate = (id) => api.delete(`/api/candidates/${id}/`);
export const createElection = (data) => api.post("/api/elections/", data);
export const updateElection = (id, data) => api.put(`/api/elections/${id}/`, data);
export const deleteElection = (id) => api.delete(`/api/elections/${id}/`);
export const activateElection = (id) => api.post(`/api/elections/${id}/activate/`);
export const archiveElection = (id) => api.post(`/api/elections/${id}/archive/`);

export default api;