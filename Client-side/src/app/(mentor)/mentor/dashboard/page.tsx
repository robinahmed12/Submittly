import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { StatsOverview } from '@/features/review/components/stats-overview';

export const metadata: Metadata = {
  title: 'Mentor dashboard',
};

export default function MentorDashboardPage() {
  return (
    <>
      <PageHeader
        title="Mentor dashboard"
        description="Aggregated statistics for every project submission."
        action={
          <Button asChild>
            <Link href="/mentor/submissions">Review submissions</Link>
          </Button>
        }
      />
      <StatsOverview />
    </>
  );
}
