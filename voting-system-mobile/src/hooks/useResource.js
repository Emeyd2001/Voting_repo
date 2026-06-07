import { useFetch, useMutation } from "./useAsync";
import { elections, votes, candidates } from "../api/index";
import { registrations } from "../api/index";

export function useElections() {
  return useFetch(() => elections.list(), []);
}

export function useElection(electionId) {
  return useFetch(
    () => (electionId ? elections.get(electionId) : Promise.resolve(null)),
    [electionId]
  );
}

export function useElectionCandidates(electionId) {
  return useFetch(
    () => (electionId ? elections.candidates(electionId) : Promise.resolve([])),
    [electionId]
  );
}

export function useCandidate(candidateId) {
  return useFetch(() => (candidateId ? candidates.get(candidateId) : Promise.resolve(null)), [candidateId]);
}

export function useMyVotes() {
  return useFetch(() => votes.my(), []);
}

export function useHasVoted(electionId) {
  return useFetch(
    () => (electionId ? votes.hasVoted(electionId) : Promise.resolve(null)),
    [electionId]
  );
}

export function useCastVote() {
  return useMutation(({ election, candidate }) => votes.cast(election, candidate));
}

export function useResults(electionId) {
  return useFetch(
    () => (electionId ? votes.results(electionId) : Promise.resolve([])),
    [electionId]
  );
}

export function useRegistrationStatus(electionId) {
  return useFetch(
    () => (electionId ? registrations.status(electionId) : Promise.resolve({ registered: false })),
    [electionId]
  );
}

export function useRegister() {
  return useMutation((electionId) => registrations.register(electionId));
}
