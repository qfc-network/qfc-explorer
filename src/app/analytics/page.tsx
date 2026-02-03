export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiNetwork, ApiStats } from '@/lib/api-types';
import { formatNumber } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import AnalyticsChart from '@/components/AnalyticsChart';
import ValidatorTable from '@/components/ValidatorTable';
import ExportButton from '@/components/ExportButton';
import AutoRefresh from '@/components/AutoRefresh';

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
          <span className="text-slate-300">Analytics</span>
        </div>
        <h1 className="text-4xl font-semibold text-white">Network Analytics</h1>
        <p className="max-w-2xl text-base text-slate-300">
          Comprehensive metrics and trends for the QFC network.
        </p>
      </header>

      {/* Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Total Blocks" value={formatNumber(overview.total_blocks)} />
        <StatsCard label="Total Transactions" value={formatNumber(overview.total_transactions)} />
        <StatsCard label="Unique Addresses" value={formatNumber(overview.total_addresses)} />
        <StatsCard
          label="Total Gas Used"
          value={formatNumber(BigInt(overview.total_gas_used || '0') / BigInt(1e9))}
          suffix=" Gwei"
        />
      </section>

      {/* Live Metrics */}
      <section className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          label="Current TPS"
          value={Number(currentTps).toFixed(2)}
          highlight
        />
        <StatsCard
          label="Avg Block Time"
          value={`${Number(avgBlockTime).toFixed(0)} ms`}
          highlight
        />
      </section>

      {/* TPS Chart */}
      <section className="space-y-4">
        <SectionHeader
          title="Transactions Per Second (TPS)"
          description="Historical TPS over the last 100 blocks"
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=tps"
              filename="qfc_tps_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
          title="Gas Usage Trend"
          description="Gas consumed per block over the last 100 blocks"
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=gas"
              filename="qfc_gas_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
          title="Block Time"
          description="Time between blocks in milliseconds"
          action={
            <ExportButton
              endpoint="/api/analytics/export?type=block_time"
              filename="qfc_block_time_data"
            />
          }
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
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
          title="Validator Statistics"
          description="Block production and contribution metrics for validators"
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
          title="Transaction Volume"
          description="Number of transactions per block"
        />
        <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-6">
          <AnalyticsChart
            data={series.tx_count}
            color="#a855f7"
            height={250}
            yAxisLabel="Txs"
          />
        </div>
      </section>
    </main>
  );
}
