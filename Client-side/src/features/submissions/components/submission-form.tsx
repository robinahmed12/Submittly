'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { AlertTriangle, Check, Link2, Rocket } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { useCreateSubmission } from '../hooks/use-create-submission';
import { useMySubmissions } from '../hooks/use-my-submissions';
import { normalizeRepoUrl } from '../repo-url';
import {
  createSubmissionSchema,
  type CreateSubmissionFormValues,
  type CreateSubmissionInput,
} from '../schemas';

const NEXT_STEPS = [
  { title: 'You submit', text: 'Share the repository and a short description.' },
  { title: 'A reviewer looks', text: 'Your project is read and marked.' },
  { title: 'You get notified', text: 'The result appears on your dashboard.' },
];

/** Character counter that turns red as the limit gets close. */
function Counter({ value, max }: { value: number; max: number }) {
  if (value === 0) return null;
  return (
    <span
      className={cn(
        'text-muted-foreground ml-auto shrink-0 text-xs tabular-nums',
        value > max * 0.9 && 'text-brand-500 dark:text-brand-300 font-semibold',
      )}
    >
      {value}/{max}
    </span>
  );
}

/** Small visual wrapper so every field has the same left accent on focus. */
const fieldInputClass =
  'h-11 bg-card transition-shadow focus-visible:ring-2 focus-visible:ring-ring/40';

/**
 * The new-submission form.
 *
 * Client validation is for usability only — the server re-validates
 * everything (Requirements §6).
 */
