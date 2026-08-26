import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Workspace,
  WorkspaceListResponse,
  WorkspaceResponse,
  CreateWorkspaceInput,
  UpdateWorkspaceInput,
} from "@/lib/types";

const KEYS = {
  all: ["workspaces"] as const,
  list: () => [...KEYS.all, "list"] as const,
  detail: (id: string) => [...KEYS.all, "detail", id] as const,
};

export function useWorkspaces(page = 1, search = "") {
  const params = new URLSearchParams({ page: String(page), limit: "20" });
  if (search) params.set("search", search);

  return useQuery<WorkspaceListResponse>({
    queryKey: [...KEYS.list(), page, search],
    queryFn: () => apiClient.get(`/api/workspaces?${params}`),
  });
}

export function useAllWorkspaces() {
  const params = new URLSearchParams({ page: "1", limit: "100" });

  return useQuery<WorkspaceListResponse>({
    queryKey: [...KEYS.list(), "all"],
    queryFn: () => apiClient.get(`/api/workspaces?${params}`),
  });
}

export function useWorkspace(id: string) {
  return useQuery<WorkspaceResponse>({
    queryKey: KEYS.detail(id),
    queryFn: () => apiClient.get(`/api/workspaces/${id}`),
    enabled: !!id,
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) =>
      apiClient.post<WorkspaceResponse>("/api/workspaces", input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list() });
    },
  });
}

export function useUpdateWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & UpdateWorkspaceInput) =>
      apiClient.patch<WorkspaceResponse>(`/api/workspaces/${id}`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: KEYS.list() });
      queryClient.invalidateQueries({ queryKey: KEYS.detail(variables.id) });
    },
  });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete<void>(`/api/workspaces/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.list() });
    },
  });
}
