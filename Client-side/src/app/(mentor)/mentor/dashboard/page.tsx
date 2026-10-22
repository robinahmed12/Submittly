import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const metadata: Metadata = {
  title: 'Mentor dashboard',
};

/**
 * Placeholder — the real mentor dashboard arrives in Outlet 5.
 *
 * It exists so the post-login redirect for a mentor or admin has somewhere
 * to land, and so the persona layout is exercised end to end.
 */
export default function MentorDashboardPage() {
  return (
    <>
      <PageHeader
        title="Mentor dashboard"
        description="Aggregated statistics for every project submission."
      />
      <Card>
        <CardHeader>
          <CardTitle>Nothing here yet</CardTitle>
          <CardDescription>
            The statistics cards and the review queue arrive in Outlet 5.
          </CardDescription>
        </CardHeader>
        <CardContent />
      </Card>
    </>
  );
}
