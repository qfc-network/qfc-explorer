export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import SectionHeader from '@/components/SectionHeader';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiInference } from '@/lib/api-types';
import { shortenHash } from '@/lib/format';

export const metadata: Metadata = {
  title: 'Inference Analytics',
  description: 'QFC AI inference analytics and charts.',
  openGraph: {
    title: 'Inference Analytics | QFC Explorer',
    description: 'QFC AI inference analytics and charts.',
    type: 'website',
  },
};

export default async function InferenceAnalyticsPage() {
  const response = await fetchJsonSafe<ApiInference>(
    '/api/inference',
    { next: { revalidate: 15 } }
  );

  if (!response) {
    return (
      <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Inference Analytics" description="Inference data not available" />
      </main>
    );
  }

  const { stats, validators: validatorsRaw, models } = response.data;
  const validators = validatorsRaw
    .filter(v => v.isActive)
    .sort((a, b) => Number(b.tasksCompleted) - Number(a.tasksCompleted));

  // Compute data for charts
  const passRate = parseFloat(stats.passRate) || 0;
  const failRate = 100 - passRate;

  // Top miners by tasks completed
  const topMiners = validators
    .filter(v => Number(v.tasksCompleted) > 0)
    .slice(0, 8);
  const maxMinerTasks = topMiners.length > 0 ? Number(topMiners[0].tasksCompleted) : 1;

  // Model usage - count validators providing each compute mode
  const inferenceCount = validators.filter(v => v.computeMode === 'inference').length;
  const powCount = validators.filter(v => v.computeMode === 'pow').length;
  const maxModeCount = Math.max(inferenceCount, powCount, 1);

  // Inference scores distribution
  const scoreRanges = [
    { label: '0', count: 0 },
    { label: '1-100', count: 0 },
    { label: '101-500', count: 0 },
    { label: '501-1K', count: 0 },
    { label: '1K+', count: 0 },
  ];
  for (const v of validators) {
    const score = Number(v.inferenceScore);
    if (score === 0) scoreRanges[0].count++;
    else if (score <= 100) scoreRanges[1].count++;
    else if (score <= 500) scoreRanges[2].count++;
    else if (score <= 1000) scoreRanges[3].count++;
    else scoreRanges[4].count++;
  }
  const maxScoreCount = Math.max(...scoreRanges.map(s => s.count), 1);

  // Model registry stats
  const modelsByTier: Record<string, number> = {};
  for (const m of models) {
    modelsByTier[m.minTier] = (modelsByTier[m.minTier] || 0) + 1;
  }
  const tierEntries = Object.entries(modelsByTier).sort((a, b) => b[1] - a[1]);
  const maxTierCount = tierEntries.length > 0 ? tierEntries[0][1] : 1;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <SectionHeader
          title="Inference Analytics"
          description="Visual analytics for QFC network inference performance."
        />
        <Link
          href="/inference"
          className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
        >
          Back to Inference
        </Link>
      </div>

      {/* Task Success Rate */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Task Success Rate</h3>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-emerald-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Pass: {passRate.toFixed(1)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-400" />
              <span className="text-sm text-slate-600 dark:text-slate-400">Fail: {failRate.toFixed(1)}%</span>
            </div>
            <div className="text-sm text-slate-500">
              {stats.tasksCompleted} tasks completed
            </div>
          </div>
          {/* Horizontal stacked bar */}
          <div className="h-10 w-full rounded-lg overflow-hidden flex bg-slate-100 dark:bg-slate-800">
            {passRate > 0 && (
              <div
                className="h-full bg-emerald-400 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-white transition-all"
                style={{ width: `${passRate}%` }}
              >
                {passRate >= 10 ? `${passRate.toFixed(1)}%` : ''}
              </div>
            )}
            {failRate > 0 && (
              <div
                className="h-full bg-red-400 flex items-center justify-center text-xs font-semibold text-slate-900 dark:text-white transition-all"
                style={{ width: `${failRate}%` }}
              >
                {failRate >= 10 ? `${failRate.toFixed(1)}%` : ''}
              </div>
            )}
          </div>
          <p className="mt-3 text-xs text-slate-500">
            Average inference time: {stats.avgTimeMs ? `${Number(stats.avgTimeMs).toLocaleString()} ms` : 'N/A'}
          </p>
        </div>
      </section>

      {/* Top Miners by Tasks */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Top Miners by Tasks Completed</h3>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6">
          {topMiners.length === 0 ? (
            <p className="text-sm text-slate-500">No miners with completed tasks yet.</p>
          ) : (
            <div className="space-y-3">
              {topMiners.map((miner, i) => {
                const tasks = Number(miner.tasksCompleted);
                const pct = (tasks / maxMinerTasks) * 100;
                return (
                  <div key={miner.address} className="flex items-center gap-3">
                    <span className="w-6 text-right text-xs text-slate-500 shrink-0">{i + 1}</span>
                    <Link
                      href={`/address/${miner.address}`}
                      className="w-28 shrink-0 font-mono text-xs text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 dark:hover:text-cyan-300 truncate"
                    >
                      {shortenHash(miner.address)}
                    </Link>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                      <div
                        className="h-full bg-cyan-400/70 rounded flex items-center px-2 transition-all"
                        style={{ width: `${Math.max(pct, 2)}%` }}
                      >
                        {pct >= 15 && (
                          <span className="text-[10px] font-semibold text-slate-900 dark:text-white">{tasks}</span>
                        )}
                      </div>
                    </div>
                    {pct < 15 && (
                      <span className="text-xs text-slate-500 shrink-0">{tasks}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Compute Mode Breakdown */}
      <section className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Validator Compute Modes</h3>
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6">
            <div className="space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Inference</span>
                  <span className="text-slate-900 dark:text-white font-medium">{inferenceCount}</span>
                </div>
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-blue-400/70 rounded transition-all"
                    style={{ width: `${(inferenceCount / maxModeCount) * 100}%` }}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600 dark:text-slate-400">Proof of Work</span>
                  <span className="text-slate-900 dark:text-white font-medium">{powCount}</span>
                </div>
                <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                  <div
                    className="h-full bg-amber-400/70 rounded transition-all"
                    style={{ width: `${(powCount / maxModeCount) * 100}%` }}
                  />
                </div>
              </div>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              {validators.length} active validators total
            </p>
          </div>
        </div>

        {/* Model Requirements by Tier */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Models by GPU Tier</h3>
          <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6">
            {tierEntries.length === 0 ? (
              <p className="text-sm text-slate-500">No models registered.</p>
            ) : (
              <div className="space-y-4">
                {tierEntries.map(([tier, count]) => {
                  const color = tier === 'Hot'
                    ? 'bg-red-400/70'
                    : tier === 'Warm'
                      ? 'bg-amber-400/70'
                      : 'bg-cyan-400/70';
                  return (
                    <div key={tier} className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600 dark:text-slate-400">{tier}</span>
                        <span className="text-slate-900 dark:text-white font-medium">{count}</span>
                      </div>
                      <div className="h-6 bg-slate-100 dark:bg-slate-800 rounded overflow-hidden">
                        <div
                          className={`h-full ${color} rounded transition-all`}
                          style={{ width: `${(count / maxTierCount) * 100}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p className="mt-4 text-xs text-slate-500">
              {models.length} approved models
            </p>
          </div>
        </div>
      </section>

      {/* Inference Score Distribution */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Inference Score Distribution</h3>
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6">
          <div className="flex items-end gap-3 h-48">
            {scoreRanges.map((range) => {
              const heightPct = maxScoreCount > 0 ? (range.count / maxScoreCount) * 100 : 0;
              return (
                <div key={range.label} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-xs text-slate-600 dark:text-slate-400 font-medium">{range.count}</span>
                  <div className="w-full flex items-end" style={{ height: '140px' }}>
                    <div
                      className="w-full bg-purple-400/70 rounded-t transition-all"
                      style={{ height: `${Math.max(heightPct, 2)}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-slate-500 text-center">{range.label}</span>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs text-slate-500">
            Distribution of validator inference scores across the network
          </p>
        </div>
      </section>

      {/* Network FLOPS Summary */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">Network Performance</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard label="Total Tasks" value={stats.tasksCompleted} />
          <SummaryCard label="Pass Rate" value={`${passRate.toFixed(1)}%`} />
          <SummaryCard label="Avg Time" value={stats.avgTimeMs ? `${Number(stats.avgTimeMs).toLocaleString()} ms` : 'N/A'} />
          <SummaryCard label="Total FLOPS" value={formatFlopsCompact(stats.flopsTotal)} />
        </div>
      </section>
    </main>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-slate-900 dark:text-white">{value}</p>
    </div>
  );
}

function formatFlopsCompact(value: string): string {
  if (!value || value === '0') return '0';
  const num = Number(value);
  if (!Number.isFinite(num) || num === 0) return '0';
  const units = ['', 'K', 'M', 'G', 'T'];
  let idx = 0;
  let display = num;
  while (display >= 1000 && idx < units.length - 1) {
    display /= 1000;
    idx++;
  }
  return `${display < 10 ? display.toFixed(2) : display < 100 ? display.toFixed(1) : display.toFixed(0)}${units[idx]} FLOPS`;
}
