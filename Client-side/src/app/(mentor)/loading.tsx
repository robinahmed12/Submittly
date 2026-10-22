import { LoadingSkeleton } from '@/components/shared/loading-skeleton';

/** Shown while the mentor routes load. */
export default function MentorLoading() {
  return <LoadingSkeleton count={4} />;
}
