import Link from 'next/link';
import { Button } from '@/components/ui/button';

/** The 404 page. */
export default function NotFound() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-muted-foreground text-sm font-medium tracking-widest uppercase">404</p>
      <h1 className="text-3xl font-semibold tracking-tight">This page does not exist</h1>
      <p className="text-muted-foreground max-w-md">
        The link may be out of date, or the page may have moved. Head back to Submittly to carry on.
      </p>
      <Button asChild className="mt-2">
        <Link href="/">Back to Submittly</Link>
      </Button>
    </main>
  );
}
