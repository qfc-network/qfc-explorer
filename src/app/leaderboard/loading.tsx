import Skeleton from '@/components/Skeleton';

export default function LeaderboardLoading() {
  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <Skeleton className="h-7 w-40" />
      <Skeleton className="mt-1 h-5 w-72" />
      <Skeleton className="mt-6 h-10 w-96" />
      <Skeleton className="mt-4 h-96 rounded-xl" />
    </main>
  );
}
