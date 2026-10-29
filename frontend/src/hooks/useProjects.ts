import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects,
    queryFn: endpoints.projects,
  });
}

export function useProject(id: number) {
  return useQuery({
    queryKey: queryKeys.project(id),
    queryFn: () => endpoints.project(id),
    enabled: Number.isFinite(id),
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: endpoints.createProject,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}

export function useUpdateProject(id: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: {
      repo_url?: string;
      container_port: number;
      health_path: string;
      replicas: number;
    }) => endpoints.updateProject(id, payload),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
      void queryClient.invalidateQueries({ queryKey: queryKeys.project(id) });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => endpoints.deleteProject(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.projects });
    },
  });
}
