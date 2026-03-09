export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiMinerDetail } from '@/lib/api-types';
import { formatNumber, shortenHash, formatTimestampMs } from '@/lib/format';
import { formatHexWeiToQfc, formatFlops } from '@/lib/qfc-format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import CopyButton from '@/components/CopyButton';
import TranslatedText from '@/components/TranslatedText';
import MinerScoreGauge from '@/components/MinerScoreGauge';
import MinerEarningsChart from '@/components/MinerEarningsChart';
import VestingTimeline from '@/components/VestingTimeline';
import MinerRoiCalculator from '@/components/MinerRoiCalculator';

export default async function MinerDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const { address } = params;
  const response = await fetchJsonSafe<ApiMinerDetail>(
    `/api/miners/${address}`,
    { next: { revalidate: 15 } }
  );

  const miner = response?.data ?? null;

  if (!miner) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Miner not found" description={`Address ${address}`} />
        <Link
          href="/"
          className="inline-block rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          <TranslatedText tKey="common.backToHome" />
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
          <TranslatedText tKey="miner.title" /> {shortenHash(miner.address)}
        </h1>
        <span className="rounded bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
          <TranslatedText tKey="miner.contributionScore" />: {miner.contributionScore}
        </span>
        <CopyButton value={miner.address} label="Copy" />
        <Link
          href={`/address/${miner.address}`}
          className="rounded-md border border-slate-300 dark:border-slate-700 px-3 py-1 text-xs text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <TranslatedText tKey="miner.viewAccount" />
        </Link>
      </div>

      {/* Revenue summary cards */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="miner.totalEarned" />
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatHexWeiToQfc(miner.totalEarned)} QFC
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="miner.available" />
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatHexWeiToQfc(miner.available)} QFC
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <p className="text-xs uppercase tracking-wider text-slate-500">
            <TranslatedText tKey="miner.locked" />
          </p>
          <p className="mt-2 text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatHexWeiToQfc(miner.locked)} QFC
          </p>
        </div>
      </div>

      {/* Hardware profile */}
      {miner.gpuModel && (
        <section className="mt-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white/60 dark:bg-slate-900/40 p-5">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
            <TranslatedText tKey="miner.hardwareProfile" />
          </h2>
          <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2 lg:grid-cols-3 text-sm">
            <div>
              <span className="text-slate-500">GPU</span>
              <p className="font-medium text-slate-900 dark:text-white">{miner.gpuModel}</p>
            </div>
            <div>
              <span className="text-slate-500">VRAM</span>
              <p className="font-medium text-slate-900 dark:text-white">
                {miner.vramMb >= 1024 ? `${(miner.vramMb / 1024).toFixed(1)} GB` : `${miner.vramMb} MB`}
              </p>
            </div>
            <div>
              <span className="text-slate-500">Backend</span>
              <p className="font-medium text-slate-900 dark:text-white">{miner.backend}</p>
            </div>
            {miner.cpuModel && (
              <div>
                <span className="text-slate-500">CPU</span>
                <p className="font-medium text-slate-900 dark:text-white">{miner.cpuModel}</p>
              </div>
            )}
            {miner.cpuCores > 0 && (
              <div>
                <span className="text-slate-500">CPU Cores</span>
                <p className="font-medium text-slate-900 dark:text-white">{miner.cpuCores}</p>
              </div>
            )}
            {miner.totalMemoryMb > 0 && (
              <div>
                <span className="text-slate-500">RAM</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {(miner.totalMemoryMb / 1024).toFixed(1)} GB
                </p>
              </div>
            )}
            {miner.os && (
              <div>
                <span className="text-slate-500">OS</span>
                <p className="font-medium text-slate-900 dark:text-white">
                  {miner.os}{miner.arch ? ` (${miner.arch})` : ''}
                </p>
              </div>
            )}
            {miner.tier > 0 && (
              <div>
                <span className="text-slate-500">Tier</span>
                <p className="font-medium text-slate-900 dark:text-white">T{miner.tier}</p>
              </div>
            )}
            {miner.benchmarkScore > 0 && (
              <div>
                <span className="text-slate-500">Benchmark</span>
                <p className="font-medium text-slate-900 dark:text-white">{miner.benchmarkScore}</p>
              </div>
            )}
            {miner.version && (
              <div>
                <span className="text-slate-500">Miner Version</span>
                <p className="font-medium text-slate-900 dark:text-white">v{miner.version}</p>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Score gauge + Earnings chart (side by side on desktop) */}
      <div className="mt-6 grid gap-4 lg:grid-cols-[280px_1fr]">
        {Number(miner.contributionScore) > 0 && (
          <MinerScoreGauge score={miner.contributionScore} />
        )}
        <div className={Number(miner.contributionScore) > 0 ? '' : 'lg:col-span-2'}>
          <MinerEarningsChart earnings={miner.earnings} />
        </div>
      </div>

      {/* Vesting timeline */}
      {miner.tranches.length > 0 && (
        <section className="mt-6">
          <VestingTimeline tranches={miner.tranches} />
        </section>
      )}

      {/* Vesting schedule table */}
      <section className="mt-8 space-y-4">
        <SectionHeader
          title="Vesting Schedule"
          description={`${miner.activeTranches} active tranche${miner.activeTranches === 1 ? '' : 's'}`}
        />
        <Table
          rows={miner.tranches}
          emptyMessage="No vesting tranches."
          columns={[
            {
              key: 'blockHeight',
              header: 'Block',
              render: (row) => (
                <Link href={`/blocks/${row.blockHeight}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                  {formatNumber(row.blockHeight)}
                </Link>
              ),
            },
            {
              key: 'amount',
              header: 'Amount',
              render: (row) => `${formatHexWeiToQfc(row.amount)} QFC`,
            },
            {
              key: 'vested',
              header: 'Vested',
              render: (row) => `${formatHexWeiToQfc(row.vested)} QFC`,
            },
            {
              key: 'progress',
              header: 'Progress',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-emerald-500"
                      style={{ width: `${Math.min(100, row.percentVested)}%` }}
                    />
                  </div>
                  <span className="text-xs text-slate-500 dark:text-slate-400">{row.percentVested}%</span>
                </div>
              ),
            },
            {
              key: 'cliffEnd',
              header: 'Cliff End',
              render: (row) => formatTimestampMs(row.cliffEnd),
            },
            {
              key: 'endTime',
              header: 'End Time',
              render: (row) => formatTimestampMs(row.endTime),
            },
          ]}
        />
      </section>

      {/* Recent earnings */}
      <section className="mt-8 space-y-4">
        <SectionHeader title="Recent Earnings" />
        <Table
          rows={miner.earnings}
          emptyMessage="No earnings recorded yet."
          columns={[
            {
              key: 'blockHeight',
              header: 'Block',
              render: (row) => (
                <Link href={`/blocks/${row.blockHeight}`} className="text-cyan-600 dark:text-cyan-400 hover:underline">
                  {formatNumber(row.blockHeight)}
                </Link>
              ),
            },
            {
              key: 'reward',
              header: 'Reward',
              render: (row) => `${formatHexWeiToQfc(row.reward)} QFC`,
            },
            {
              key: 'taskType',
              header: 'Task Type',
              render: (row) => (
                <span className="rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-xs text-slate-600 dark:text-slate-300">
                  {row.taskType}
                </span>
              ),
            },
            {
              key: 'flops',
              header: 'FLOPS',
              render: (row) => formatFlops(row.flops),
            },
            {
              key: 'timestamp',
              header: 'Time',
              render: (row) => formatTimestampMs(row.timestamp),
            },
          ]}
        />
      </section>

      {/* ROI Calculator */}
      <section className="mt-8">
        <MinerRoiCalculator totalEarned={miner.totalEarned} earnings={miner.earnings} />
      </section>
    </main>
  );
}
