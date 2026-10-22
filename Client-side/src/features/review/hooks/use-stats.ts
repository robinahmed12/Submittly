'use client';

import { useQuery } from '@tanstack/react-query';
import { getStats } from '../api';
import { reviewKeys } from '../keys';

/** Aggregated submission counts, for the dashboard cards. */
export function useStats() {
  return useQuery({
    queryKey: reviewKeys.stats(),
    queryFn: () => getStats(),
  });
}
