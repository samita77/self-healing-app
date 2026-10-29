import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function usePipelineRuns(projectId: number) {
  return useQuery({
    queryKey: queryKeys.pipelineRuns(projectId),
    queryFn: () => endpoints.pipelineRuns(projectId),
    enabled: Number.isFinite(projectId),
    refetchInterval: 10_000,
  });
}

export function useRunPipeline(projectId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => endpoints.runPipeline(projectId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.pipelineRuns(projectId),
      });
      void queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}
