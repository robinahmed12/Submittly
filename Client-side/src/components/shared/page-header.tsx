import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  /** An action rendered on the right — usually a button or a link. */
  action?: ReactNode;
}

/** The heading block at the top of a page. */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground text-sm">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
