import { LoadingSkeleton } from '@/components/shared/loading-skeleton';

/** Shown while the student routes load. */
export default function StudentLoading() {
  return <LoadingSkeleton count={2} />;
}
