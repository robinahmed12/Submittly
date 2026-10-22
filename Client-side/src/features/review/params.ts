import type { SubmissionStatus } from '@/types/api';
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from './types';

/**
 * The list parameters live in the URL, so the view is shareable and the back
 * button works. That makes the query string **user input** — every value is
 * parsed defensively before it reaches the API.
 */

export function parsePage(raw: string | null): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1) return 1;
  return value;
}

export function parseLimit(raw: string | null): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < 1 || value > MAX_PAGE_SIZE) return DEFAULT_PAGE_SIZE;
  return value;
}

export function parseStatus(raw: string | null): SubmissionStatus | undefined {
  if (raw === 'PENDING' || raw === 'APPROVED' || raw === 'REJECTED') return raw;
  return undefined;
}

export interface ListParamChanges {
  page?: number;
  limit?: number;
  status?: SubmissionStatus | 'ALL';
}

/**
 * Builds the next query string.
 *
 * Changing the filter or the page size resets to page 1 — a filtered list is
 * a new list, and page 4 of the previous filter is meaningless.
 */
export function buildListParams(
  current: URLSearchParams,
  changes: ListParamChanges,
): URLSearchParams {
  const params = new URLSearchParams(current.toString());

  if (changes.status !== undefined) {
    if (changes.status === 'ALL') {
      params.delete('status');
    } else {
      params.set('status', changes.status);
    }
    params.set('page', '1');
  }

  if (changes.page !== undefined) {
    params.set('page', String(changes.page));
  }

  if (changes.limit !== undefined) {
    params.set('limit', String(changes.limit));
    params.set('page', '1');
  }

  return params;
}
