import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="space-y-4">
        <Skeleton className="h-4 w-28" />
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-72 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50" />
        ))}
      </div>
    </main>
  );
}
