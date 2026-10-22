import { redirect } from 'next/navigation';
import { AppShell } from '@/components/shared/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { roleHome } from '@/features/auth/roles';
import { getSession } from '@/lib/session-server';
import Link from 'next/link';

/**
 * Public landing page.
 *
 * A signed-in visitor is sent straight to their dashboard; a signed-out one
 * gets the marketing card. The session is read server-side, so the redirect
 * happens before the page is ever painted.
 */
export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect(roleHome(session.role));
  }

  return (
    <AppShell session={null}>
      <div className="mx-auto max-w-2xl space-y-8 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Submittly</h1>
          <p className="text-muted-foreground text-lg">
            Project submission and review dashboard for students and mentors.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Get started</CardTitle>
            <CardDescription>
              Students submit projects and track their review status. Mentors review submissions
              from a dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row">
            <Button asChild className="flex-1">
              <Link href="/signup">Create an account</Link>
            </Button>
            <Button asChild variant="outline" className="flex-1">
              <Link href="/login">Sign in</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}
