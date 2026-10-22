import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorStateProps {
  title?: string;
  /** `| undefined` so a caller can pass a possibly-absent message straight through. */
  description?: string | undefined;
  /** A retry callback. When omitted, no retry button is rendered. */
  onRetry?: (() => void) | undefined;
  retrying?: boolean | undefined;
}

/**
 * Shown when a request failed.
 *
 * The message must be human-readable — the API's own `message` is used
 * verbatim wherever there is one.
 */
export function ErrorState({
  title = 'Something went wrong',
  description = "We couldn't load this. Please try again.",
  onRetry,
  retrying = false,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed px-6 py-12 text-center"
    >
      <AlertCircle className="text-destructive size-6" aria-hidden="true" />
      <div className="space-y-1">
        <p className="font-medium">{title}</p>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry} disabled={retrying}>
          {retrying ? 'Retrying…' : 'Try again'}
        </Button>
      )}
    </div>
  );
}
