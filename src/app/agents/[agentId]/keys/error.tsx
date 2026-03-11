'use client';

export default function Error({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-4 px-6 py-12 text-center">
      <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
        Failed to load session keys
      </h2>
      <p className="text-sm text-slate-500 dark:text-slate-400">
        Session key data could not be loaded. The API may be unavailable.
      </p>
      <button
        onClick={reset}
        className="mt-4 rounded-full border border-slate-300 dark:border-slate-700 px-6 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 transition-colors hover:bg-slate-100 dark:hover:bg-slate-800"
      >
        Retry
      </button>
    </main>
  );
}
