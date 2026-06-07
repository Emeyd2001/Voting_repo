import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api/client';

export function useRegisterForElection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (electionId) => api.post(`/elections/${electionId}/register/`),
    onSuccess: (_, electionId) => {
      // Invalider les requêtes liées à cette élection (détail, liste)
      queryClient.invalidateQueries(['election', electionId]);
      queryClient.invalidateQueries(['elections']);
    },
  });
}