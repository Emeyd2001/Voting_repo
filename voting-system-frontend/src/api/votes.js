import { api } from "./client";

/* ------------------------------------------------------------------ */
/* Voter                                                                */
/* ------------------------------------------------------------------ */
export const castVote = ({ election, candidate }) =>
  api.post("/votes/cast/", { election, candidate });

export const fetchMyVotes = () => api.get("/votes/me/");

export const hasVoted = (electionId) =>
  api.get(`/votes/has-voted/?election=${electionId}`);

export const publicResults = (electionId) =>
  api.get(`/elections/${electionId}/results/`);

/* ------------------------------------------------------------------ */
/* Admin                                                                */
/* ------------------------------------------------------------------ */
export const adminResults = (electionId) =>
  api.get(`/elections/${electionId}/results/`);
