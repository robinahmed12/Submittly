'use client';

import { FilterX, Inbox } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { Button } from '@/components/ui/button';
import type { ReviewSubmission, SubmissionStatus } from '@/types/api';
import { useSubmissions } from '../hooks/use-submissions';
import { buildListParams, parseLimit, parsePage, parseStatus } from '../params';
import { ReviewDialog } from './review-dialog';
import { StatusFilter } from './status-filter';
import { SubmissionsTable } from './submissions-table';
import { TablePagination } from './table-pagination';
import { PAGE_SIZE_OPTIONS } from '../types';

/**
 * The review queue.
 *
 * `page`, `limit` and `status` live in the URL, so a filtered view is
 * shareable and the back button works. The server does the filtering and
 * the pagination — the client never filters in memory.
 */
export function SubmissionsExplorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const page = parsePage(searchParams.get('page'));
  const limit = parseLimit(searchParams.get('limit'));
  const status = parseStatus(searchParams.get('status'));

  const [reviewTarget, setReviewTarget] = useState<{
    submission: ReviewSubmission;
    status: 'APPROVED' | 'REJECTED';
  } | null>(null);

  const { data, isPending, isError, error, refetch, isFetching } = useSubmissions({
    page,
    limit,
    status,
  });

  function navigate(changes: Parameters<typeof buildListParams>[1]) {
    const params = buildListParams(new URLSearchParams(searchParams.toString()), changes);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }

  const items = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;
  const isFiltered = status !== undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <StatusFilter
          value={status ?? 'ALL'}
          onChange={value => navigate({ status: value })}
          disabled={isFetching}
        />

        <label className="text-muted-foreground flex items-center gap-2 text-sm">
          <span>Per page</span>
          <select
            className="border-input bg-background h-9 rounded-md border px-2 text-sm"
            value={limit}
            disabled={isFetching}
            onChange={event => navigate({ limit: Number(event.target.value) })}
            aria-label="Submissions per page"
          >
            {PAGE_SIZE_OPTIONS.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {data && (
          <p className="text-muted-foreground ml-auto text-sm">
            {data.total} {data.total === 1 ? 'submission' : 'submissions'}
            {isFiltered && ' matching this filter'}
          </p>
        )}
      </div>

      {isError ? (
        <ErrorState
          title="Couldn't load the submissions"
          description={error instanceof Error ? error.message : undefined}
          onRetry={() => void refetch()}
          retrying={isFetching}
        />
      ) : items.length === 0 && !isPending ? (
        isFiltered ? (
          <EmptyState
            icon={<FilterX className="size-8" aria-hidden="true" />}
            title="No submissions match this filter"
            description="Try a different status, or clear the filter to see everything."
            action={
              <Button variant="outline" onClick={() => navigate({ status: 'ALL' })}>
                Clear filter
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={<Inbox className="size-8" aria-hidden="true" />}
            title="No submissions have been submitted yet"
            description="Submissions from students will appear here for review."
          />
        )
      ) : (
        <SubmissionsTable
          submissions={items}
          isPending={isPending}
          reviewPending={false}
          onReview={(submission, nextStatus) => setReviewTarget({ submission, status: nextStatus })}
        />
      )}

      {data && data.total > 0 && (
        <div className="flex flex-col items-center gap-2">
          <TablePagination
            page={page}
            totalPages={totalPages}
            onPageChange={next => navigate({ page: next })}
            disabled={isFetching}
          />
          {totalPages > 1 && (
            <p className="text-muted-foreground text-xs">
              Page {page} of {totalPages}
            </p>
          )}
        </div>
      )}

      <ReviewDialog
        submission={reviewTarget?.submission ?? null}
        status={reviewTarget?.status ?? 'APPROVED'}
        onOpenChange={open => {
          if (!open) setReviewTarget(null);
        }}
        onReviewed={nextStatus => {
          toast.success(
            nextStatus === 'APPROVED' ? 'Submission approved.' : 'Submission rejected.',
          );
        }}
      />
    </div>
  );
}

/** Re-exported so the page can stay a thin Server Component. */
export type { SubmissionStatus };
