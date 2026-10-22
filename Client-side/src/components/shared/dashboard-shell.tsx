'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { UserMenu } from '@/features/auth/components/user-menu';
import { ThemeToggleButton } from '@/components/shared/theme-toggle';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarProvider,
  SidebarRail,
  SidebarSeparator,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import type { Session } from '@/types/api';
import { roleLabel } from '@/features/auth/roles';

/**
 * The SaaS dashboard shell: a collapsible sidebar, a top bar, and the page.
 *
 * The shell is shared code, so it must not know about student or mentor
 * routes. The persona's navigation is passed in as a **React element slot**
 * rather than as data — an icon is a component, and components cannot cross
 * the server → client boundary. Each persona feature therefore owns a small
 * client component that renders its own menu.
 */

interface DashboardShellProps {
  /** The signed-in user. */
  session: Session;
  /** The persona's navigation, rendered inside the sidebar. */
  sidebar: ReactNode;
  children: ReactNode;
}

/** The Submittly mark — a red block with a white notch. */
function BrandMark() {
  return (
    <span
      aria-hidden="true"
      className="bg-brand-300 flex size-7 shrink-0 items-center justify-center rounded-md text-sm font-bold text-white"
    >
      S
    </span>
  );
}

export function DashboardShell({ session, sidebar, children }: DashboardShellProps) {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon" className="border-sidebar-border">
        <SidebarHeader>
          <Link
            href="/"
            className="text-sidebar-foreground flex items-center gap-2 px-1 py-1.5 text-base font-semibold tracking-tight"
          >
            <BrandMark />
            <span className="group-data-[collapsible=icon]:hidden">Submittly</span>
          </Link>
        </SidebarHeader>

        <SidebarSeparator />

        <SidebarContent>{sidebar}</SidebarContent>

        <SidebarFooter>
          <div className="text-sidebar-foreground/70 px-2 py-1 text-xs group-data-[collapsible=icon]:hidden">
            Signed in as {roleLabel(session.role)}
          </div>
        </SidebarFooter>

        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className="border-border bg-background/95 sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b px-4 backdrop-blur sm:px-6">
          <SidebarTrigger className="-ml-1" />
          <span className="text-foreground text-sm font-medium">Submittly</span>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggleButton />
            <UserMenu session={session} />
          </div>
        </header>

        <div className="flex flex-1 flex-col gap-6 p-4 sm:p-6">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
