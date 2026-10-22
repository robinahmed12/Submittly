'use client';

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

  return <StatsCards stats={data?.stats} isPending={isPending} />;
}
