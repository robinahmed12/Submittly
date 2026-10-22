import { QueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';

/**
 * QueryClient factory and shared defaults.
 *
 * Kept separate from the provider so the same options apply to the browser
 * client and to any server-side client, and so feature code can build a
 * client with identical behaviour when it needs one.
 */

export const DEFAULT_STALE_TIME_MS = 30_000;

/**
 * Never retry a client error — a 400/401/403/404/409/422/429 will fail
 * identically on a second attempt, and retrying only delays the message the
 * user needs to see. Server errors get two retries.
 */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
    return false;
  }
  return failureCount < 2;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: DEFAULT_STALE_TIME_MS,
        refetchOnWindowFocus: false,
        retry: shouldRetry,
      },
      mutations: {
        retry: false,
      },
    },
  });
}
