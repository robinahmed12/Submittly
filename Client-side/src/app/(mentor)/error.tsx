'use client';

import { ErrorFallback } from '@/components/shared/error-fallback';

export default function MentorError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load the review dashboard"
      description="Something went wrong on our end. Please try again."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
