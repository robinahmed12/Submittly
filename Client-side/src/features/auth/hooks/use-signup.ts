'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { signup } from '../api';
import type { SignupInput } from '../schemas';

/**
 * Registers a student account.
 *
 * The server assigns the `STUDENT` role — roles are never client-suppliable
 * — so the destination is always the student dashboard.
 */
export function useSignup() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SignupInput) => signup(input),
    onSuccess: () => {
      queryClient.clear();
      router.push('/student/dashboard');
      router.refresh();
    },
  });
}
