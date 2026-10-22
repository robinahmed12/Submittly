import { redirect } from 'next/navigation';
import { roleHome } from '@/features/auth/roles';
import { getSession } from '@/lib/session-server';

/**
 * The entry point.
 *
 * There is no landing page: a signed-out visitor goes straight to the sign-in
 * page, and a signed-in one straight to their dashboard. The session is read
 * server-side, so the redirect happens before anything is painted.
 */
export default async function Home() {
  const session = await getSession();

  redirect(session ? roleHome(session.role) : '/login');
}
