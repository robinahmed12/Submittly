'use client';

import { ErrorState } from '@/components/shared/error-state';

interface ErrorFallbackProps {
  title?: string;
  description?: string;
  /** The retry callback Next.js passes to `error.tsx`. */
  onRetry?: () => void;
  /** Next.js's build-time id for the error — useful in logs, useless to users. */
  digest?: string | undefined;
}

/**
 * The shared error presentation.
 *
 * Each route group's `error.tsx` is a thin wrapper around this, so the
 * wording and the retry affordance stay consistent across the app.
 */
export function ErrorFallback({ title, description, onRetry, digest }: ErrorFallbackProps) {
  return (
    <div className="mx-auto w-full max-w-lg py-12">
      <ErrorState
        title={title ?? 'Something went wrong'}
        description={description ?? "We couldn't load this page. Please try again."}
        onRetry={onRetry}
      />
      {digest && <p className="text-muted-foreground mt-4 text-center text-xs">Ref: {digest}</p>}
    </div>
  );
}
