import { apiGet, apiPost } from '@/lib/api-client';
import type { Submission, SubmissionList } from '@/types/api';
import type { CreateSubmissionInput } from './schemas';

/**
 * The submissions feature's API calls.
 *
 * The Bearer header is attached server-side by the backend proxy route.
 */

/** The signed-in student's own submissions, newest first. */
export function listMySubmissions(): Promise<SubmissionList> {
  return apiGet<SubmissionList>('/submissions/me');
}

/** Creates a submission. The server always stores it as `PENDING`. */
export function createSubmission(
  input: CreateSubmissionInput,
): Promise<{ submission: Submission }> {
  return apiPost<{ submission: Submission }>('/submissions', input);
}
