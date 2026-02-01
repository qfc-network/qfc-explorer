import Skeleton from '@/components/Skeleton';

export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </main>
  );
}
