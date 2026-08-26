import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  GenerateInfographicInput,
  Infographic,
  InfographicListResponse,
  InfographicResponse,
} from "@/lib/types";

const KEYS = {
  all: (workspaceId: string) => ["infographics", workspaceId] as const,
  detail: (workspaceId: string, id: string) =>
    [...KEYS.all(workspaceId), id] as const,
};

export function useInfographics(workspaceId: string) {
  return useQuery<InfographicListResponse>({
    queryKey: KEYS.all(workspaceId),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/infographics`),
    enabled: !!workspaceId,
  });
}

export function useGenerateInfographic(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateInfographicInput) =>
      apiClient.post<InfographicResponse>(
        `/api/workspaces/${workspaceId}/infographics`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}

export function usePollInfographic(workspaceId: string, id: string | null) {
  return useQuery<InfographicResponse>({
    queryKey: KEYS.detail(workspaceId, id ?? ""),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/infographics/${id}`),
    enabled: !!workspaceId && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "generating" || status === "processing") return 2000;
      return false;
    },
  });
}

export function useDeleteInfographic(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(
        `/api/workspaces/${workspaceId}/infographics/${id}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}

export type { Infographic };