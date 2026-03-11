export default function Loading() {
  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="h-8 w-64 animate-pulse rounded bg-slate-200 dark:bg-slate-800" />
      <div className="grid gap-4 sm:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
    </main>
  );
}
