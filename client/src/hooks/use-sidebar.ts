import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Collection,
  SharedWorkspace,
  Workspace,
  Source,
  Pagination,
} from "@/lib/types";

const COLLECTION_KEYS = {
  all: ["collections"] as const,
  detail: (id: string) => ["collections", "detail", id] as const,
};

export function useCollections() {
  return useQuery<{ data: Collection[] }>({
    queryKey: COLLECTION_KEYS.all,
    queryFn: () => apiClient.get("/api/collections"),
  });
}

export function useCollection(id: string) {
  return useQuery<{ data: Collection }>({
    queryKey: COLLECTION_KEYS.detail(id),
    queryFn: () => apiClient.get(`/api/collections/${id}`),
    enabled: !!id,
  });
}

export function useCreateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { name: string; icon?: string }) =>
      apiClient.post<{ data: Collection }>("/api/collections", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEYS.all });
    },
  });
}

export function useUpdateCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: { id: string } & { name?: string; icon?: string }) =>
      apiClient.patch<{ data: Collection }>(`/api/collections/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_KEYS.detail(variables.id),
      });
    },
  });
}

export function useDeleteCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/api/collections/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEYS.all });
    },
  });
}

export function useAddSourceToCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      sourceId,
    }: {
      collectionId: string;
      sourceId: string;
    }) =>
      apiClient.post(`/api/collections/${collectionId}/sources`, { sourceId }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_KEYS.detail(variables.collectionId),
      });
    },
  });
}

export function useRemoveSourceFromCollection() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionId,
      sourceId,
    }: {
      collectionId: string;
      sourceId: string;
    }) =>
      apiClient.delete<void>(
        `/api/collections/${collectionId}/sources/${sourceId}`
      ),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: COLLECTION_KEYS.all });
      queryClient.invalidateQueries({
        queryKey: COLLECTION_KEYS.detail(variables.collectionId),
      });
    },
  });
}

const FAVORITE_KEYS = {
  all: ["workspaces", "favorites"] as const,
} as const;

export function useFavoriteWorkspaces() {
  return useQuery<{ data: Workspace[] }>({
    queryKey: FAVORITE_KEYS.all,
    queryFn: () => apiClient.get("/api/workspaces/favorites"),
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (workspaceId: string) =>
      apiClient.patch<{ data: Workspace }>(
        `/api/workspaces/${workspaceId}/favorite`
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["workspaces"] });
      queryClient.invalidateQueries({ queryKey: FAVORITE_KEYS.all });
    },
  });
}

const RECENT_KEYS = {
  all: ["workspaces", "recent"] as const,
};

export function useRecentWorkspaces() {
  return useQuery<{ data: Workspace[] }>({
    queryKey: RECENT_KEYS.all,
    queryFn: () => apiClient.get("/api/workspaces/recent"),
  });
}

const SHARED_KEYS = {
  all: ["workspaces", "shared"] as const,
};

export function useSharedWorkspaces() {
  return useQuery<{ data: SharedWorkspace[] }>({
    queryKey: SHARED_KEYS.all,
    queryFn: () => apiClient.get("/api/workspaces/shared"),
  });
}

interface AllSourcesResponse {
  data: (Source & { workspace: { id: string; title: string } })[];
  pagination: Pagination;
}

const ALL_SOURCES_KEYS = {
  all: ["sources", "all"] as const,
};

export function useAllSources(search = "") {
  const params = new URLSearchParams({ page: "1", limit: "100" });
  if (search) params.set("search", search);

  return useQuery<AllSourcesResponse>({
    queryKey: [...ALL_SOURCES_KEYS.all, search],
    queryFn: () => apiClient.get(`/api/sources?${params}`),
  });
}
