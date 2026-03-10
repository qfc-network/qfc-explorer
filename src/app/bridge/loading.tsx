import Skeleton from '@/components/Skeleton';
import { SkeletonRow } from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="space-y-3">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-4 w-72" />
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
        <Skeleton className="h-24 rounded-2xl" />
      </section>

      <section>
        <Skeleton className="mb-3 h-6 w-48" />
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} cols={6} />
          ))}
        </div>
      </section>

      <section>
        <Skeleton className="mb-3 h-6 w-56" />
        <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20" />
          </div>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonRow key={i} cols={6} />
          ))}
        </div>
      </section>
    </main>
  );
}
