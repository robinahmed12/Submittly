import type { ReactNode } from 'react';

/**
 * The shell for the signed-out pages.
 *
 * A centred card on a plain background — deliberately different from the
 * app shell, which is for signed-in pages.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="flex min-h-svh items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
