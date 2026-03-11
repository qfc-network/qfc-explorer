export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Inference Marketplace',
  description: 'Browse AI models, pricing, and miner availability on QFC.',
  openGraph: {
    title: 'Inference Marketplace | QFC Explorer',
    description: 'Browse AI models, pricing, and miner availability on QFC.',
    type: 'website',
  },
};

import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiInferenceMarketplace } from '@/lib/api-types';
import { formatDuration } from '@/lib/qfc-format';

export default async function MarketplacePage() {
  const response = await fetchJsonSafe<ApiInferenceMarketplace>(
    '/api/inference/marketplace',
    { next: { revalidate: 30 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-6 px-4 py-8">
        <SectionHeader title="Inference Marketplace" description="Marketplace data not available." />
      </main>
    );
  }

  const { totalModels, totalTasks, totalMiners, avgPassRate, models } = response.data;

  return (
    <main className="mx-auto flex min-h-screen max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Inference Marketplace"
          description="Browse available AI models, their pricing, and miner availability."
        />
        <Link
          href="/inference/submit"
          className="rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        >
          Submit Task
        </Link>
      </div>

      {/* Overview Stats */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label="Available Models" value={totalModels.toString()} />
        <StatsCard label="Total Tasks" value={totalTasks.toString()} />
        <StatsCard label="Active Miners" value={totalMiners.toString()} />
        <StatsCard label="Avg Pass Rate" value={`${avgPassRate}%`} />
      </section>

      {/* Model Cards Grid */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {models.map((model) => (
          <div
            key={model.name}
            className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60 transition-shadow hover:shadow-lg"
          >
            {/* Header */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  {model.name}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">v{model.version}</p>
              </div>
              <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                model.minTier === 'Hot'
                  ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-300'
                  : model.minTier === 'Warm'
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-300'
                    : 'bg-cyan-100 text-cyan-700 dark:bg-cyan-500/20 dark:text-cyan-300'
              }`}>
                {model.minTier}
              </span>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Tasks</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {model.totalTasks.toLocaleString()}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Success Rate</p>
                <p className={`text-sm font-semibold ${
                  model.successRate >= 90 ? 'text-emerald-600 dark:text-emerald-400'
                    : model.successRate >= 70 ? 'text-amber-600 dark:text-amber-400'
                      : 'text-red-600 dark:text-red-400'
                }`}>
                  {model.successRate}%
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Avg Time</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {model.avgExecutionTimeMs > 0 ? formatDuration(String(model.avgExecutionTimeMs)) : '—'}
                </p>
              </div>
              <div className="rounded-lg bg-slate-50 p-2.5 dark:bg-slate-800/50">
                <p className="text-xs text-slate-500 dark:text-slate-400">Miners</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {model.activeMiners}
                </p>
              </div>
            </div>

            {/* Requirements */}
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <span>Min {model.minMemoryMb} MB VRAM</span>
              <span>&middot;</span>
              <span>{model.completedTasks} completed</span>
            </div>

            {/* CTA */}
            <Link
              href={`/inference/submit?model=${encodeURIComponent(model.name)}`}
              className="block w-full rounded-lg border border-slate-200 bg-white py-2 text-center text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            >
              Submit Task
            </Link>
          </div>
        ))}
      </section>

      {models.length === 0 && (
        <p className="text-center text-slate-500 dark:text-slate-400 py-12">
          No models available yet.
        </p>
      )}
    </main>
  );
}
