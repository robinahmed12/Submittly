'use client';

import { useQuery } from '@tanstack/react-query';
import { listMySubmissions } from '../api';
import { submissionKeys } from '../keys';

/**
 * The signed-in student's own submissions.
 *
 * Scoped by the token on the server — a student can never read someone
 * else's rows, so there is no filter to pass here.
 */
export function useMySubmissions() {
  return useQuery({
    queryKey: submissionKeys.mine(),
    queryFn: () => listMySubmissions(),
  });
}
