import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { LoadingSkeleton } from '@/components/shared/loading-skeleton';
import { SubmissionsExplorer } from '@/features/review/components/submissions-explorer';

export const metadata: Metadata = {
  title: 'Review submissions',
};

export default function MentorSubmissionsPage() {
  return (
    <>
      <PageHeader
        title="Review submissions"
        description="Every project submission, newest first. Approve or reject the ones that are still pending."
      />
      <Suspense fallback={<LoadingSkeleton count={4} />}>
        <SubmissionsExplorer />
      </Suspense>
    </>
  );
}
