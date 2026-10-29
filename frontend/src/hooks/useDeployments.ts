import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useDeployments(projectId?: number) {
  return useQuery({
    queryKey: queryKeys.deployments(projectId),
    queryFn: () => endpoints.deployments(projectId),
  });
}

export function useDeployment(id: number) {
  return useQuery({
    queryKey: queryKeys.deployment(id),
    queryFn: () => endpoints.deployment(id),
    enabled: Number.isFinite(id),
  });
}

export function useHealthChecks(id: number) {
  return useQuery({
    queryKey: queryKeys.healthChecks(id),
    queryFn: () => endpoints.healthChecks(id),
    enabled: Number.isFinite(id),
  });
}

export function useRollbackEvents(id: number) {
  return useQuery({
    queryKey: queryKeys.rollbackEvents(id),
    queryFn: () => endpoints.rollbackEvents(id),
    enabled: Number.isFinite(id),
  });
}

export function useCheckHealth(deploymentId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (url: string) => endpoints.checkAndHeal(deploymentId, url),
    onSuccess: () => {
      // Covers health checks, rollback events, the deployment and list scores.
      void queryClient.invalidateQueries({ queryKey: ["deployments"] });
    },
  });
}
