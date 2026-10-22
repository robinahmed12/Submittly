'use client';

import { LayoutDashboard, ListChecks } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';

const ITEMS = [
  { href: '/mentor/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/mentor/submissions', label: 'Submissions', icon: ListChecks },
];

/**
 * The mentor navigation.
 *
 * A client component so it can own its icons and read the current path for
 * the active state. The shared shell renders it as a slot — it never knows
 * which persona's routes these are.
 */
export function MentorNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Mentor</SidebarGroupLabel>
      <SidebarMenu>
        {ITEMS.map(item => (
          <SidebarMenuItem key={item.href}>
            <SidebarMenuButton
              asChild
              isActive={pathname === item.href}
              tooltip={item.label}
              /* shadcn v4 highlights the active menu item with the accent
                 grey; the brand red is the intended highlight here (§2.5). */
              className="data-active:bg-sidebar-primary data-active:text-sidebar-primary-foreground"
            >
              <Link href={item.href}>
                <item.icon />
                <span>{item.label}</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
