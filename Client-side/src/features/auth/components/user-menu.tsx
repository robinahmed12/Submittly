'use client';

import { LogOut } from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useThemeToggle } from '@/components/shared/theme-toggle';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { Session } from '@/types/api';
import { useLogout } from '../hooks/use-logout';
import { roleLabel } from '../roles';

interface UserMenuProps {
  session: Session;
}

/**
 * The signed-in user's menu: identity, theme toggle, and sign out.
 *
 * Sign-out calls the local `DELETE /api/session` route, because the session
 * cookies are httpOnly and cannot be cleared by browser JavaScript.
 */
export function UserMenu({ session }: UserMenuProps) {
  const logout = useLogout();
  const { isDark, toggle } = useThemeToggle();

  const initials = session.name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join('');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full" aria-label="Account menu">
          <Avatar>
            <AvatarFallback>{initials || '?'}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>
          <span className="block text-sm font-medium">{session.name}</span>
          <span className="text-muted-foreground block text-xs font-normal">{session.email}</span>
          <span className="text-muted-foreground block text-xs font-normal">
            {roleLabel(session.role)}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={toggle}>
          {isDark ? 'Light mode' : 'Dark mode'}
        </DropdownMenuItem>{' '}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          disabled={logout.isPending}
          onSelect={() => logout.mutate()}
        >
          <LogOut />
          {logout.isPending ? 'Signing out…' : 'Sign out'}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
