import { DashboardShell } from '@/components/shared/dashboard-shell';
import { MentorNav } from '@/features/review/components/mentor-nav';
import { getSession } from '@/lib/session-server';
import { redirect } from 'next/navigation';

export default async function MentorLayout({ children }: LayoutProps<'/mentor'>) {
  const session = await getSession();

  // The proxy already gates this path by role; this is a second line of
  // defence for the layout itself.
  if (!session || (session.role !== 'MENTOR' && session.role !== 'ADMIN')) {
    redirect('/login');
  }

  return (
    <DashboardShell session={session} sidebar={<MentorNav />}>
      {children}
    </DashboardShell>
  );
}
