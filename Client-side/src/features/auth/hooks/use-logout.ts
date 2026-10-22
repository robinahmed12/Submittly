'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { logout } from '../api';

/**
 * Signs out.
 *
 * The session cookies are cleared server-side by `DELETE /api/session`;
 * browser JavaScript cannot delete an httpOnly cookie.
 */
export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => logout(),
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
      router.refresh();
    },
  });
}
