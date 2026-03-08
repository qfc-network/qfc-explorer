import Skeleton from '@/components/Skeleton';
import { SkeletonCard, SkeletonRow } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        {Array.from({ length: 8 }).map((_, i) => (
          <SkeletonRow key={i} cols={5} />
        ))}
      </div>
    </main>
  );
}
