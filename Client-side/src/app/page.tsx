import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Public landing page.
 *
 * Outlet 3 replaces this with a role-aware redirect: a signed-in visitor is
 * sent to their dashboard, a signed-out one sees the sign-in / sign-up links.
 * For now it states plainly what the app is and where the routes are going.
 */
export default function Home() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-2xl space-y-8">
        <div className="space-y-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">Submittly</h1>
          <p className="text-muted-foreground text-lg">
            Project submission and review dashboard for students and mentors.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Not wired up yet</CardTitle>
            <CardDescription>
              The scaffold is in place. The following routes arrive in the implementation outlets.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ul className="text-muted-foreground space-y-2 text-sm">
              <li>
                <span className="text-foreground font-medium">/login</span> — sign in (Outlet 3)
              </li>
              <li>
                <span className="text-foreground font-medium">/signup</span> — student registration
                (Outlet 3)
              </li>
              <li>
                <span className="text-foreground font-medium">/student/dashboard</span> — my
                submissions (Outlet 4)
              </li>
              <li>
                <span className="text-foreground font-medium">/mentor/dashboard</span> — review
                statistics (Outlet 5)
              </li>
              <li>
                <span className="text-foreground font-medium">/mentor/submissions</span> — review
                queue (Outlet 5)
              </li>
            </ul>

            <Button className="w-full" disabled>
              Sign in — available from Outlet 3
            </Button>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
