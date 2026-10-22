'use client';

import { FilePlus2, LayoutDashboard } from 'lucide-react';
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
  { href: '/student/dashboard', label: 'My submissions', icon: LayoutDashboard },
  { href: '/student/submissions/new', label: 'New submission', icon: FilePlus2 },
];

/**
 * The student navigation.
 *
 * A client component so it can own its icons and read the current path for
 * the active state. The shared shell renders it as a slot — it never knows
 * which persona's routes these are.
 */
export function StudentNav() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Student</SidebarGroupLabel>
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
