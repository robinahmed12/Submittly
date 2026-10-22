import type { Metadata } from 'next';
import { ThemeToggleButton } from '@/components/shared/theme-toggle';
import { SignupForm } from '@/features/auth/components/signup-form';
import { PromoSlides } from '@/features/auth/components/promo-slides';

export const metadata: Metadata = {
  title: 'Create account',
};

export default function SignupPage() {
  return (
    <main className="grid min-h-svh lg:grid-cols-2">
      {/* Left: the form, full height */}
      <div className="relative flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16 xl:px-24">
        <div className="absolute top-4 right-4 sm:top-6 sm:right-6">
          <ThemeToggleButton />
        </div>

        <div className="mx-auto w-full max-w-sm">
          {/* Brand mark shows here only when the promo panel is hidden */}
          <p className="text-brand-500 mb-10 text-xl font-bold tracking-tight lg:hidden">
            Submittly
          </p>

          <h1 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">
            Create your account
          </h1>
          <p className="text-muted-foreground mt-2 mb-8">
            Submit projects and track their review status.
          </p>

          <SignupForm />
        </div>
      </div>

      {/* Right: promotion slides */}
      <PromoSlides />
    </main>
  );
}
