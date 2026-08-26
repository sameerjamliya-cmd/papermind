import { useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

const KEYS = {
  list: (workspaceId: string) => ["chat", workspaceId] as const,
};

interface MessageListResponse {
  data: Array<{
    id: string;
    role: string;
    content: string;
    createdAt: string;
  }>;
}

export function useChatMessages(workspaceId: string) {
  return useQuery<MessageListResponse>({
    queryKey: KEYS.list(workspaceId),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/chat`),
    enabled: !!workspaceId,
  });
}

export function useInvalidateChatMessages() {
  const queryClient = useQueryClient();
  return (workspaceId: string) =>
    queryClient.invalidateQueries({ queryKey: KEYS.list(workspaceId) });
}
