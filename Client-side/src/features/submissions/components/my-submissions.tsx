'use client';

import { FilterX, Plus, Search, X } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { StatusFilter, STATUS_FILTER_OPTIONS } from '@/components/shared/status-filter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMySubmissions } from '@/features/submissions/hooks/use-my-submissions';
import { MySubmissionsTable } from '@/features/submissions/components/my-submissions-table';
import type { SubmissionStatus } from '@/types/api';

/**
 * The student's submissions.
 *
 * A client component because the list is fetched in the browser through
 * TanStack Query — the page shell around it stays a Server Component.
 *
 * Search and the status filter run **in the browser**: `/submissions/me`
 * returns the student's entire list (the server scopes it by the token),
 * so filtering locally shows every row immediately. The control set
 * deliberately mirrors the mentor table, which filters against a paginated
 * server response instead.
 */
export function MySubmissions() {
  const { data, isPending, isError, error, refetch, isRefetching } = useMySubmissions();

  const [query, setQuery] = useState('');
  const [status, setStatus] = useState<SubmissionStatus | 'ALL'>(
    STATUS_FILTER_OPTIONS[0]?.value ?? 'ALL',
  );

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

  const needle = query.trim().toLowerCase();
  const filtered = items.filter(item => {
    const matchesQuery =
      needle.length === 0 ||
      item.projectName.toLowerCase().includes(needle) ||
      item.repoUrl.toLowerCase().includes(needle);
    const matchesStatus = status === 'ALL' || item.status === status;
    return matchesQuery && matchesStatus;
  });
  const isFiltered = needle.length > 0 || status !== 'ALL';

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full md:w-auto md:max-w-sm md:flex-1">
          <Search
            className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
            aria-hidden="true"
          />
          <Input
            type="text"
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search name or repository…"
            aria-label="Search submissions by project name or repository URL"
            className="pl-9"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={() => setQuery('')}
              aria-label="Clear search"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <StatusFilter value={status} onChange={setStatus} />

        {data && (
          <p className="text-muted-foreground ml-auto text-sm" aria-live="polite">
            {filtered.length} of {items.length} {items.length === 1 ? 'submission' : 'submissions'}
            {isFiltered && ' match this filter'}
          </p>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<FilterX className="size-8" aria-hidden="true" />}
          title="No submissions match"
          description="Nothing matches this search and status. Try different terms, or clear the filters."
          action={
            <Button
              variant="outline"
              onClick={() => {
                setQuery('');
                setStatus('ALL');
              }}
            >
              Clear filters
            </Button>
          }
        />
      ) : (
        <MySubmissionsTable submissions={filtered} />
      )}
    </div>
  );
}
