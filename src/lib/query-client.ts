import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./api";

/** 401/403/404 kabi xatolar qayta-urinish bilan kuchaymaydi; 5xx va tarmoq — 2 marta. */
export function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: (count, error) => !(error instanceof ApiError && error.status < 500) && count < 2,
        refetchOnWindowFocus: true,
      },
      mutations: { retry: false },
    },
  });
}
