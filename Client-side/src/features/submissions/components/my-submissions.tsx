'use client';

import { Plus } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { Button } from '@/components/ui/button';
import { useMySubmissions } from '@/features/submissions/hooks/use-my-submissions';
import { SubmissionList } from '@/features/submissions/components/submission-list';

/**
 * The student's submissions.
 *
 * A client component because the list is fetched in the browser through
 * TanStack Query — the page shell around it stays a Server Component.
 */
export function MySubmissions() {
  const { data, isPending, isError, error, refetch, isRefetching } = useMySubmissions();

  if (isPending) {
    return <LoadingSkeleton count={2} />;
  }

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load your submissions"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  }

  const items = data?.items ?? [];

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<Plus className="size-8" aria-hidden="true" />}
        title="No submissions yet"
        description="Submit your first project and track its review status here."
        action={
          <Button asChild>
            <Link href="/student/submissions/new">Submit your first project</Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground text-sm">
        {items.length} {items.length === 1 ? 'submission' : 'submissions'}
      </p>
      <SubmissionList submissions={items} />
    </div>
  );
}
