import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserMenu } from '@/features/auth/components/user-menu';
import { roleLabel } from '@/features/auth/roles';
import type { Role, Session } from '@/types/api';

/**
 * Page chrome: brand, navigation, and the signed-in user.
 *
 * This is a Server Component — it renders on the server and the user menu
 * inside it is the only client island.
 *
 * **Boundary note:** this imports `features/auth`. That is the one exception
 * to "shared code never imports from a feature" — the auth feature is
 * cross-cutting (every persona has an account), not persona-specific.
 * Persona features (`submissions`, `review`) are still off-limits here.
 */

export interface NavItem {
  href: string;
  label: string;
}

/** The navigation links for a role. */
export function navForRole(role: Role): NavItem[] {
  switch (role) {
    case 'STUDENT':
      return [
        { href: '/student/dashboard', label: 'My submissions' },
        { href: '/student/submissions/new', label: 'New submission' },
      ];
    case 'MENTOR':
    case 'ADMIN':
      return [
        { href: '/mentor/dashboard', label: 'Dashboard' },
        { href: '/mentor/submissions', label: 'Submissions' },
      ];
  }
}

interface AppShellProps {
  /** The signed-in user, or `null` when signed out. */
  session: Session | null;
  /** Navigation links. Defaults to the links for the session's role. */
  nav?: NavItem[];
  children: ReactNode;
}

export function AppShell({ session, nav, children }: AppShellProps) {
  const links = nav ?? (session ? navForRole(session.role) : []);

  return (
    <div className="flex min-h-svh flex-col">
      <header className="border-border bg-background/95 sticky top-0 z-40 border-b backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center gap-6 px-4 sm:px-6 lg:px-8">
          <Link href="/" className="text-lg font-semibold tracking-tight">
            Submittly
          </Link>

          {links.length > 0 && (
            <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
              {links.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-muted-foreground hover:bg-accent hover:text-foreground rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="ml-auto flex items-center gap-2">
            {session ? (
              <>
                <span className="text-muted-foreground hidden text-sm md:inline">
                  {roleLabel(session.role)}
                </span>
                <UserMenu session={session} />
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                >
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}
