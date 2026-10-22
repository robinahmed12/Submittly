import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { MySubmissions } from '@/features/submissions/components/my-submissions';

export const metadata: Metadata = {
  title: 'My submissions',
};

export default function StudentDashboardPage() {
  return (
    <>
      <PageHeader
        title="My submissions"
        description="Track the review status of the projects you have submitted."
        action={
          <Button asChild>
            <Link href="/student/submissions/new">New submission</Link>
          </Button>
        }
      />
      <MySubmissions />
    </>
  );
}
