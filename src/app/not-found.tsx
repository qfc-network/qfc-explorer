'use client';

import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';

export default function NotFound() {
  const { t } = useTranslation();

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-6 px-6 py-12 text-center">
      <div className="space-y-4">
        <p className="text-6xl font-bold text-slate-300 dark:text-slate-700">404</p>
        <h1 className="text-2xl font-semibold text-slate-900 dark:text-white">
          {t('notFound.title')}
        </h1>
        <p className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          {t('notFound.description')}
        </p>
      </div>
      <Link
        href="/"
        className="rounded-full border border-slate-300 px-6 py-2 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
      >
        {t('common.backToHome')}
      </Link>
    </main>
  );
}
