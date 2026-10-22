'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubmissionStatus } from '@/types/api';

/** The status filter values, including the "no filter" option. */
export const STATUS_FILTER_OPTIONS: ReadonlyArray<{
  value: SubmissionStatus | 'ALL';
  label: string;
}> = [
  { value: 'ALL', label: 'All statuses' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'REJECTED', label: 'Rejected' },
];

interface StatusFilterProps {
  value: SubmissionStatus | 'ALL';
  onChange: (value: SubmissionStatus | 'ALL') => void;
  disabled?: boolean;
}

/**
 * The status filter, shared by every submission list.
 *
 * Moved here from `features/review` once the student list needed the same
 * control — shared code cannot import from a feature, so the control had to
 * move up, not be duplicated (see coding-style.md §10.1).
 */
export function StatusFilter({ value, onChange, disabled }: StatusFilterProps) {
  return (
    <Select
      value={value}
      onValueChange={next => onChange(next as SubmissionStatus | 'ALL')}
      disabled={disabled}
    >
      <SelectTrigger className="w-[180px]" aria-label="Filter by status">
        <SelectValue placeholder="All statuses" />
      </SelectTrigger>
      <SelectContent>
        {STATUS_FILTER_OPTIONS.map(option => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
