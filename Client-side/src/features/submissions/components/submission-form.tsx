'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm, useWatch } from 'react-hook-form';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import { useCreateSubmission } from '../hooks/use-create-submission';
import { useMySubmissions } from '../hooks/use-my-submissions';
import { normalizeRepoUrl } from '../repo-url';
import {
  createSubmissionSchema,
  type CreateSubmissionFormValues,
  type CreateSubmissionInput,
} from '../schemas';

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

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} noValidate>
      <FieldGroup>
        <Field data-invalid={Boolean(form.formState.errors.projectName)}>
          <FieldLabel htmlFor="projectName">Project name</FieldLabel>
          <Input
            {...form.register('projectName')}
            id="projectName"
            placeholder="Trip Recommender API"
            aria-invalid={Boolean(form.formState.errors.projectName)}
          />
          <FieldDescription>
            {projectName.length > 0 && (
              <span className="tabular-nums">{projectName.length}/120</span>
            )}
          </FieldDescription>
          {form.formState.errors.projectName && (
            <FieldError errors={[form.formState.errors.projectName]} />
          )}
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.repoUrl)}>
          <FieldLabel htmlFor="repoUrl">Repository URL</FieldLabel>
          <Input
            {...form.register('repoUrl')}
            id="repoUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://github.com/you/your-project"
            aria-invalid={Boolean(form.formState.errors.repoUrl)}
          />
          <FieldDescription>
            One repository URL per account — you can submit the same project only once.
          </FieldDescription>
          {isDuplicateRepoUrl && (
            <p className="text-sm text-amber-600 dark:text-amber-500">
              You have already submitted a project with this repository URL.
            </p>
          )}
          {form.formState.errors.repoUrl && <FieldError errors={[form.formState.errors.repoUrl]} />}
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.liveUrl)}>
          <FieldLabel htmlFor="liveUrl">Live link</FieldLabel>
          <Input
            {...form.register('liveUrl')}
            id="liveUrl"
            type="url"
            inputMode="url"
            autoComplete="off"
            placeholder="https://your-project.vercel.app"
            aria-invalid={Boolean(form.formState.errors.liveUrl)}
          />
          <FieldDescription>
            Optional. Leave blank if the project is not deployed yet.
          </FieldDescription>
          {form.formState.errors.liveUrl && <FieldError errors={[form.formState.errors.liveUrl]} />}
        </Field>

        <Field data-invalid={Boolean(form.formState.errors.description)}>
          <FieldLabel htmlFor="description">Description</FieldLabel>
          <Textarea
            {...form.register('description')}
            id="description"
            rows={6}
            placeholder="What does the project do? Which technologies does it use?"
            aria-invalid={Boolean(form.formState.errors.description)}
            className="min-h-32 resize-y"
          />
          <FieldDescription>
            At least 10 characters.
            {description.length > 0 && (
              <span className="ml-1 tabular-nums">{description.length}/4000</span>
            )}
          </FieldDescription>
          {form.formState.errors.description && (
            <FieldError errors={[form.formState.errors.description]} />
          )}
        </Field>

        <Button type="submit" disabled={create.isPending} className="w-full sm:w-auto">
          {create.isPending ? 'Submitting…' : 'Submit project'}
        </Button>
      </FieldGroup>
    </form>
  );
}
