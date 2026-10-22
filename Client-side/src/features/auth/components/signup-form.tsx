'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useForm, useWatch } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { applyAuthError } from '../form-error';
import { useSignup } from '../hooks/use-signup';
import { signupSchema, type SignupInput } from '../schemas';

/**
 * Student registration.
 *
 * The server assigns the `STUDENT` role — roles are never client-suppliable.
 */
export function SignupForm() {
  const signup = useSignup();

  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { name: '', email: '', password: '' },
    mode: 'onBlur',
  });

  function onSubmit(values: SignupInput) {
    signup.reset();
    signup.mutate(values, {
      onError: error =>
        applyAuthError(error, form, {
          EMAIL_ALREADY_EXISTS: 'email',
        }),
    });
  }

  // `useWatch` rather than `form.watch()` — the latter returns a function the
  // React Compiler cannot memoise safely.
  const passwordLength = useWatch({ control: form.control, name: 'password' }).length;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            {...form.register('name')}
            id="name"
            autoComplete="name"
            placeholder="Amina Rai"
            aria-invalid={Boolean(form.formState.errors.name)}
          />
          {form.formState.errors.name && <FieldError errors={[form.formState.errors.name]} />}
        </Field>

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
            autoComplete="new-password"
            aria-invalid={Boolean(form.formState.errors.password)}
          />
          <FieldDescription>
            At least 8 characters, with one letter and one number.
            {passwordLength > 0 && <span className="ml-1 tabular-nums">{passwordLength}/72</span>}
          </FieldDescription>
          {form.formState.errors.password && (
            <FieldError errors={[form.formState.errors.password]} />
          )}
        </Field>

        <Button type="submit" disabled={signup.isPending} className="w-full">
          {signup.isPending ? 'Creating account…' : 'Create account'}
        </Button>
      </FieldGroup>

      <p className="text-muted-foreground mt-6 text-center text-sm">
        Already have an account?{' '}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          Sign in
        </Link>
      </p>
    </form>
  );
}
