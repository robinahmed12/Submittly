'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { applyAuthError } from '../form-error';
import { useLogin } from '../hooks/use-login';
import { loginSchema, type LoginInput } from '../schemas';

interface LoginFormProps {
  /** A validated same-origin path to return to after signing in. */
  nextPath?: string | null;
}

/**
 * Sign-in form.
 *
 * Client validation is for usability only — the server re-validates
 * everything (Requirements §6).
 */
export function LoginForm({ nextPath }: LoginFormProps) {
  const login = useLogin(nextPath);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  function onSubmit(values: LoginInput) {
    login.reset();
    login.mutate(values, {
      onError: error => applyAuthError(error, form),
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.email)}>
          <FieldLabel htmlFor="email">Email</FieldLabel>
          <Input
            {...form.register('email')}
            id="email"
            type="email"
            autoComplete="email"
            placeholder="you@example.com"
            aria-invalid={Boolean(form.formState.errors.email)}
          />
          {form.formState.errors.email && <FieldError errors={[form.formState.errors.email]} />}
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.password)}>
          <FieldLabel htmlFor="password">Password</FieldLabel>
          <Input
            {...form.register('password')}
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(form.formState.errors.password)}
          />
          {form.formState.errors.password && (
            <FieldError errors={[form.formState.errors.password]} />
          )}
        </Field>

        <Button type="submit" disabled={login.isPending} className="w-full">
          {login.isPending ? 'Signing in…' : 'Sign in'}
        </Button>
      </FieldGroup>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        No account yet?{' '}
        <Link
          href={nextPath ? `/signup?next=${encodeURIComponent(nextPath)}` : '/signup'}
          className="text-foreground underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </form>
  );
}
