import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Source,
  SourceListResponse,
  SourceResponse,
  BulkDeleteResponse,
  AddSourceInput,
  UpdateSourceInput,
  BulkDeleteSourcesInput,
  SourceType,
  SourceStatus,
} from "@/lib/types";

const KEYS = {
  all: (workspaceId: string) => ["sources", workspaceId] as const,
  list: (workspaceId: string) => [...KEYS.all(workspaceId), "list"] as const,
  detail: (workspaceId: string, sourceId: string) =>
    [...KEYS.all(workspaceId), "detail", sourceId] as const,
};

interface SourceFilters {
  status?: SourceStatus | "all";
  type?: SourceType | "all";
  search?: string;
}

export function useSources(
  workspaceId: string,
  page = 1,
  filters: SourceFilters = {}
) {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.type && filters.type !== "all") params.set("type", filters.type);
  if (filters.search) params.set("search", filters.search);

  return useQuery<SourceListResponse>({
    queryKey: [...KEYS.list(workspaceId), page, filters],
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/sources?${params}`),
    enabled: !!workspaceId,
    refetchInterval: (query) => {
      const hasProcessing = query.state.data?.data?.some(
        (s) => s.status === "pending" || s.status === "processing"
      );
      return hasProcessing ? 3000 : false;
    },
  });
}

export function useSource(workspaceId: string, sourceId: string) {
  return useQuery<SourceResponse>({
    queryKey: KEYS.detail(workspaceId, sourceId),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/sources/${sourceId}`),
    enabled: !!workspaceId && !!sourceId,
  });
}

export function useCreateSource(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      input: AddSourceInput | { formData: FormData }
    ) => {
      if ("formData" in input) {
        return apiClient.upload<SourceResponse>(
          `/api/workspaces/${workspaceId}/sources`,
          input.formData
        );
      }
      return apiClient.post<SourceResponse>(
        `/api/workspaces/${workspaceId}/sources`,
        input
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(workspaceId) });
    },
  });
}

export function useUpdateSource(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      sourceId,
      ...data
    }: { sourceId: string } & UpdateSourceInput) =>
      apiClient.patch<SourceResponse>(
        `/api/workspaces/${workspaceId}/sources/${sourceId}`,
        data
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(workspaceId) });
      queryClient.invalidateQueries({
        queryKey: KEYS.detail(workspaceId, variables.sourceId),
      });
    },
  });
}

export function useDeleteSource(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (sourceId: string) =>
      apiClient.delete<void>(`/api/workspaces/${workspaceId}/sources/${sourceId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(workspaceId) });
    },
  });
}

export function useBulkDeleteSources(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: BulkDeleteSourcesInput) =>
      apiClient.post<BulkDeleteResponse>(
        `/api/workspaces/${workspaceId}/sources/bulk-delete`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list(workspaceId) });
    },
  });
}
