'use client';

import { ThemeProvider as NextThemesProvider } from 'next-themes';
import type { ReactNode } from 'react';

/**
 * Dark mode via `next-themes`, using the `class` strategy so Tailwind's
 * `dark:` variant and the `dark` CSS variable block both apply.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      {children}
    </NextThemesProvider>
  );
}