export function SubmissionForm() {
  const router = useRouter();
  const create = useCreateSubmission();
  const { data: existing } = useMySubmissions();

  // The schema transforms a blank `liveUrl` to `undefined`, so the form's
  // values and the payload it produces are different types.
  const form = useForm<CreateSubmissionFormValues, unknown, CreateSubmissionInput>({
    resolver: zodResolver(createSubmissionSchema),
    defaultValues: { projectName: '', repoUrl: '', liveUrl: '', description: '' },
    mode: 'onBlur',
  });

  const errors = form.formState.errors;
  const projectName = useWatch({ control: form.control, name: 'projectName' });
  const repoUrl = useWatch({ control: form.control, name: 'repoUrl' });
  const description = useWatch({ control: form.control, name: 'description' });

  /**
   * The documented duplicate rule (Requirements §4.2): one repository URL per
   * student. The server enforces it with a unique constraint; this is only an
   * early warning, so it never blocks the submit.
   */
  const isDuplicateRepoUrl = Boolean(
    repoUrl &&
    existing?.items.some(item => normalizeRepoUrl(item.repoUrl) === normalizeRepoUrl(repoUrl)),
  );

  function onSubmit(values: CreateSubmissionInput) {
    create.reset();
    create.mutate(values, {
      onSuccess: () => {
        toast.success("Submission received. You'll be notified when it's reviewed.");
        router.push('/student/dashboard');
      },
      onError: error => {
        if (error instanceof ApiError) {
          // The API's details[] map onto fields by path.
          if (error.details && error.details.length > 0) {
            for (const detail of error.details) {
              form.setError(detail.path as keyof CreateSubmissionFormValues, {
                message: detail.message,
              });
            }
            return;
          }
          // A duplicate repository URL belongs to the repoUrl field.
          if (error.code === 'DUPLICATE_SUBMISSION') {
            form.setError('repoUrl', { message: error.message });
            return;
          }
        }
        toast.error(getErrorMessage(error));
      },
    });
  }

  const descriptionLongEnough = description.trim().length >= 10;

  return (
    <div className="border-border bg-card mx-auto grid w-full max-w-5xl overflow-hidden rounded-3xl border shadow-sm lg:grid-cols-[2fr_3fr]">
      {/* Intro panel — the one bold moment: black with a red edge */}
      <aside className="bg-brand-900 relative p-8 text-white sm:p-10">
        <div
          aria-hidden
          className="from-brand-300 via-brand-500 to-brand-700 absolute inset-x-0 top-0 h-1.5 bg-linear-to-r lg:inset-y-0 lg:right-auto lg:h-auto lg:w-1.5 lg:bg-linear-to-b"
        />
        <div className="bg-brand-500 flex size-11 items-center justify-center rounded-xl text-white">
          <Rocket className="size-5" aria-hidden />
        </div>
        <h1 className="font-heading mt-6 text-3xl font-bold tracking-tight sm:text-4xl">
          Submit your project
        </h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-zinc-400">
          Tell us where the code lives and what it does. Each repository can be submitted once.
        </p>

        <ol className="mt-10 hidden space-y-6 lg:block">
          {NEXT_STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-4">
              <span className="border-brand-500 text-brand-200 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold">
                {index + 1}
              </span>
              <div>
                <p className="text-sm font-semibold">{step.title}</p>
                <p className="mt-0.5 text-sm text-zinc-400">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </aside>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="p-6 sm:p-10">
        <FieldGroup className="gap-7">
          <Field data-invalid={Boolean(errors.projectName)}>
            <FieldLabel htmlFor="projectName" className="font-semibold">
              Project name
            </FieldLabel>
            <Input
              {...form.register('projectName')}
              id="projectName"
              placeholder="Trip Recommender API"
              aria-invalid={Boolean(errors.projectName)}
              className={fieldInputClass}
            />
            <div className="flex min-h-5 items-start gap-2">
              {errors.projectName ? (
                <FieldError errors={[errors.projectName]} />
              ) : (
                <FieldDescription>A short, recognisable title.</FieldDescription>
              )}
              <Counter value={projectName.length} max={120} />
            </div>
          </Field>

          <Field data-invalid={Boolean(errors.repoUrl)}>
            <FieldLabel htmlFor="repoUrl" className="font-semibold">
              Repository URL
            </FieldLabel>
            <Input
              {...form.register('repoUrl')}
              id="repoUrl"
              type="url"
              inputMode="url"
              autoComplete="off"
              placeholder="https://github.com/you/your-project"
              aria-invalid={Boolean(errors.repoUrl)}
              className={fieldInputClass}
            />
            {errors.repoUrl ? (
              <FieldError errors={[errors.repoUrl]} />
            ) : (
              <FieldDescription>
                One repository URL per account — you can submit the same project only once.
              </FieldDescription>
            )}
            {isDuplicateRepoUrl && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-lg border border-amber-500/40 bg-amber-500/10 px-3.5 py-3 text-sm text-amber-800 dark:text-amber-400"
              >
                <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
                <p>You have already submitted a project with this repository URL.</p>
              </div>
            )}
          </Field>

          <Field data-invalid={Boolean(errors.liveUrl)}>
            <div className="flex items-baseline justify-between gap-2">
              <FieldLabel htmlFor="liveUrl" className="font-semibold">
                Live link
              </FieldLabel>
              <span className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs font-medium">
                Optional
              </span>
            </div>
            <div className="relative">
              <Link2
                aria-hidden
                className="text-muted-foreground pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2"
              />
              <Input
                {...form.register('liveUrl')}
                id="liveUrl"
                type="url"
                inputMode="url"
                autoComplete="off"
                placeholder="https://your-project.vercel.app"
                aria-invalid={Boolean(errors.liveUrl)}
                className={cn(fieldInputClass, 'pl-9')}
              />
            </div>
            {errors.liveUrl ? (
              <FieldError errors={[errors.liveUrl]} />
            ) : (
              <FieldDescription>Leave blank if the project is not deployed yet.</FieldDescription>
            )}
          </Field>

          <Field data-invalid={Boolean(errors.description)}>
            <FieldLabel htmlFor="description" className="font-semibold">
              Description
            </FieldLabel>
            <Textarea
              {...form.register('description')}
              id="description"
              rows={6}
              placeholder="What does the project do? Which technologies does it use?"
              aria-invalid={Boolean(errors.description)}
              className="bg-card focus-visible:ring-ring/40 min-h-36 resize-y transition-shadow focus-visible:ring-2"
            />
            <div className="flex min-h-5 items-start gap-2">
              {errors.description ? (
                <FieldError errors={[errors.description]} />
              ) : (
                <FieldDescription
                  className={cn(
                    'flex items-center gap-1',
                    descriptionLongEnough && 'text-foreground',
                  )}
                >
                  {descriptionLongEnough && (
                    <Check className="text-brand-500 dark:text-brand-300 size-3.5" aria-hidden />
                  )}
                  At least 10 characters.
                </FieldDescription>
              )}
              <Counter value={description.length} max={4000} />
            </div>
          </Field>

          <div className="border-border flex flex-col-reverse items-stretch gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-muted-foreground text-xs">
              You&apos;ll be notified when it&apos;s reviewed.
            </p>
            <Button
              type="submit"
              size="lg"
              disabled={create.isPending}
              className="h-11 w-full px-8 font-semibold sm:w-auto"
            >
              {create.isPending ? 'Submitting…' : 'Submit project'}
            </Button>
          </div>
        </FieldGroup>
      </form>
    </div>
  );
}
