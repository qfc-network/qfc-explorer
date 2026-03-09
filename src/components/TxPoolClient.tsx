'use client';

import Link from 'next/link';
import { useState, useEffect, useCallback, useRef } from 'react';
import { useTranslation } from '@/components/LocaleProvider';
import { apiUrl } from '@/lib/client-api';
import { shortenHash, formatWeiToQfc } from '@/lib/format';
import Table from '@/components/Table';

type TxPoolTx = {
  hash: string;
  from: string;
  to: string | null;
  value: string;
  gasPrice: string;
  nonce: number;
  gas: string | null;
  input: string | null;
};

type GasPriceStats = {
  min: number;
  max: number;
  avg: number;
};

type TxPoolData = {
  pending: TxPoolTx[];
  queued: TxPoolTx[];
  totalPending: number;
  totalQueued: number;
  gasPriceStats: GasPriceStats;
  sort: string;
  order: string;
  limit: number;
};

type Props = {
  initialData: TxPoolData | null;
};

function hexToGwei(hex: string): number {
  if (!hex) return 0;
  const wei = parseInt(hex, 16) || 0;
  return Number((wei / 1e9).toFixed(4));
}

/** Return a color class based on gas price relative to the average. */
function gasPriceColor(hex: string, avg: number): string {
  if (avg === 0) return 'text-slate-600 dark:text-slate-300 dark:text-slate-300';
  const gwei = hexToGwei(hex);
  const ratio = gwei / (avg / 1e9);
  if (ratio <= 0.8) return 'text-emerald-400';
  if (ratio <= 1.3) return 'text-amber-400';
  return 'text-red-400';
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{sub}</p>}
    </div>
  );
}

function GasPriceDistribution({ stats }: { stats: GasPriceStats }) {
  const { t } = useTranslation();
  const minGwei = Number((stats.min / 1e9).toFixed(2));
  const maxGwei = Number((stats.max / 1e9).toFixed(2));
  const avgGwei = Number((stats.avg / 1e9).toFixed(2));

  if (maxGwei === 0) return null;

  // Position of average on the bar (0-100%)
  const range = maxGwei - minGwei;
  const avgPos = range > 0 ? ((avgGwei - minGwei) / range) * 100 : 50;

  return (
    <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-4">
      <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
        {t('txpool.gasPriceDistribution')}
      </p>
      <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-emerald-500 via-amber-400 to-red-500">
        {range > 0 && (
          <div
            className="absolute top-0 h-full w-0.5 bg-white"
            style={{ left: `${Math.min(Math.max(avgPos, 2), 98)}%` }}
            title={`Avg: ${avgGwei} Gwei`}
          />
        )}
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
        <span>{minGwei} Gwei</span>
        <span>{t('txpool.avg')}: {avgGwei} Gwei</span>
        <span>{maxGwei} Gwei</span>
      </div>
    </div>
  );
}

