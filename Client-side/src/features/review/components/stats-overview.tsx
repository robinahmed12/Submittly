'use client';

import { Inbox } from 'lucide-react';
import { EmptyState } from '@/components/shared/empty-state';
import { ErrorState } from '@/components/shared/error-state';
import { useStats } from '../hooks/use-stats';
import { StatsCards } from './stats-cards';

/**
 * The mentor dashboard's statistics.
 *
 * A client component because the counts come from the API through TanStack
 * Query.
 */
export function StatsOverview() {
  const { data, isPending, isError, error, refetch, isRefetching } = useStats();

  if (isError) {
    return (
      <ErrorState
        title="Couldn't load the statistics"
        description={error instanceof Error ? error.message : undefined}
        onRetry={() => void refetch()}
        retrying={isRefetching}
      />
    );
  }

  const stats = data?.stats;

  return (
    <div className="space-y-6">
      <StatsCards stats={stats} isPending={isPending} />

      {!isPending && stats && stats.total === 0 && (
        <EmptyState
          icon={<Inbox className="size-8" aria-hidden="true" />}
          title="No submissions yet"
          description="Once students start submitting projects, the counts and the review queue will fill up here."
        />
      )}
    </div>
  );
}
