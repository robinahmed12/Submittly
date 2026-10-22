import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LoginForm } from '@/features/auth/components/login-form';
import { safeNextPath } from '@/features/auth/roles';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function LoginPage({ searchParams }: PageProps<'/login'>) {
  const params = await searchParams;
  const nextPath = safeNextPath(typeof params.next === 'string' ? params.next : undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>Welcome back. Sign in to continue.</CardDescription>
      </CardHeader>
      <CardContent>
        <LoginForm nextPath={nextPath} />
      </CardContent>
    </Card>
  );
}