export default function TxPoolClient({ initialData }: Props) {
  const { t } = useTranslation();
  const [data, setData] = useState<TxPoolData | null>(initialData);
  const [tab, setTab] = useState<'pending' | 'queued'>('pending');
  const [sort, setSort] = useState<string>('gas_price');
  const [lastUpdated, setLastUpdated] = useState<number>(Date.now());
  const [secondsAgo, setSecondsAgo] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const url = apiUrl(`/api/txpool?sort=${sort}&order=desc&limit=200`);
      const res = await fetch(url);
      if (!res.ok) return;
      const json = await res.json();
      if (json.ok && json.data) {
        setData(json.data);
        setLastUpdated(Date.now());
      }
    } catch {
      // Silently fail — keep showing stale data
    }
  }, [sort]);

  // Auto-refresh every 5 seconds
  useEffect(() => {
    intervalRef.current = setInterval(fetchData, 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchData]);

  // Tick the "last updated" counter every second
  useEffect(() => {
    tickRef.current = setInterval(() => {
      setSecondsAgo(Math.floor((Date.now() - lastUpdated) / 1000));
    }, 1000);
    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [lastUpdated]);

  // Re-fetch when sort changes
  useEffect(() => {
    fetchData();
  }, [sort, fetchData]);

  const pending = data?.pending ?? [];
  const queued = data?.queued ?? [];
  const stats = data?.gasPriceStats ?? { min: 0, max: 0, avg: 0 };
  const currentTxs = tab === 'pending' ? pending : queued;

  return (
    <div className="flex flex-col gap-6">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard label={t('txpool.totalPending')} value={data?.totalPending ?? 0} />
        <StatCard label={t('txpool.totalQueued')} value={data?.totalQueued ?? 0} />
        <StatCard
          label={t('txpool.avgGasPrice')}
          value={`${(stats.avg / 1e9).toFixed(2)}`}
          sub="Gwei"
        />
        <StatCard
          label={t('txpool.maxGasPrice')}
          value={`${(stats.max / 1e9).toFixed(2)}`}
          sub="Gwei"
        />
      </div>

      {/* Gas price distribution bar */}
      <GasPriceDistribution stats={stats} />

      {/* Controls row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Tabs */}
        <div className="flex rounded-lg border border-slate-200 dark:border-slate-800 overflow-hidden">
          <button
            onClick={() => setTab('pending')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'pending'
                ? 'bg-cyan-500 text-slate-900 dark:text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t('txpool.tabPending')} ({data?.totalPending ?? 0})
          </button>
          <button
            onClick={() => setTab('queued')}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              tab === 'queued'
                ? 'bg-cyan-500 text-slate-900 dark:text-white'
                : 'bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800'
            }`}
          >
            {t('txpool.tabQueued')} ({data?.totalQueued ?? 0})
          </button>
        </div>

        <div className="flex items-center gap-4">
          {/* Sort select */}
          <label className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            {t('txpool.sortBy')}
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="rounded border border-slate-200 bg-white px-2 py-1 text-xs text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <option value="gas_price">{t('common.gasPrice')}</option>
              <option value="nonce">{t('common.nonce')}</option>
              <option value="value">{t('common.value')}</option>
            </select>
          </label>

          {/* Last updated indicator */}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {t('txpool.lastUpdated').replace('{seconds}', String(secondsAgo))}
          </span>
        </div>
      </div>

      {/* Transaction table */}
      {currentTxs.length === 0 ? (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-8 text-center">
          <p className="text-sm text-slate-500 dark:text-slate-400">{t('txpool.noPending')}</p>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{t('txpool.mempoolEmpty')}</p>
        </div>
      ) : (
        <Table
          rows={currentTxs}
          keyField="hash"
          columns={[
            {
              key: 'hash',
              header: t('common.hash'),
              render: (row: TxPoolTx) => (
                <Link href={`/txs/${row.hash}`} className="text-cyan-500 hover:underline">
                  {shortenHash(row.hash)}
                </Link>
              ),
            },
            {
              key: 'from',
              header: t('common.from'),
              render: (row: TxPoolTx) => (
                <Link href={`/address/${row.from}`} className="text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:underline">
                  {shortenHash(row.from)}
                </Link>
              ),
            },
            {
              key: 'to',
              header: t('common.to'),
              render: (row: TxPoolTx) =>
                row.to ? (
                  <Link href={`/address/${row.to}`} className="text-slate-600 dark:text-slate-300 dark:text-slate-300 hover:underline">
                    {shortenHash(row.to)}
                  </Link>
                ) : (
                  <span className="text-emerald-400 text-xs">{t('common.contractCreation')}</span>
                ),
            },
            {
              key: 'value',
              header: t('common.value'),
              render: (row: TxPoolTx) => (
                <span className="text-slate-600 dark:text-slate-300 dark:text-slate-300">
                  {formatWeiToQfc(row.value)} QFC
                </span>
              ),
            },
            {
              key: 'gasPrice',
              header: `${t('common.gasPrice')} (Gwei)`,
              render: (row: TxPoolTx) => (
                <span className={gasPriceColor(row.gasPrice, stats.avg)}>
                  {hexToGwei(row.gasPrice).toFixed(4)}
                </span>
              ),
            },
            {
              key: 'nonce',
              header: t('common.nonce'),
              render: (row: TxPoolTx) => (
                <span className="text-slate-400 dark:text-slate-400">{row.nonce}</span>
              ),
            },
          ]}
        />
      )}
    </div>
  );
}
