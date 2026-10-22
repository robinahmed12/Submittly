import { AppShell } from '@/components/shared/app-shell';
import { getSession } from '@/lib/session-server';

export default async function StudentLayout({ children }: LayoutProps<'/student'>) {
  const session = await getSession();

  return <AppShell session={session}>{children}</AppShell>;
}
