export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Analytics',
  description: 'QFC blockchain analytics and charts.',
  openGraph: {
    title: 'Analytics | QFC Explorer',
    description: 'QFC blockchain analytics and charts.',
    type: 'website',
  },
};

import Link from 'next/link';
import dynamic_import from 'next/dynamic';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiNetwork, ApiStats } from '@/lib/api-types';
import { formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import ValidatorTable from '@/components/ValidatorTable';
import ExportButton from '@/components/ExportButton';
import AutoRefresh from '@/components/AutoRefresh';
import TranslatedText from '@/components/TranslatedText';

const AnalyticsChart = dynamic_import(
  () => import('@/components/AnalyticsChart'),
  {
    ssr: false,
    loading: () => (
      <div className="h-[300px] animate-pulse rounded-lg bg-slate-100 dark:bg-slate-800/50" />
    ),
  }
);

const DailyCharts = dynamic_import(
  () => import('@/components/DailyCharts'),
  {
    ssr: false,
    loading: () => (
      <div className="grid gap-6 lg:grid-cols-2">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-64 animate-pulse rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50" />
        ))}
      </div>
    ),
  }
);

type AnalyticsData = {
  ok: boolean;
  data: {
    overview: {
      total_blocks: string;
      total_transactions: string;
      total_addresses: string;
      total_gas_used: string;
    };
    series: {
      tps: Array<{ label: string; value: number; timestamp: number }>;
      gas_used: Array<{ label: string; value: number; timestamp: number }>;
      block_time: Array<{ label: string; value: number; timestamp: number }>;
      tx_count: Array<{ label: string; value: number; timestamp: number }>;
    };
    validators: Array<{
      address: string;
      blocks_produced: number;
      contribution_score: string;
      uptime: string;
    }>;
  };
};

export default async function AnalyticsPage() {
  const [analyticsResponse, networkResponse, statsResponse] = await Promise.all([
    fetchJsonSafe<AnalyticsData>(
      '/api/analytics',
      { next: { revalidate: 30 } }
    ),
    fetchJsonSafe<ApiNetwork>(
      '/api/network',
      { next: { revalidate: 30 } }
    ),
    fetchJsonSafe<ApiStats>(
      '/api/stats',
      { next: { revalidate: 10 } }
    ),
  ]);

  const overview = analyticsResponse?.data?.overview ?? {
    total_blocks: '0',
    total_transactions: '0',
    total_addresses: '0',
    total_gas_used: '0',
  };

  const series = analyticsResponse?.data?.series ?? {
    tps: [],
    gas_used: [],
    block_time: [],
    tx_count: [],
  };

  const validators = networkResponse?.data?.validators ?? [];
  const validatorStats = analyticsResponse?.data?.validators ?? [];

  const currentTps = statsResponse?.data?.stats?.tps ?? '0';
  const avgBlockTime = statsResponse?.data?.stats?.avg_block_time_ms ?? '0';

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <AutoRefresh intervalMs={30000} />

      <header className="space-y-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-slate-500 hover:text-slate-300">Home</Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-600 dark:text-slate-300">Analytics</span>
        </div>
        <h1 className="text-4xl font-semibold text-slate-900 dark:text-white"><TranslatedText tKey="analytics.title" /></h1>
        <p className="max-w-2xl text-base text-slate-600 dark:text-slate-300">
          <TranslatedText tKey="analytics.description" />
        </p>
      </header>

      {/* Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={<TranslatedText tKey="analytics.totalBlocks" />} value={formatNumber(overview.total_blocks)} />
        <StatsCard label={<TranslatedText tKey="analytics.totalTransactions" />} value={formatNumber(overview.total_transactions)} />
        <StatsCard label={<TranslatedText tKey="analytics.uniqueAddresses" />} value={formatNumber(overview.total_addresses)} />
        <StatsCard
          label={<TranslatedText tKey="analytics.totalGasUsed" />}
          value={formatNumber(String(BigInt(overview.total_gas_used || '0') / BigInt(10 ** 9)))}
          suffix=" Gwei"
        />
      </section>

      {/* Live Metrics */}
      <section className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          label={<TranslatedText tKey="analytics.currentTps" />}
          value={Number(currentTps).toFixed(2)}
          highlight
        />
        <StatsCard
          label={<TranslatedText tKey="analytics.avgBlockTime" />}
          value={`${Number(avgBlockTime).toFixed(0)} ms`}
          highlight
        />
      </section>

      {/* TPS Chart */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.tpsTitle" />}
          description={<TranslatedText tKey="analytics.tpsDesc" />}
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=tps"
              filename="qfc_tps_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6">
          <AnalyticsChart
            data={series.tps}
            color="#22c55e"
            height={300}
            yAxisLabel="TPS"
          />
        </div>
      </section>

      {/* Gas Usage Chart */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.gasUsageTitle" />}
          description={<TranslatedText tKey="analytics.gasUsageDesc" />}
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=gas"
              filename="qfc_gas_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6">
          <AnalyticsChart
            data={series.gas_used}
            color="#3b82f6"
            height={300}
            yAxisLabel="Gas"
          />
        </div>
      </section>

      {/* Block Time Chart */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.blockTimeTitle" />}
          description={<TranslatedText tKey="analytics.blockTimeDesc" />}
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=block_time"
              filename="qfc_block_time_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6">
          <AnalyticsChart
            data={series.block_time}
            color="#f59e0b"
            height={300}
            yAxisLabel="ms"
          />
        </div>
      </section>

      {/* Validator Statistics */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.validatorStats" />}
          description={<TranslatedText tKey="analytics.validatorStatsDesc" />}
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=validators"
              filename="qfc_validator_stats"
            />
          }
        />
        <ValidatorTable
          validators={validators}
          stats={validatorStats}
        />
      </section>

      {/* Transaction Volume Chart */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.txVolume" />}
          description={<TranslatedText tKey="analytics.txVolumeDesc" />}
        />
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-900/50 p-6">
          <AnalyticsChart
            data={series.tx_count}
            color="#a855f7"
            height={250}
            yAxisLabel="Txs"
          />
        </div>
      </section>

      {/* Daily Trend Charts */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="analytics.dailyCharts" />}
          description={<TranslatedText tKey="analytics.dailyChartsDesc" />}
        />
        <DailyCharts />
      </section>
    </main>
  );
}
