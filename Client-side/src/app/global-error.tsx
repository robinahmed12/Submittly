'use client';

/**
 * The last-resort boundary.
 *
 * Catches failures in the **root layout** itself, so it has to render its
 * own `<html>` and `<body>`.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="flex min-h-svh items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="text-muted-foreground text-sm">
            The app failed to start. Please try again.
          </p>
          <button
            type="button"
            onClick={reset}
            className="bg-primary text-primary-foreground hover:bg-primary/80 rounded-md px-4 py-2 text-sm font-medium"
          >
            Try again
          </button>
          {error.digest && <p className="text-muted-foreground text-xs">Ref: {error.digest}</p>}
        </div>
      </body>
    </html>
  );
}
