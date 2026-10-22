'use client';

import { ErrorFallback } from '@/components/shared/error-fallback';

export default function AuthError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load the sign-in page"
      description="Please try again, or go back to the home page."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
