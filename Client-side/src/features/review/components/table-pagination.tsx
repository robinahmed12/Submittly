'use client';

import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
} from '@/components/ui/pagination';

interface TablePaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}

/** The maximum number of numbered page links to show. */
const MAX_VISIBLE_PAGES = 7;

/**
 * Page controls for the submissions table.
 *
 * The page count comes from the server (`totalPages`), so the client never
 * has to guess how many pages there are.
 */
export function TablePagination({
  page,
  totalPages,
  onPageChange,
  disabled = false,
}: TablePaginationProps) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = buildPageRange(page, totalPages);

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationLink
            href="#"
            aria-label="Go to previous page"
            aria-disabled={disabled || page <= 1}
            className={disabled || page <= 1 ? 'pointer-events-none opacity-50' : undefined}
            onClick={event => {
              event.preventDefault();
              if (!disabled && page > 1) onPageChange(page - 1);
            }}
          >
            <ChevronLeft className="size-4" />
            <span className="sr-only">Previous</span>
          </PaginationLink>
        </PaginationItem>

        {pages.map(entry =>
          entry === 'ellipsis' ? (
            <PaginationItem key="ellipsis">
              <span className="text-muted-foreground flex size-9 items-center justify-center">
                …
              </span>
            </PaginationItem>
          ) : (
            <PaginationItem key={entry}>
              <PaginationLink
                href="#"
                isActive={entry === page}
                aria-label={`Go to page ${entry}`}
                className={disabled ? 'pointer-events-none opacity-50' : undefined}
                onClick={event => {
                  event.preventDefault();
                  if (!disabled) onPageChange(entry);
                }}
              >
                {entry}
              </PaginationLink>
            </PaginationItem>
          ),
        )}

        <PaginationItem>
          <PaginationLink
            href="#"
            aria-label="Go to next page"
            aria-disabled={disabled || page >= totalPages}
            className={
              disabled || page >= totalPages ? 'pointer-events-none opacity-50' : undefined
            }
            onClick={event => {
              event.preventDefault();
              if (!disabled && page < totalPages) onPageChange(page + 1);
            }}
          >
            <ChevronRight className="size-4" />
            <span className="sr-only">Next</span>
          </PaginationLink>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

/** The page numbers to show, with `ellipsis` marking the gaps. */
function buildPageRange(page: number, totalPages: number): Array<number | 'ellipsis'> {
  if (totalPages <= MAX_VISIBLE_PAGES) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages: Array<number | 'ellipsis'> = [1];
  const start = Math.max(2, page - 1);
  const end = Math.min(totalPages - 1, page + 1);

  if (start > 2) pages.push('ellipsis');
  for (let current = start; current <= end; current++) pages.push(current);
  if (end < totalPages - 1) pages.push('ellipsis');
  pages.push(totalPages);

  return pages;
}
