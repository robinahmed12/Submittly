import { apiGet, apiPatch } from '@/lib/api-client';
import type { PaginatedSubmissions, ReviewStats, ReviewSubmission } from '@/types/api';
import type { UpdateStatusInput } from './schemas';
import type { ListSubmissionsParams } from './types';

/**
 * The review feature's API calls.
 *
 * The Bearer header is attached server-side by the backend proxy route.
 */

/** A paginated, server-side filtered list of submissions. */
export function listSubmissions(params: ListSubmissionsParams): Promise<PaginatedSubmissions> {
  const query = new URLSearchParams({
    page: String(params.page),
    limit: String(params.limit),
  });
  if (params.status) {
    query.set('status', params.status);
  }
  return apiGet<PaginatedSubmissions>(`/mentor/submissions?${query.toString()}`);
}

/** Aggregated counts per status. */
export function getStats(): Promise<{ stats: ReviewStats }> {
  return apiGet<{ stats: ReviewStats }>('/mentor/stats');
}

/** Approves or rejects a submission. */
export function updateStatus(
  id: string,
  input: UpdateStatusInput,
): Promise<{ submission: ReviewSubmission }> {
  return apiPatch<{ submission: ReviewSubmission }>(`/mentor/submissions/${id}/status`, input);
}
