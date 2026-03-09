'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-6xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
        <svg
          className="h-8 w-8 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
          />
        </svg>
      </div>
      <div className="space-y-3">
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {t('error.title')}
        </h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t('error.message')}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-cyan-500 px-6 py-2 text-sm font-medium text-slate-900 dark:text-white transition-colors hover:bg-cyan-600"
        >
          {t('error.retry')}
        </button>
        <Link
          href="/"
          className="rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
        >
          {t('error.goHome')}
        </Link>
      </div>
    </main>
  );
}
