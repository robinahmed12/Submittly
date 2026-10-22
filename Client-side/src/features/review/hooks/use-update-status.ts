'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ApiError } from '@/lib/api-client';
import { updateStatus } from '../api';
import { reviewKeys } from '../keys';
import type { UpdateStatusInput } from '../schemas';

interface UpdateStatusVariables extends UpdateStatusInput {
  id: string;
}

/**
 * Approves or rejects a submission.
 *
 * On success the list and the statistics are invalidated, so the table and
 * the dashboard cards refetch and reflect the decision.
 */
export function useUpdateStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...input }: UpdateStatusVariables) => updateStatus(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: reviewKeys.submissions() });
      queryClient.invalidateQueries({ queryKey: reviewKeys.stats() });
    },
    onError: error => {
      // Another mentor may have reviewed the same submission first. Refetch
      // so the table shows the real state rather than a stale row.
      if (error instanceof ApiError && error.code === 'INVALID_STATUS_TRANSITION') {
        queryClient.invalidateQueries({ queryKey: reviewKeys.submissions() });
        queryClient.invalidateQueries({ queryKey: reviewKeys.stats() });
      }
    },
  });
}
