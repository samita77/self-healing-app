import { useQuery } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";

export function useUsers() {
  return useQuery({
    queryKey: queryKeys.users,
    queryFn: endpoints.users,
  });
}

export function useDoraMetrics() {
  return useQuery({
    queryKey: queryKeys.dora,
    queryFn: endpoints.dora,
  });
}
