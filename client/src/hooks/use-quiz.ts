import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import type {
  Quiz,
  QuizResponse,
  GenerateQuizInput,
  QuizAnswer,
  QuizResultResponse,
} from "@/lib/types";

const KEYS = {
  all: (workspaceId: string) => ["quiz", workspaceId] as const,
  detail: (workspaceId: string, id: string) =>
    [...KEYS.all(workspaceId), id] as const,
};

export function useGenerateQuiz(workspaceId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: GenerateQuizInput) =>
      apiClient.post<QuizResponse>(
        `/api/workspaces/${workspaceId}/quiz/generate`,
        input
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEYS.all(workspaceId) });
    },
  });
}

export function usePollQuiz(workspaceId: string, id: string | null) {
  return useQuery<QuizResponse>({
    queryKey: KEYS.detail(workspaceId, id ?? ""),
    queryFn: () =>
      apiClient.get(`/api/workspaces/${workspaceId}/quiz/${id}`),
    enabled: !!workspaceId && !!id,
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      if (status === "generating" || status === "processing") return 2000;
      return false;
    },
  });
}

export function useGradeQuiz(workspaceId: string) {
  return useMutation({
    mutationFn: ({
      quizId,
      answers,
    }: {
      quizId: string;
      answers: QuizAnswer[];
    }) =>
      apiClient.post<QuizResultResponse>(
        `/api/workspaces/${workspaceId}/quiz/${quizId}/grade`,
        { answers }
      ),
  });
}
