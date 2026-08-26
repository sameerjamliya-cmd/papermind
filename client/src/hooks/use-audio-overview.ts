import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  AudioOverview,
  AudioOverviewListResponse,
  AudioOverviewResponse,
  CreateAudioOverviewInput,
} from "@/lib/types";

const KEYS = {
  all: (workspaceId: string) => ["audio-overview", workspaceId] as const,
  detail: (workspaceId: string, id: string) =>
    [...KEYS.all(workspaceId), id] as const,
};

export function useAudioOverviews(workspaceId: string) {
  return useQuery<AudioOverviewListResponse>({
    queryKey: KEYS.all(workspaceId),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/audio-overview`),
    enabled: !!workspaceId,
  });
}

export function useAudioOverview(workspaceId: string, id: string) {
  return useQuery<AudioOverviewResponse>({
    queryKey: KEYS.detail(workspaceId, id),
    queryFn: () =>
      apiClient.get(
        `/api/workspaces/${workspaceId}/audio-overview/${id}`
      ),
    enabled: !!workspaceId && !!id,
  });
}

export function useGenerateAudioOverview(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input?: CreateAudioOverviewInput) =>
      apiClient.post<AudioOverviewResponse>(
        `/api/workspaces/${workspaceId}/audio-overview`,
        input ?? {}
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
    onError: (err: Error) => {
      console.log("[audio-overview] mutation failed:", err.message);
    },
  });
}

export function usePollAudioOverview(workspaceId: string, id: string | null) {
  return useQuery<AudioOverviewResponse>({
    queryKey: KEYS.detail(workspaceId, id ?? ""),
    queryFn: () =>
      apiClient.get(
        `/api/workspaces/${workspaceId}/audio-overview/${id}`
      ),
    enabled: !!workspaceId && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "generating" || status === "processing") return 2000;
      return false;
    },
  });
}

export function useDeleteAudioOverview(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(
        `/api/workspaces/${workspaceId}/audio-overview/${id}`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}
