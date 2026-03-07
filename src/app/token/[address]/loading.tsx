import Skeleton from '@/components/Skeleton';

export default function TokenLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="mt-2 h-5 w-96" />
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-xl" />
        ))}
      </div>
      <Skeleton className="mt-8 h-10 w-64" />
      <Skeleton className="mt-4 h-64 rounded-xl" />
    </main>
  );
}
