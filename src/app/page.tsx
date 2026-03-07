export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList, ApiStats, ApiTransactionsList } from '@/lib/api-types';
import { formatNumber, formatTimestampMs } from '@/lib/format';
import StatChart from '@/components/StatChart';
import AutoRefresh from '@/components/AutoRefresh';
import SearchBar from '@/components/SearchBar';
import LatestBlocksAndTxs from '@/components/LatestBlocksAndTxs';

export default async function Home() {
  const [blocksResponse, transactionsResponse, statsResponse] = await Promise.all([
    fetchJsonSafe<ApiBlocksList>(
      '/api/blocks?limit=8&page=1',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiTransactionsList>(
      '/api/transactions?limit=8&page=1',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiStats>(
      '/api/stats',
      { next: { revalidate: 10 } }
    ),
  ]);
  const blocks = blocksResponse?.data.items ?? [];
  const transactions = transactionsResponse?.data.items ?? [];

  const latestHeight = statsResponse?.data.stats.latest_block ?? blocks[0]?.height ?? '0';
  const avgBlockTimeMs = statsResponse?.data.stats.avg_block_time_ms;
  const tps = statsResponse?.data.stats.tps;
  const activeAddresses = statsResponse?.data.stats.active_addresses;
  const series = statsResponse?.data.series;

  const fmtTps = tps == null ? '—' : Number(tps) < 0.01 ? Number(tps).toFixed(4) : Number(tps).toFixed(2);
  const fmtBlockTime = avgBlockTimeMs == null ? '—' : `${(Number(avgBlockTimeMs) / 1000).toFixed(1)}s`;

  return (
    <main className="mx-auto max-w-7xl px-4">
      <AutoRefresh intervalMs={12000} />

      {/* Hero section with search */}
      <section className="py-10 md:py-14">
        <h1 className="text-2xl font-semibold text-white sm:text-3xl">
          QFC Blockchain Explorer
        </h1>
        <p className="mt-2 text-sm text-slate-400">
          Search transactions, blocks, addresses, tokens, and AI inference tasks.
        </p>
        <div className="mt-5 max-w-2xl">
          <SearchBar prominent />
        </div>
      </section>

      {/* Network overview stats */}
      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard icon="block" label="Block Height" value={formatNumber(latestHeight)} />
        <StatCard icon="clock" label="Block Time" value={fmtBlockTime} />
        <StatCard icon="zap" label="TPS" value={fmtTps} />
        <StatCard icon="users" label="Addresses" value={activeAddresses == null ? '—' : formatNumber(activeAddresses)} />
        <StatCard icon="chain" label="Chain ID" value="9000" />
        <StatCard icon="shield" label="Finality" value="PoC" />
      </section>

      {/* Mini charts */}
      {series ? (
        <section className="mt-6 grid gap-4 lg:grid-cols-3">
          <StatChart title="Block Time (ms)" points={series.block_time_ms} suffix=" ms" />
          <StatChart title="Txs per Block" points={series.tps} />
          <StatChart title="Active Addresses" points={series.active_addresses} />
        </section>
      ) : null}

      {/* Latest Blocks + Latest Transactions (dual column) */}
      <section className="mt-8">
        <LatestBlocksAndTxs blocks={blocks} transactions={transactions} />
      </section>
    </main>
  );
}

/* ---- Inline helper component for stat cards ---- */

function StatCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/40 p-4">
      <div className="flex items-center gap-2">
        <StatIcon type={icon} />
        <p className="text-[11px] uppercase tracking-wider text-slate-500">{label}</p>
      </div>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}

function StatIcon({ type }: { type: string }) {
  const cls = "h-4 w-4 text-cyan-400/70";
  switch (type) {
    case 'block':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      );
    case 'clock':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      );
    case 'zap':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      );
    case 'chain':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
      );
    case 'shield':
      return (
        <svg className={cls} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      );
    default:
      return null;
  }
}
