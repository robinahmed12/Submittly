'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';

/**
 * The dark-mode toggle.
 *
 * `resolvedTheme` is `undefined` on the server *and* on the first client
 * render, so it is the hydration-safe signal: the icon is only rendered once
 * the theme is known, and the first client render still matches the server's.
 */
export function useThemeToggle(): { isDark: boolean; ready: boolean; toggle: () => void } {
  const { resolvedTheme, setTheme } = useTheme();

  const ready = resolvedTheme !== undefined;
  const isDark = resolvedTheme === 'dark';

  return { ready, isDark, toggle: () => setTheme(isDark ? 'light' : 'dark') };
}

/** A standalone icon button that toggles the theme. */
export function ThemeToggleButton({ className }: { className?: string }) {
  const { isDark, ready, toggle } = useThemeToggle();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggle}
      className={className}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {ready ? (
        isDark ? (
          <Sun className="size-4" />
        ) : (
          <Moon className="size-4" />
        )
      ) : (
        <span className="size-4" aria-hidden="true" />
      )}
    </Button>
  );
}
