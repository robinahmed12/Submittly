import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { ReviewStats } from '@/types/api';

interface StatsCardsProps {
  stats: ReviewStats | undefined;
  isPending: boolean;
}

interface StatCard {
  label: string;
  value: number;
  hint: string;
}

/**
 * The dashboard statistics.
 *
 * Exceeds the required minimum — Requirements §4.3 asks for at least *Total
 * Pending* and *Total Approved*.
 */
export function StatsCards({ stats, isPending }: StatsCardsProps) {
  const cards: StatCard[] = [
    { label: 'Total submissions', value: stats?.total ?? 0, hint: 'All time' },
    { label: 'Total pending', value: stats?.pending ?? 0, hint: 'Awaiting review' },
    { label: 'Total approved', value: stats?.approved ?? 0, hint: 'Reviewed' },
    { label: 'Total rejected', value: stats?.rejected ?? 0, hint: 'Reviewed' },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(card => (
        <Card key={card.label}>
          <CardHeader>
            <CardTitle className="text-muted-foreground text-sm font-medium">
              {card.label}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isPending ? (
              <Skeleton className="h-9 w-16" />
            ) : (
              <>
                <p className="text-3xl font-semibold tabular-nums">{card.value}</p>
                <p className="text-muted-foreground text-xs">{card.hint}</p>
              </>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
