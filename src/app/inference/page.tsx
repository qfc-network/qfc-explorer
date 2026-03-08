export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inference',
  description: 'QFC AI inference tasks and statistics.',
  openGraph: {
    title: 'Inference | QFC Explorer',
    description: 'QFC AI inference tasks and statistics.',
    type: 'website',
  },
};

import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import TaskLookup from '@/components/TaskLookup';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiInference } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';
import { formatFlops, formatDuration, formatHashrate, formatQfcAmount } from '@/lib/qfc-format';

export default async function InferencePage() {
  const response = await fetchJsonSafe<ApiInference>(
    '/api/inference',
    { next: { revalidate: 15 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="AI Inference" description="Inference data not available" />
      </main>
    );
  }

  const { stats, computeInfo, validators: validatorsRaw, models } = response.data;
  const validators = validatorsRaw
    .filter(v => v.isActive)
    .sort((a, b) => Number(b.inferenceScore) - Number(a.inferenceScore));

  const inferenceValidators = validators.filter(v => v.computeMode === 'inference').length;
  const powValidators = validators.filter(v => v.computeMode === 'pow').length;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="AI Inference"
          description="Network inference statistics and validator compute contributions."
        />
        <Link
          href="/inference/analytics"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          View Analytics
        </Link>
      </div>

      {/* Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Tasks Completed" value={stats.tasksCompleted} />
        <StatsCard label="Avg Inference Time" value={formatDuration(stats.avgTimeMs)} />
        <StatsCard label="Total FLOPS" value={formatFlops(stats.flopsTotal)} />
        <StatsCard
          label="Pass Rate"
          value={`${stats.passRate}%`}
          sub="Verification success rate"
        />
      </section>

      {/* Task Lookup */}
      <section className="space-y-4">
        <SectionHeader
          title="Task Lookup"
          description="Look up an inference task by its ID."
        />
        <TaskLookup />
      </section>

      {/* Node Compute Info */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Backend"
          value={computeInfo.backend}
          sub={computeInfo.providesCompute ? 'Active' : 'Inactive'}
        />
        <StatsCard
          label="GPU Memory"
          value={computeInfo.gpuMemoryMb > 0 ? `${computeInfo.gpuMemoryMb} MB` : 'N/A'}
        />
        <StatsCard label="GPU Tier" value={computeInfo.gpuTier} />
      </section>

      {/* Validator Mix */}
      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard
          label="Inference Validators"
          value={inferenceValidators.toString()}
          sub={`of ${validators.length} total`}
        />
        <StatsCard
          label="PoW Validators"
          value={powValidators.toString()}
          sub={`of ${validators.length} total`}
        />
        <StatsCard
          label="Inference Score"
          value={computeInfo.inferenceScore}
          sub="This node"
        />
      </section>

      {/* Model Registry */}
      <section className="space-y-4">
        <SectionHeader
          title="Model Registry"
          description={`${models.length} approved models`}
        />
        <Table
          rows={models}
          keyField="name"
          emptyMessage="No models registered yet."
          columns={[
            {
              key: 'name',
              header: 'Model Name',
              render: (row) => row.name,
            },
            {
              key: 'version',
              header: 'Version',
              render: (row) => row.version,
            },
            {
              key: 'minTier',
              header: 'Min Tier',
              render: (row) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  row.minTier === 'Hot'
                    ? 'bg-red-500/20 text-red-300'
                    : row.minTier === 'Warm'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-cyan-500/20 text-cyan-300'
                }`}>
                  {row.minTier}
                </span>
              ),
            },
            {
              key: 'minMemoryMb',
              header: 'Min Memory',
              render: (row) => `${row.minMemoryMb} MB`,
            },
          ]}
        />
      </section>

      {/* Validator Inference Table */}
      <section className="space-y-4">
        <SectionHeader
          title="Validator Compute"
          description={`${validators.length} active validators`}
        />
        <Table
          rows={validators}
          keyField="address"
          emptyMessage="No validators reported yet."
          columns={[
            {
              key: 'address',
              header: 'Address',
              render: (row) => shortenHash(row.address),
            },
            {
              key: 'computeMode',
              header: 'Mode',
              render: (row) => (
                <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                  row.computeMode === 'inference'
                    ? 'bg-blue-500/20 text-blue-300'
                    : row.computeMode === 'pow'
                      ? 'bg-amber-500/20 text-amber-300'
                      : 'bg-slate-500/20 text-slate-400'
                }`}>
                  {row.computeMode}
                </span>
              ),
            },
            {
              key: 'inferenceScore',
              header: 'Inference Score',
              render: (row) => row.inferenceScore !== '0' ? row.inferenceScore : '—',
            },
            {
              key: 'tasksCompleted',
              header: 'Tasks',
              render: (row) => row.tasksCompleted !== '0' ? row.tasksCompleted : '—',
            },
            {
              key: 'hashrate',
              header: 'Hashrate',
              render: (row) => row.providesCompute && row.computeMode === 'pow'
                ? formatHashrate(row.hashrate)
                : '—',
            },
            {
              key: 'stake',
              header: 'Stake',
              render: (row) => `${formatQfcAmount(row.stake)} QFC`,
            },
          ]}
        />
      </section>
    </main>
  );
}
