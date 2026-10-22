import type { SubmissionStatus } from '@/types/api';

/**
 * The list parameters for the mentor submissions table.
 *
 * All three are server-driven — the client never filters or paginates in
 * memory (Requirements §4.3, §9).
 */
export interface ListSubmissionsParams {
  page: number;
  limit: number;
  /** Explicitly `undefined` when no filter is applied. */
  status?: SubmissionStatus | undefined;
}

/** The page sizes offered in the table's size selector. */
export const PAGE_SIZE_OPTIONS = [10, 25, 50] as const;

/** The server caps `limit` at 50 (see the server's `listSubmissionsQuerySchema`). */
export const MAX_PAGE_SIZE = 50;

export const DEFAULT_PAGE_SIZE = 10;
