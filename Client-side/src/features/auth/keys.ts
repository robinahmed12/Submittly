/**
 * Query keys for the auth feature.
 *
 * Never inline a key string — inline keys drift and silently break
 * invalidation. See coding-style.md §6.
 */
export const authKeys = {
  all: ['auth'] as const,
  session: () => [...authKeys.all, 'session'] as const,
};
