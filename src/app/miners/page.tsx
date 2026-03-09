export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiMinersList, ApiRegisteredMiner } from '@/lib/api-types';
import { formatNumber, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TranslatedText from '@/components/TranslatedText';

export const metadata: Metadata = {
  title: 'Inference Miners',
  description: 'Registered inference miners on the QFC network.',
  openGraph: {
    title: 'Inference Miners | QFC Explorer',
    description: 'Registered inference miners on the QFC network.',
    type: 'website',
  },
};

const PAGE_SIZE = 25;

/** Tier display label */
function tierLabel(tier: number): string {
  switch (tier) {
    case 3: return 'T3';
    case 2: return 'T2';
    case 1: return 'T1';
    default: return `T${tier}`;
  }
}

/** Tier badge CSS classes */
function tierClasses(tier: number): string {
  switch (tier) {
    case 3: return 'bg-emerald-500/20 text-emerald-400';
    case 2: return 'bg-amber-500/20 text-amber-400';
    case 1: return 'bg-slate-500/20 text-slate-400';
    default: return 'bg-slate-500/20 text-slate-400';
  }
}

/** Backend badge CSS classes */
function backendClasses(backend: string): string {
  const b = backend.toUpperCase();
  if (b.includes('CUDA')) return 'bg-green-500/20 text-green-400';
  if (b.includes('METAL')) return 'bg-blue-500/20 text-blue-400';
  if (b.includes('ROCM')) return 'bg-red-500/20 text-red-400';
  return 'bg-slate-500/20 text-slate-400'; // CPU or unknown
}

/** Format VRAM in GB */
function formatVram(mb: number): string {
  if (mb >= 1024) {
    const gb = mb / 1024;
    return `${gb % 1 === 0 ? gb.toFixed(0) : gb.toFixed(1)} GB`;
  }
  return `${mb} MB`;
}

export default async function MinersPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  const response = await fetchJsonSafe<ApiMinersList>(
    `/api/miners?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 30 } }
  );

  const miners = response?.data.items ?? [];
  const totalMiners = response?.data.total ?? 0;

  // Compute tier breakdown
  const tierCounts: Record<number, number> = {};
  const backendCounts: Record<string, number> = {};
  for (const m of miners) {
    tierCounts[m.tier] = (tierCounts[m.tier] ?? 0) + 1;
    backendCounts[m.backend] = (backendCounts[m.backend] ?? 0) + 1;
  }
  const tierBreakdown = [3, 2, 1]
    .filter((t) => tierCounts[t])
    .map((t) => `T${t}: ${tierCounts[t]}`)
    .join(' / ') || '--';

  // Top backend
  let topBackend = '--';
  let topBackendCount = 0;
  for (const [backend, count] of Object.entries(backendCounts)) {
    if (count > topBackendCount) {
      topBackend = backend;
      topBackendCount = count;
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <SectionHeader
        title={<TranslatedText tKey="miners.title" />}
        description={<TranslatedText tKey="miners.description" />}
      />

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label={<TranslatedText tKey="miners.totalMiners" />}
          value={formatNumber(totalMiners)}
        />
        <StatsCard
          label={<TranslatedText tKey="miners.byTier" />}
          value={tierBreakdown}
        />
        <StatsCard
          label={<TranslatedText tKey="miners.topBackend" />}
          value={topBackend}
          sub={topBackendCount > 0 ? `${topBackendCount} miners` : undefined}
        />
      </section>

      {/* Miners table */}
      <Table<ApiRegisteredMiner>
        rows={miners}
        keyField="address"
        emptyMessage="No miners registered yet."
        columns={[
          {
            key: 'rank',
            header: '#',
            render: (_row, index) => (
              <span className="text-slate-500">{(page - 1) * PAGE_SIZE + (index ?? 0) + 1}</span>
            ),
          },
          {
            key: 'address',
            header: 'Address',
            render: (row) => (
              <Link
                href={`/miner/${row.address}`}
                className="font-mono text-sm text-slate-800 dark:text-slate-200 hover:text-cyan-400 transition-colors"
              >
                {shortenHash(row.address)}
              </Link>
            ),
          },
          {
            key: 'gpuModel',
            header: 'GPU Model',
            render: (row) => (
              <span className="text-slate-600 dark:text-slate-300 text-sm">
                {row.gpuModel || '--'}
              </span>
            ),
          },
          {
            key: 'tier',
            header: 'Tier',
            render: (row) => (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${tierClasses(row.tier)}`}
              >
                {tierLabel(row.tier)}
              </span>
            ),
          },
          {
            key: 'vramMb',
            header: 'VRAM',
            render: (row) => (
              <span className="font-mono text-slate-600 dark:text-slate-300 text-sm">
                {formatVram(row.vramMb)}
              </span>
            ),
          },
          {
            key: 'backend',
            header: 'Backend',
            render: (row) => (
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${backendClasses(row.backend)}`}
              >
                {row.backend}
              </span>
            ),
          },
          {
            key: 'contributionScore',
            header: 'Score',
            render: (row) => (
              <span className="font-mono text-slate-600 dark:text-slate-300 text-sm">
                {row.contributionScore}
              </span>
            ),
          },
        ]}
      />

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/miners?page=${Math.max(1, page - 1)}`}
          className={`rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 transition-colors hover:text-slate-900 dark:hover:text-white ${
            page <= 1 ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <TranslatedText tKey="common.previous" />
        </Link>
        <span>
          <TranslatedText tKey="common.page" /> {page}
        </span>
        <Link
          href={`/miners?page=${page + 1}`}
          className={`rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 transition-colors hover:text-slate-900 dark:hover:text-white ${
            miners.length < PAGE_SIZE ? 'pointer-events-none opacity-40' : ''
          }`}
        >
          <TranslatedText tKey="common.next" />
        </Link>
      </div>
    </main>
  );
}
