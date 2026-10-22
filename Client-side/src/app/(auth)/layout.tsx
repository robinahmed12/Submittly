import type { ReactNode } from 'react';
import { ThemeToggleButton } from '@/components/shared/theme-toggle';

/**
 * The shell for the signed-out pages.
 *
 * A centred card on a plain background — deliberately different from the
 * app shell, which is for signed-in pages. The theme toggle sits in the
 * corner so a signed-out visitor can still switch modes.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-svh items-center justify-center px-4 py-12">
      <div className="absolute top-4 right-4">
        <ThemeToggleButton />
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
