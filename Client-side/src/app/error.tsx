'use client';

import { ErrorFallback } from '@/components/shared/error-fallback';

/**
 * The root error boundary.
 *
 * Catches failures in the page tree below the root layout. `global-error.tsx`
 * catches failures in the root layout itself.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Something went wrong"
      description="We couldn't load this page. Please try again."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
