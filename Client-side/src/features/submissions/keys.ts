/**
 * Query keys for the submissions feature.
 *
 * Never inline a key string — inline keys drift and silently break
 * invalidation. See coding-style.md §6.
 */
export const submissionKeys = {
  all: ['submissions'] as const,
  mine: () => [...submissionKeys.all, 'me'] as const,
};
