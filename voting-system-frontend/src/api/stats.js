import { api } from "./client";

/**
 * GET /api/elections/admin/stats/
 *
 * Snapshot global des compteurs (elections, candidats, partis, citoyens, votes)
 * + breakdown des elections par statut. Reservé aux admins.
 */
export const adminDashboardStats = () => api.get("/elections/stats/");
