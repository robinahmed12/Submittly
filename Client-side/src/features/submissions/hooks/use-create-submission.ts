'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { createSubmission } from '../api';
import { submissionKeys } from '../keys';
import type { CreateSubmissionInput } from '../schemas';

/**
 * Creates a submission.
 *
 * On success the student's list is invalidated so the dashboard refetches
 * and shows the new `PENDING` row.
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateSubmissionInput) => createSubmission(input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: submissionKeys.mine() });
    },
  });
}
