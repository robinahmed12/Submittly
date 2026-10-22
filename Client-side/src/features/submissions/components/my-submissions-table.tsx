'use client';

import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Submission } from '@/types/api';

interface MySubmissionsTableProps {
  submissions: Submission[];
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * The student's own submissions in table form.
 *
 * Below `md` the table becomes a stacked card list — a horizontally
 * scrolling table is unusable on a phone (see implementation-plan.md §9).
 */
export function MySubmissionsTable({ submissions }: MySubmissionsTableProps) {
  return (
    <>
      {/* Desktop: a real table. */}
      <div className="hidden overflow-x-auto md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Project</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Submitted</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {submissions.map(submission => (
              <TableRow key={submission.id}>
                <TableCell className="max-w-[320px]">
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
                    {submission.liveUrl && (
                      <a
                        href={submission.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground inline-flex items-center gap-1 text-xs underline underline-offset-4"
                      >
                        Live demo
                        <ExternalLink className="size-3 shrink-0" aria-hidden="true" />
                        <span className="sr-only">(opens in a new tab)</span>
                      </a>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <StatusBadge status={submission.status} />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {formatDate(submission.createdAt)}
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
            <p className="text-muted-foreground mt-3 text-xs">
              Submitted {formatDate(submission.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </>
  );
}
