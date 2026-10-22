'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { applyAuthError } from '../form-error';
import { useLogin } from '../hooks/use-login';
import { DEMO_ACCOUNTS, type DemoAccount } from '../demo-accounts';
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

  /** Which demo button is mid-flight, so only it shows the loading label. */
  const [pendingDemo, setPendingDemo] = useState<string | null>(null);

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
    mode: 'onBlur',
  });

  function onSubmit(values: LoginInput) {
    login.reset();
    setPendingDemo(null);
    login.mutate(values, {
      onError: error => applyAuthError(error, form),
    });
  }

  /** One-click sign-in: fill the visible form so the state is transparent, then submit. */
  function onDemoLogin(account: DemoAccount) {
    form.setValue('email', account.email);
    form.setValue('password', account.password);
    setPendingDemo(account.label);
    login.reset();
    login.mutate(account, {
      onError: error => {
        setPendingDemo(null);
        applyAuthError(error, form);
      },
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

      <div className="mt-8">
        <div className="flex items-center gap-3" aria-hidden="true">
          <div className="bg-border h-px flex-1" />
          <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
            or explore with a demo
          </span>
          <div className="bg-border h-px flex-1" />
        </div>

        <div className="mt-4 grid gap-3">
          {DEMO_ACCOUNTS.map(account => (
            <Button
              key={account.label}
              type="button"
              variant="outline"
              disabled={login.isPending}
              onClick={() => onDemoLogin(account)}
            >
              <account.icon aria-hidden="true" />
              {pendingDemo === account.label ? 'Signing in…' : account.label}
            </Button>
          ))}
        </div>
      </div>

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
