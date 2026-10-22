import type { FieldValues, Path, UseFormReturn } from 'react-hook-form';
import { toast } from 'sonner';
import { ApiError, getErrorMessage } from '@/lib/api-client';
import type { ApiErrorCode } from '@/types/api';

/**
 * Maps a failed auth request onto the form.
 *
 * - `details[]` from the API maps onto fields by `path`.
 * - A code listed in `fieldFor` maps onto that field.
 * - Everything else becomes a toast.
 *
 * The form is never cleared on failure — the user's input is the most
 * expensive thing on the screen.
 */
export function applyAuthError<T extends FieldValues>(
  error: unknown,
  form: UseFormReturn<T>,
  fieldFor: Partial<Record<ApiErrorCode, Path<T>>> = {},
): void {
  if (!(error instanceof ApiError)) {
    toast.error(getErrorMessage(error));
    return;
  }

  if (error.details && error.details.length > 0) {
    for (const detail of error.details) {
      form.setError(detail.path as Path<T>, { message: detail.message });
    }
    return;
  }

  const field = error.code ? fieldFor[error.code] : undefined;
  if (field) {
    form.setError(field, { message: error.message });
    return;
  }

  toast.error(getErrorMessage(error));
}
