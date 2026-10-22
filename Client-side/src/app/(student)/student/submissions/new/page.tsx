import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { SubmissionForm } from '@/features/submissions/components/submission-form';

export const metadata: Metadata = {
  title: 'New submission',
};

export default function NewSubmissionPage() {
  return (
    <>
      <PageHeader
        title="Submit a project"
        description="Tell the mentors what you built. You will be able to track the review status here."
        action={
          <Button asChild variant="outline">
            <Link href="/student/dashboard">Back to submissions</Link>
          </Button>
        }
      />
      <SubmissionForm />
    </>
  );
}
