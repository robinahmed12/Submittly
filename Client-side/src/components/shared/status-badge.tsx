import { Badge } from '@/components/ui/badge';
import type { SubmissionStatus } from '@/types/api';

interface StatusBadgeProps {
  status: SubmissionStatus;
}

const STATUS_LABELS: Record<SubmissionStatus, string> = {
  PENDING: 'Pending',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
};

const STATUS_VARIANTS: Record<SubmissionStatus, 'secondary' | 'default' | 'destructive'> = {
  PENDING: 'secondary',
  APPROVED: 'default',
  REJECTED: 'destructive',
};

/**
 * The review status of a submission.
 *
 * The label carries the meaning, not just the colour — colour alone is
 * never the only signal (coding-style.md §9).
 */
export function StatusBadge({ status }: StatusBadgeProps) {
  return <Badge variant={STATUS_VARIANTS[status]}>{STATUS_LABELS[status]}</Badge>;
}
