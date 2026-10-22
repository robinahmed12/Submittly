'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { listSubmissions } from '../api';
import { reviewKeys } from '../keys';
import type { ListSubmissionsParams } from '../types';

/**
 * A paginated, server-side filtered list of submissions.
 *
 * `status` is applied in the database, not in memory (Requirements §4.3).
 * `keepPreviousData` keeps the current rows on screen while the next page
 * loads, so the table does not flash empty between pages.
 */
export function useSubmissions(params: ListSubmissionsParams) {
  return useQuery({
    queryKey: reviewKeys.submissionsList(params),
    queryFn: () => listSubmissions(params),
    placeholderData: keepPreviousData,
  });
}
