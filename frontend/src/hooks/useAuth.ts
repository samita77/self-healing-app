import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { endpoints } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { tokenStore } from "@/lib/session";
import type { LoginResponse, User } from "@/lib/types";

/** Resolves the signed-in user from the backend; null when signed out. */
export function useCurrentUser() {
  const query = useQuery({
    queryKey: queryKeys.auth,
    queryFn: endpoints.me,
    enabled: tokenStore.has(),
    retry: false,
    staleTime: 5 * 60 * 1000,
  });

  return {
    user: query.data ?? null,
    isLoading: query.isLoading,
    isError: query.isError,
    isAuthenticated: Boolean(query.data),
  };
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      endpoints.login(email, password),
    onSuccess: (data: LoginResponse) => {
      tokenStore.set(data.access_token);
      queryClient.setQueryData<User>(queryKeys.auth, data.user);
    },
  });
}

export type RegisterInput = {
  email: string;
  full_name: string;
  password: string;
};

export function useRegister() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      await endpoints.register(input);
      // Sign in immediately; if that fails the account still exists.
      try {
        const session = await endpoints.login(input.email, input.password);
        return { session };
      } catch {
        return { session: null };
      }
    },
    onSuccess: ({ session }) => {
      if (!session) return;
      tokenStore.set(session.access_token);
      queryClient.setQueryData<User>(queryKeys.auth, session.user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      tokenStore.clear();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
}
