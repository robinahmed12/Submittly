import type { Metadata } from 'next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { SignupForm } from '@/features/auth/components/signup-form';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function SignupPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
        <CardDescription>Submit projects and track their review status.</CardDescription>
      </CardHeader>
      <CardContent>
        <SignupForm />
      </CardContent>
    </Card>
  );
}
