import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  FlashcardSet,
  FlashcardSetListResponse,
  FlashcardSetResponse,
  GenerateFlashcardsInput,
} from "@/lib/types";

const KEYS = {
  all: (workspaceId: string) => ["flashcards", workspaceId] as const,
  detail: (workspaceId: string, id: string) =>
    [...KEYS.all(workspaceId), id] as const,
};

export function useFlashcardSets(workspaceId: string) {
  return useQuery<FlashcardSetListResponse>({
    queryKey: KEYS.all(workspaceId),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/flashcards`),
    enabled: !!workspaceId,
  });
}

export function useGenerateFlashcards(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateFlashcardsInput) =>
      apiClient.post<FlashcardSetResponse>(
        `/api/workspaces/${workspaceId}/flashcards/generate`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}

export function usePollFlashcards(workspaceId: string, id: string | null) {
  return useQuery<FlashcardSetResponse>({
    queryKey: KEYS.detail(workspaceId, id ?? ""),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/flashcards/${id}`),
    enabled: !!workspaceId && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "generating" || status === "processing") return 2000;
      return false;
    },
  });
}

export function useDeleteFlashcards(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/api/workspaces/${workspaceId}/flashcards/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}

export type { FlashcardSet };