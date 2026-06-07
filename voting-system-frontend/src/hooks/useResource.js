/**
 * Generic resource hooks: replace 11 individual hooks with one pattern.
 * Usage: const { data, loading } = useResource(elections.list)
 */

import { useEffect } from "react";
import { useFetch, useMutation, usePaginatedFetch } from "./useAsync";
import { useAuthStore } from "../store/authStore";
import {
  elections,
  candidates,
  parties,
  votes,
  citizens,
  stats,
} from "../api/index";
import {
  adminListElectionsPaginated,
  publicListElectionsPaginated,
} from "../api/elections";
import { adminListCandidatesPaginated } from "../api/candidates";
import { adminListPartiesPaginated } from "../api/parties";


/**
 * Fetch a list of resources. Auto-selects admin/public based on role.
 * Usage: const { data: elections } = useList(elections.list)
 */
export function useList(fetcher, options = {}) {
  const { pollMs = 0 } = options;
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");

  const { refetch, ...rest } = useFetch(
    () => fetcher(isAdmin ? "admin" : "public"),
    [isAdmin],
  );

  // Auto-refresh polling
  useEffect(() => {
    if (!pollMs || !isAdmin) return undefined;
    const id = setInterval(refetch, pollMs);
    return () => clearInterval(id);
  }, [pollMs, isAdmin, refetch]);

  return { refetch, ...rest };
}

/**
 * Fetch single resource by ID
 */
export function useResource(fetcher, resourceId, options = {}) {
  const role = options.role || "public";
  return useFetch(
    () => {
      if (resourceId == null) {
        return Promise.resolve(null);
      }
      return fetcher(resourceId, role);
    },
    [resourceId, role],
  );
}

/**
 * Generic mutation hook (create, update, delete)
 */
export function useSave(fetcher) {
  return useMutation(fetcher);
}

// Pre-built hooks for common resources (keep for backward compat)

export function useElections(options = {}) {
  return useList(elections.list, options);
}

export function usePublicElections() {
  return useFetch(() => elections.list("public"), []);
}

export function useElection(electionId) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  const query = useResource(elections.get, electionId, {
    role: isAdmin ? "admin" : "public",
  });

  const update = useSave((data) => elections.update(electionId, data));
  const remove = useSave(() => elections.delete(electionId));
  const activate = useSave(() => elections.activate(electionId));
  const deactivate = useSave(() => elections.deactivate(electionId));
  const close = useSave(() => elections.close(electionId));
  const archive = useSave(() => elections.archive(electionId));

  return { ...query, update, remove, activate, deactivate, close, archive };
}

export function useCreateElection() {
  return useSave((data) => elections.create(data));
}

export function useElectionCandidates(electionId) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  return useFetch(
    () => elections.candidates(electionId, isAdmin ? "admin" : "public"),
    [electionId, isAdmin],
  );
}

// Deprecated: Do not use for specific elections, use useElectionCandidates instead.
export function useCandidates() {
  return useFetch(() => candidates.list("admin"), []);
}

export function useCandidate(candidateId) {
  const query = useResource(candidates.get, candidateId, { role: "admin" });
  const update = useSave((data) => candidates.update(candidateId, data));
  const remove = useSave(() => candidates.delete(candidateId));
  return { ...query, update, remove };
}

export function useCreateCandidate() {
  return useSave((data) => candidates.create(data));
}

export function useParties() {
  return useFetch(() => parties.list("admin"), []);
}

export function useParty(partyId) {
  const query = useResource(parties.get, partyId, { role: "admin" });
  const update = useSave((data) => parties.update(partyId, data));
  const remove = useSave(() => parties.delete(partyId));
  return { ...query, update, remove };
}

export function useCreateParty() {
  return useSave((data) => parties.create(data));
}

export function useCitizens() {
  return useFetch(() => citizens.list("admin"), []);
}

export function useCitizen(citizenId) {
  const query = useResource(citizens.get, citizenId, { role: "admin" });
  const update = useSave((data) => citizens.update(citizenId, data));
  // Utilise l'endpoint dédié /eligibility/ pour le toggle
  const setEligibility = useSave((isEligible) =>
    citizens.eligibility(citizenId, isEligible),
  );
  return { ...query, update, setEligibility };
}

export function useVotes() {
  return useFetch(() => votes.my(), []);
}

export function useMyVotes() {
  return useFetch(() => votes.my(), []);
}

export function useHasVoted(electionId) {
  return useFetch(() => votes.hasVoted(electionId), [electionId]);
}

export function useCastVote() {
  return useSave(({ election, candidate }) => votes.cast(election, candidate));
}

export function useResults(electionId) {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  return useFetch(
    () => {
      if (electionId == null) return Promise.resolve([]);
      return votes.results(electionId, isAdmin ? "admin" : "public");
    },
    [electionId, isAdmin],
  );
}

export function useAdminStats() {
  return useStats();
}

export function useStats() {
  return useFetch(() => stats.summary(), []);
}

// =============================================================================
// Hooks مع Server-Side Pagination (يستخدمون usePaginatedFetch)
// =============================================================================

/**
 * قائمة الانتخابات بـ Pagination حقيقي من الـ Server.
 * يختار تلقائياً Admin أو Public حسب دور المستخدم.
 */
export function useElectionsPaginated() {
  const isAdmin = useAuthStore((s) => s.user?.role === "admin");
  return usePaginatedFetch(
    (page) =>
      isAdmin
        ? adminListElectionsPaginated(page)
        : publicListElectionsPaginated(page),
    [isAdmin],
  );
}

/**
 * قائمة المرشحين بـ Pagination — يدعم الـ filter بـ electionId من الـ Server.
 */
export function useCandidatesPaginated(electionId = null) {
  return usePaginatedFetch(
    (page) => adminListCandidatesPaginated(electionId, page),
    [electionId],
  );
}

/**
 * قائمة الأحزاب بـ Pagination.
 */
export function usePartiesPaginated() {
  return usePaginatedFetch(
    (page) => adminListPartiesPaginated(page),
    [],
  );
}
