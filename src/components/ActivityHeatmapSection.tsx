'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { useTranslation } from '@/components/LocaleProvider';

const ActivityHeatmap = dynamic(() => import('@/components/ActivityHeatmap'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center py-8 text-sm text-slate-400">
      Loading...
    </div>
  ),
});

export default function ActivityHeatmapSection({ address }: { address: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);

  return (
    <div className="mt-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/40 px-4 py-2.5 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800/60"
      >
        <svg
          className={`h-4 w-4 transition-transform ${open ? 'rotate-90' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {open ? t('activity.hideHeatmap') : t('activity.showHeatmap')}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-slate-800 bg-slate-900/40 p-4">
          <h3 className="mb-3 text-sm font-semibold text-white">{t('activity.title')}</h3>
          <ActivityHeatmap address={address} />
        </div>
      )}
    </div>
  );
}
