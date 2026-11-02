import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ApiError, api, type Me, type Role, type SiteConfig } from "./api";

export const ME_KEY = ["me"] as const;

export function useSiteConfig() {
  return useQuery<SiteConfig>({
    queryKey: ["config"],
    queryFn: api.config,
    staleTime: 5 * 60_000,
    retry: false,
  });
}

/** Sessiya ma'lumoti; kirmagan holat (401) xato emas, `me: null` hisoblanadi. */
export function useMe() {
  return useQuery<Me | null>({
    queryKey: ME_KEY,
    queryFn: async () => {
      try {
        return await api.me();
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    retry: false,
    staleTime: 30_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { role: Role; identifier: string; password: string }) =>
      api.login(input.role, input.identifier, input.password),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useBootstrap() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { login: string; password: string }) =>
      api.bootstrap(input.login, input.password),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["config"] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.logout(),
    onSuccess: () => qc.invalidateQueries(),
  });
}

export function useChangePassword() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { current: string; next: string }) =>
      api.changePassword(input.current, input.next),
    onSuccess: () => qc.invalidateQueries(),
  });
}

/** Panel sahifalari uchun: yuklanish tugagach, kerakli rol tekshiriladi. */
export function useRequireRole(role: Role) {
  const me = useMe();
  return {
    ready: !me.isLoading && !me.isPending,
    me: me.data?.role === role ? me.data : undefined,
    wrongRole: me.data && me.data.role !== role ? me.data.role : null,
    error: me.error,
    refetch: me.refetch,
  };
}
