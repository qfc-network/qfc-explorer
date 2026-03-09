'use client';

import { useTranslation } from '@/components/LocaleProvider';

type ApiErrorStateProps = {
  onRetry: () => void;
  message?: string;
};

export default function ApiErrorState({ onRetry, message }: ApiErrorStateProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-slate-200 bg-white/80 px-6 py-10 text-center dark:border-slate-700/50 dark:bg-slate-800/60">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
        <svg
          className="h-5 w-5 text-amber-500"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
        {message ?? t('error.apiError')}
      </p>
      <p className="mb-5 text-xs text-slate-500 dark:text-slate-400">
        {t('error.message')}
      </p>
      <button
        onClick={onRetry}
        className="rounded-lg bg-cyan-500 px-4 py-1.5 text-sm font-medium text-slate-900 dark:text-white transition-colors hover:bg-cyan-600"
      >
        {t('error.retry')}
      </button>
    </div>
  );
}
