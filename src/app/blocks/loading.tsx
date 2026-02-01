import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-72" />
    </main>
  );
}
