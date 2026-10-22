'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { SubmissionStatus } from '@/types/api';
import { STATUS_FILTER_OPTIONS } from '../types';

interface StatusFilterProps {
  value: SubmissionStatus | 'ALL';
  onChange: (value: SubmissionStatus | 'ALL') => void;
  disabled?: boolean;
}

/**
 * The server-side status filter.
 *
 * Changing it resets the page to 1 — a filtered list is a new list, and
 * page 4 of the previous filter is meaningless.
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
