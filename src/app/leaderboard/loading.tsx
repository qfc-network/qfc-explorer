import Skeleton from '@/components/Skeleton';
import { SkeletonRow } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-56" />
      </div>

      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-28" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-20" />
        </div>
        {Array.from({ length: 10 }).map((_, i) => (
          <SkeletonRow key={i} cols={5} />
        ))}
      </div>
    </main>
  );
}
