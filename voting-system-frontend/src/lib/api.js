import axios from "axios";
import i18n from '../i18n';

const API_BASE_URL = "/api";

// Set up Axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add a request interceptor to include the token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("elections_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // set Accept-Language header based on i18n current language (fallbacks included)
  try {
    const lng =
      localStorage.getItem('i18nextLng') || i18n?.language || navigator.language || 'en';
    if (lng) config.headers['Accept-Language'] = lng;
  } catch (e) {
    // ignore if access to localStorage fails
  }
  return config;
});

// Authentication
export const login = async (credentials) => {
  try {
    return await api.post("/auth/login/", credentials);
  } catch (err) {
    if (err?.response?.status === 404) {
      return await api.post("/auth/login", credentials);
    }
    throw err;
  }
};

export const register = (data) => api.post("/auth/register/", data);

export const fetchElections = () => api.get("/elections/");
export const fetchElectionDetails = (id) => api.get(`/elections/${id}/`);
export const fetchElectionResults = (id) => api.get(`/elections/${id}/results/`);
export const registerForElection = (id) => api.post(`/elections/${id}/register/`);

// Admin endpoints for elections
export const fetchAdminElections = () => api.get("/elections/");
export const fetchAdminElectionDetails = (id) => api.get(`/elections/${id}/`);

// Candidates (public/admin)
export const fetchCandidates = (params) => api.get("/candidates/", { params });
export const fetchCandidateDetails = (id) => api.get(`/candidates/${id}/`);

// Votes (public/admin)
export const createVote = (data) => api.post("/votes/", data);

// Generic HTTP helpers (convenience wrappers)
export const apiGet = (url, config) => api.get(url, config);
export const apiPost = (url, data, config) => api.post(url, data, config);
export const apiPut = (url, data, config) => api.put(url, data, config);
export const apiPatch = (url, data, config) => api.patch(url, data, config);
export const apiDelete = (url, config) => api.delete(url, config);

export default api;