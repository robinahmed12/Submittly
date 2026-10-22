'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { login } from '../api';
import type { LoginInput } from '../schemas';
import { roleHome } from '../roles';

/**
 * Signs in.
 *
 * On success the proxy has already written the session cookies, so the only
 * thing left is to drop the previous user's cached data and navigate to the
 * right home for the role.
 *
 * `nextPath` is a path that was already validated server-side by
 * `safeNextPath`, so it can only ever be a same-origin path.
 */
export function useLogin(nextPath?: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: LoginInput) => login(input),
    onSuccess: ({ user }) => {
      // A new identity invalidates every cached query.
      queryClient.clear();
      router.push(nextPath ?? roleHome(user.role));
      router.refresh();
    },
  });
}
