import { DashboardShell } from '@/components/shared/dashboard-shell';
import { StudentNav } from '@/features/submissions/components/student-nav';
import { getSession } from '@/lib/session-server';
import { redirect } from 'next/navigation';

export default async function StudentLayout({ children }: LayoutProps<'/student'>) {
  const session = await getSession();

  // The proxy already gates this path by role; this is a second line of
  // defence for the layout itself.
  if (!session || session.role !== 'STUDENT') {
    redirect('/login');
  }

  return (
    <DashboardShell session={session} sidebar={<StudentNav />}>
      {children}
    </DashboardShell>
  );
}
