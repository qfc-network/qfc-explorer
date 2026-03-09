'use client';

import { useTranslation } from '@/components/LocaleProvider';

type LiveIndicatorProps = {
  connected: boolean;
};

export default function LiveIndicator({ connected }: LiveIndicatorProps) {
  const { t } = useTranslation();

  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          connected
            ? 'bg-emerald-400 animate-pulse'
            : 'bg-slate-500'
        }`}
      />
      <span className={`text-xs font-medium ${connected ? 'text-emerald-400' : 'text-slate-500'}`}>
        {connected ? t('live.connected') : t('live.disconnected')}
      </span>
    </span>
  );
}
