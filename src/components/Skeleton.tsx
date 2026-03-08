export default function Skeleton({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
      className={`animate-pulse rounded-xl bg-slate-200 dark:bg-slate-700 ${className ?? ''}`.trim()}
    />
  );
}

export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <div role="status" aria-live="polite" aria-busy="true" aria-label="Loading" className="flex items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-800">
      {Array.from({ length: cols }).map((_, i) => (
        <div
          key={i}
          className="h-4 flex-1 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading"
      className={`animate-pulse rounded-2xl border border-slate-200 bg-slate-100 p-5 dark:border-slate-800 dark:bg-slate-900/60 ${className ?? ''}`.trim()}
    >
      <div className="h-3 w-24 rounded bg-slate-200 dark:bg-slate-700" />
      <div className="mt-3 h-6 w-32 rounded bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function SkeletonText({ width = 'w-full' }: { width?: string }) {
  return (
    <div
      className={`h-4 animate-pulse rounded bg-slate-200 dark:bg-slate-700 ${width}`}
    />
  );
}
