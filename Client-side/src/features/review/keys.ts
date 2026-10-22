/**
 * Query keys for the review feature.
 *
 * Never inline a key string — inline keys drift and silently break
 * invalidation. See coding-style.md §6.
 */
export const reviewKeys = {
  all: ['review'] as const,
  submissions: () => [...reviewKeys.all, 'submissions'] as const,
  submissionsList: (params: { page: number; limit: number; status?: string | undefined }) =>
    [...reviewKeys.submissions(), 'list', params] as const,
  stats: () => [...reviewKeys.all, 'stats'] as const,
};
