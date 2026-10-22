import { ExternalLink } from 'lucide-react';
import { StatusBadge } from '@/components/shared/status-badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { Submission } from '@/types/api';

interface SubmissionCardProps {
  submission: Submission;
}

/** A single submission: what was sent, and where it stands. */
export function SubmissionCard({ submission }: SubmissionCardProps) {
  const submittedAt = new Date(submission.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="text-base">{submission.projectName}</CardTitle>
            <CardDescription>
              Submitted {submittedAt}
              {submission.updatedAt !== submission.createdAt && ' · last updated since'}
            </CardDescription>
          </div>
          <StatusBadge status={submission.status} />
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <p className="text-sm whitespace-pre-line">{submission.description}</p>

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <dt className="text-muted-foreground text-xs font-medium uppercase">Repository</dt>
            <dd>
              <a
                href={submission.repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 underline underline-offset-4"
              >
                {submission.repoUrl}
                <ExternalLink className="size-3" aria-hidden="true" />
                <span className="sr-only">(opens in a new tab)</span>
              </a>
            </dd>
          </div>

          {submission.liveUrl && (
            <div className="space-y-1">
              <dt className="text-muted-foreground text-xs font-medium uppercase">Live link</dt>
              <dd>
                <a
                  href={submission.liveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 underline underline-offset-4"
                >
                  {submission.liveUrl}
                  <ExternalLink className="size-3" aria-hidden="true" />
                  <span className="sr-only">(opens in a new tab)</span>
                </a>
              </dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
