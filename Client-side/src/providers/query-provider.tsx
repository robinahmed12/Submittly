'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { createQueryClient } from '@/lib/query-client';

/**
 * A fresh client per server render keeps requests isolated; a single browser
 * client preserves the cache across re-renders. This is the pattern from
 * Next.js's own TanStack Query guide.
 */
let browserQueryClient: ReturnType<typeof createQueryClient> | undefined;

function getQueryClient(): ReturnType<typeof createQueryClient> {
  if (typeof window === 'undefined') {
    return createQueryClient();
  }
  browserQueryClient ??= createQueryClient();
  return browserQueryClient;
}

export function QueryProvider({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={getQueryClient()}>{children}</QueryClientProvider>;
}
