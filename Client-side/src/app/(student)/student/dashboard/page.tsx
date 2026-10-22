import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'My submissions',
};

/**
 * Placeholder — the real student dashboard arrives in Outlet 4.
 *
 * It exists so the post-signup and post-login redirect has somewhere to
 * land, and so the persona layout is exercised end to end.
 */
export default function StudentDashboardPage() {
  return (
    <>
      <PageHeader
        title="My submissions"
        description="Track the review status of the projects you have submitted."
      />
      <Card>
        <CardHeader>
          <CardTitle>Nothing here yet</CardTitle>
          <CardDescription>
            The submission list and the new-submission form arrive in Outlet 4.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}
