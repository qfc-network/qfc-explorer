import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-56" />
      </div>

      <div className="space-y-4">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-56" />
      </div>
    </main>
  );
}
