import { AppShell } from '@/components/shared/app-shell';
import { getSession } from '@/lib/session-server';

export default async function MentorLayout({ children }: LayoutProps<'/mentor'>) {
  const session = await getSession();

  return <AppShell session={session}>{children}</AppShell>;
}
