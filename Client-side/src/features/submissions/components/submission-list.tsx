import { FileText } from 'lucide-react';
import Link from 'next/link';
import { EmptyState } from '@/components/shared/empty-state';
import { Button } from '@/components/ui/button';
import type { Submission } from '@/types/api';
import { SubmissionCard } from './submission-card';

interface SubmissionListProps {
  submissions: Submission[];
}

/**
 * The student's submissions.
 *
 * The empty state distinguishes "you have not submitted anything yet" from
 * "nothing matches" — here there is only the former, because the list is
 * always scoped to the signed-in student.
 */
export function SubmissionList({ submissions }: SubmissionListProps) {
  if (submissions.length === 0) {
    return (
      <EmptyState
        icon={<FileText className="size-8" aria-hidden="true" />}
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
    <div className="grid gap-4">
      {submissions.map(submission => (
        <SubmissionCard key={submission.id} submission={submission} />
      ))}
    </div>
  );
}
