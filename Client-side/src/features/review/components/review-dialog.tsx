'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { ApiError } from '@/lib/api-client';
import type { ReviewSubmission, SubmissionStatus } from '@/types/api';
import { useUpdateStatus } from '../hooks/use-update-status';

interface ReviewDialogProps {
  submission: ReviewSubmission | null;
  status: Extract<SubmissionStatus, 'APPROVED' | 'REJECTED'>;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful review, so the caller can show a toast. */
  onReviewed?: (status: 'APPROVED' | 'REJECTED') => void;
}

const MAX_COMMENT_LENGTH = 1000;

/**
 * The approve / reject confirmation.
 *
 * The comment is optional — a plain review is allowed without one (see the
 * server's `updateStatusSchema`).
 */
export function ReviewDialog({ submission, status, onOpenChange, onReviewed }: ReviewDialogProps) {
  const [comment, setComment] = useState('');
  const update = useUpdateStatus();

  const isApprove = status === 'APPROVED';
  const isOpen = submission !== null;

  function handleOpenChange(open: boolean) {
    if (!open) {
      setComment('');
      update.reset();
    }
    onOpenChange(open);
  }

  function handleConfirm() {
    if (!submission) return;
    const trimmed = comment.trim();
    update.mutate(
      {
        id: submission.id,
        status,
        ...(trimmed === '' ? {} : { comment: trimmed }),
      },
      {
        onSuccess: () => {
          handleOpenChange(false);
          onReviewed?.(status);
        },
        onError: error => {
          // Another mentor may have reviewed the same submission first. The
          // server's 422 says so in its own words; the toast adds the context
          // and the list refetches behind it.
          if (error instanceof ApiError && error.code === 'INVALID_STATUS_TRANSITION') {
            toast.error('This submission has already been reviewed.');
            handleOpenChange(false);
          }
        },
      },
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isApprove ? 'Approve submission' : 'Reject submission'}</DialogTitle>
          <DialogDescription>
            {isApprove
              ? 'This will mark the project as approved. The student will see the new status.'
              : 'This will mark the project as rejected. The student will see the new status.'}
            {submission && (
              <span className="mt-1 block font-medium">
                {submission.projectName} — {submission.student.name}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <Field>
          <FieldLabel htmlFor="review-comment">Comment</FieldLabel>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={event => setComment(event.target.value)}
            rows={4}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder={
              isApprove ? 'What worked well?' : 'What needs to change before it can be approved?'
            }
          />
          <FieldDescription>
            Optional. {comment.length}/{MAX_COMMENT_LENGTH}
          </FieldDescription>
          {update.error && <FieldError errors={[{ message: update.error.message }]} />}
        </Field>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={update.isPending}
          >
            Cancel
          </Button>
          <Button
            variant={isApprove ? 'default' : 'destructive'}
            onClick={handleConfirm}
            disabled={update.isPending}
          >
            {update.isPending ? 'Saving…' : isApprove ? 'Approve project' : 'Reject project'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
