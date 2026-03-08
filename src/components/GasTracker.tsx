'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslation } from '@/components/LocaleProvider';
import type { ApiGasOracle } from '@/lib/api-types';

type GasData = ApiGasOracle['data'];

export default function GasTracker() {
  const { t } = useTranslation();
  const [data, setData] = useState<GasData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let active = true;

    async function fetchGas() {
      try {
        const res = await fetch('/api/gas-oracle');
        if (!res.ok) throw new Error('fetch failed');
        const json = await res.json() as ApiGasOracle;
        if (active && json.ok) {
          setData(json.data);
          setError(false);
        }
      } catch {
        if (active) setError(true);
      }
    }

    fetchGas();
    const interval = setInterval(fetchGas, 12_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  if (error || !data) {
    return null; // Don't render anything on the homepage if no data
  }

  const allZero = data.slow.gwei === '0' && data.standard.gwei === '0' && data.fast.gwei === '0';
  if (allZero) return null;

  return (
    <section className="mt-6">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="h-4 w-4 text-cyan-400/70" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
          </svg>
          <h2 className="text-sm font-semibold text-slate-300">{t('gas.oracle')}</h2>
          <span className="text-[10px] text-slate-500">{t('gas.autoRefresh')}</span>
        </div>
        <Link
          href="/gas-tracker"
          className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors"
        >
          {t('gas.viewDetails')} &rarr;
        </Link>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {/* Slow */}
        <div className="rounded-xl border border-green-500/20 bg-green-500/5 p-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-green-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-green-400/70">
              {t('gas.slow')}
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-green-400">{data.slow.gwei}</p>
          <p className="text-[11px] text-slate-500">
            {t('gas.gwei')} &middot; ~{data.slow.wait_sec}s
          </p>
        </div>

        {/* Standard */}
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-blue-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-blue-400/70">
              {t('gas.standard')}
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-blue-400">{data.standard.gwei}</p>
          <p className="text-[11px] text-slate-500">
            {t('gas.gwei')} &middot; ~{data.standard.wait_sec}s
          </p>
        </div>

        {/* Fast */}
        <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-orange-400" />
            <p className="text-xs font-medium uppercase tracking-wider text-orange-400/70">
              {t('gas.fast')}
            </p>
          </div>
          <p className="mt-2 text-2xl font-semibold text-orange-400">{data.fast.gwei}</p>
          <p className="text-[11px] text-slate-500">
            {t('gas.gwei')} &middot; ~{data.fast.wait_sec}s
          </p>
        </div>
      </div>
    </section>
  );
}
