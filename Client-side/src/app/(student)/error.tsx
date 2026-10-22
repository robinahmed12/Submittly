'use client';

import { ErrorFallback } from '@/components/shared/error-fallback';

export default function StudentError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <ErrorFallback
      title="Couldn't load your submissions"
      description="Something went wrong on our end. Please try again."
      onRetry={reset}
      digest={error.digest}
    />
  );
}
