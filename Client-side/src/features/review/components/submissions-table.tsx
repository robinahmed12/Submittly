'use client';

import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { ReviewSubmission } from '@/types/api';

interface SubmissionsTableProps {
  submissions: ReviewSubmission[];
  isPending: boolean;
  /** Called when a mentor clicks Approve or Reject. */
  onReview: (submission: ReviewSubmission, status: 'APPROVED' | 'REJECTED') => void;
  reviewPending: boolean;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The review queue.
 *
 * Below `md` the table becomes a stacked card list — a horizontally
 * scrolling table is unusable on a phone (see implementation-plan.md §9).
 */
export function SubmissionsTable({
  submissions,
  isPending,
  onReview,
  reviewPending,
}: SubmissionsTableProps) {
  if (isPending) {
    return <TableSkeleton />;
  }

  return (
    <>
      {/* Desktop: a real table. */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Student</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map(submission => (
              <TableRow key={submission.id}>
                <TableCell className="max-w-[280px]">
                  <div className="space-y-1">
                    <p className="font-medium">{submission.projectName}</p>
                    <a
                      href={submission.repoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground inline-flex max-w-full items-center gap-1 truncate text-xs underline underline-offset-4"
                    >
                      <span className="truncate">{submission.repoUrl}</span>
                      <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                      <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="font-medium">{submission.student.name}</p>
                  <p className="text-muted-foreground text-xs">{submission.student.email}</p>
                </TableCell>
                <TableCell>
                  <StatusBadge status={submission.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(submission.createdAt)}
                </TableCell>
                <TableCell className="text-right">
                  <ReviewActions
                    submission={submission}
                    onReview={onReview}
                    disabled={reviewPending}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile: the same rows, stacked. */}
      <ul className="grid gap-3 md:hidden">
        {submissions.map(submission => (
          <li key={submission.id} className="rounded-lg border p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 space-y-1">
                <p className="font-medium">{submission.projectName}</p>
                <a
                  href={submission.repoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground inline-flex max-w-full items-center gap-1 text-xs underline underline-offset-4"
                >
                  <span className="truncate">{submission.repoUrl}</span>
                  <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </div>
              <StatusBadge status={submission.status} />
            </div>

            <p className="text-muted-foreground mt-3 text-sm">
              {submission.student.name} · {submission.student.email}
            </p>
            <p className="text-muted-foreground text-xs">
              Submitted {formatDate(submission.createdAt)}
            </p>

            <div className="mt-3">
              <ReviewActions
                submission={submission}
                onReview={onReview}
                disabled={reviewPending}
                stacked
              />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

interface ReviewActionsProps {
  submission: ReviewSubmission;
  onReview: (submission: ReviewSubmission, status: 'APPROVED' | 'REJECTED') => void;
  disabled: boolean;
  stacked?: boolean;
}

/** The Approve / Reject buttons. Only enabled while the submission is `PENDING`. */
function ReviewActions({ submission, onReview, disabled, stacked }: ReviewActionsProps) {
  const isPending = submission.status === 'PENDING';

  if (!isPending) {
    return (
      <span className="text-muted-foreground text-xs">
        Already reviewed — only pending submissions can be changed.
      </span>
    );
  }

  return (
    <div className={stacked ? 'flex gap-2' : 'flex justify-end gap-2'}>
      <Button
        size="sm"
        onClick={() => onReview(submission, 'APPROVED')}
        disabled={disabled}
        aria-label={`Approve ${submission.projectName}`}
      >
        Approve
      </Button>
      <Button
        size="sm"
        variant="destructive"
        onClick={() => onReview(submission, 'REJECTED')}
        disabled={disabled}
        aria-label={`Reject ${submission.projectName}`}
      >
        Reject
      </Button>
    </div>
  );
}

/** Header row plus placeholder rows, matching the table's shape. */
function TableSkeleton() {
  return (
    <div className="space-y-2" aria-busy="true" aria-live="polite">
      <span className="sr-only">Loading submissions…</span>
      {Array.from({ length: 5 }, (_, index) => (
        <div key={index} className="flex items-center gap-4 rounded-lg border p-4">
          <Skeleton className="h-4 w-1/4" />
          <Skeleton className="h-4 w-1/5" />
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </div>
  );
}
