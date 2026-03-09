export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiValidatorDetail } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';
import CopyButton from '@/components/CopyButton';
import TranslatedText from '@/components/TranslatedText';

export async function generateMetadata({ params }: { params: { address: string } }): Promise<Metadata> {
  const addr = params.address;
  return {
    title: `Validator ${shortenHash(addr)}`,
    description: `Block production statistics for validator ${addr} on the QFC blockchain.`,
    openGraph: {
      title: `Validator ${shortenHash(addr)} | QFC Explorer`,
      description: `Block production statistics for validator ${addr} on the QFC blockchain.`,
      type: 'article',
    },
  };
}

function BlockProductionChart({ timeline }: { timeline: Array<{ date: string; block_count: number }> }) {
  if (timeline.length === 0) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-6 text-sm text-slate-500">
        No block production data for the last 30 days.
      </div>
    );
  }

  const maxCount = Math.max(...timeline.map((d) => d.block_count), 1);
  const barWidth = Math.max(8, Math.floor(700 / timeline.length) - 2);
  const chartWidth = timeline.length * (barWidth + 2) + 40;
  const chartHeight = 200;
  const barAreaHeight = 160;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500 mb-4">
        <TranslatedText tKey="validators.blockTimeline" />
      </p>
      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${chartWidth} ${chartHeight}`}
          className="w-full min-w-[400px]"
          style={{ maxHeight: '220px' }}
          role="img"
          aria-label="Block production timeline chart"
        >
          {/* Y-axis gridlines */}
          {[0, 0.25, 0.5, 0.75, 1].map((frac) => {
            const y = 10 + barAreaHeight * (1 - frac);
            return (
              <g key={frac}>
                <line x1="35" y1={y} x2={chartWidth} y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="4,4" />
                <text x="30" y={y + 3} textAnchor="end" className="fill-slate-500" fontSize="9">
                  {Math.round(maxCount * frac)}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {timeline.map((day, i) => {
            const barHeight = (day.block_count / maxCount) * barAreaHeight;
            const x = 40 + i * (barWidth + 2);
            const y = 10 + barAreaHeight - barHeight;

            return (
              <g key={day.date}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(1, barHeight)}
                  rx="2"
                  className="fill-cyan-500/80 hover:fill-cyan-400 transition-colors"
                />
                <title>{`${day.date}: ${day.block_count} blocks`}</title>
                {/* Show date labels for every ~5th bar or if fewer than 10 */}
                {(timeline.length <= 10 || i % Math.ceil(timeline.length / 7) === 0) && (
                  <text
                    x={x + barWidth / 2}
                    y={chartHeight - 2}
                    textAnchor="middle"
                    className="fill-slate-500"
                    fontSize="7"
                  >
                    {day.date.slice(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

export default async function ValidatorDetailPage({
  params,
}: {
  params: { address: string };
}) {
  const address = params.address;
  const response = await fetchJsonSafe<ApiValidatorDetail>(
    `/api/validators/${address}`,
    { next: { revalidate: 30 } }
  );

  if (!response || !response.data) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-6 px-6 py-12">
        <SectionHeader
          title={<TranslatedText tKey="validators.notFound" />}
          description={address}
        />
        <Link
          href="/validators"
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200 self-start"
        >
          <TranslatedText tKey="validators.backToList" />
        </Link>
      </main>
    );
  }

  const { stats, recent_blocks, timeline } = response.data;
  const percentage = stats.total_blocks > 0
    ? (stats.blocks_produced / stats.total_blocks * 100).toFixed(2)
    : '0.00';

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title={
          <span className="flex items-center gap-3">
            <TranslatedText tKey="validators.validatorProfile" />
            {stats.label && (
              <span className="rounded bg-cyan-500/10 px-2 py-0.5 text-sm font-medium text-cyan-400">
                {stats.label}
              </span>
            )}
          </span>
        }
        description={shortenHash(address)}
        action={
          <div className="flex items-center gap-3">
            <CopyButton value={address} label="Copy address" />
            <Link
              href="/validators"
              className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-800 dark:text-slate-200"
            >
              <TranslatedText tKey="common.back" />
            </Link>
          </div>
        }
      />

      {/* Full address display */}
      <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/60 p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
          <TranslatedText tKey="common.address" />
        </p>
        <div className="mt-2 flex items-center gap-2">
          <p className="break-all font-mono text-sm text-slate-800 dark:text-slate-200">{address}</p>
          <CopyButton value={address} label="Copy" />
        </div>
      </div>

      {/* Stats cards */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          label={<TranslatedText tKey="validators.blocksProduced" />}
          value={formatNumber(stats.blocks_produced)}
          sub={`${percentage}% of total`}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.firstBlock" />}
          value={`#${formatNumber(stats.first_block)}`}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.lastBlock" />}
          value={`#${formatNumber(stats.last_block)}`}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.avgGasUsed" />}
          value={formatNumber(Math.round(Number(stats.avg_gas_used || 0)))}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <StatsCard
          label={<TranslatedText tKey="validators.totalGasUsed" />}
          value={formatNumber(stats.total_gas_used)}
        />
        <StatsCard
          label={<TranslatedText tKey="validators.lastActive" />}
          value={stats.last_active_ms ? formatTimestampMs(stats.last_active_ms) : '—'}
        />
      </section>

      {/* Block production timeline chart */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="validators.blockTimeline" />}
          description="Last 30 days"
        />
        <BlockProductionChart timeline={timeline} />
      </section>

      {/* Recent blocks table */}
      <section className="space-y-4">
        <SectionHeader
          title={<TranslatedText tKey="validators.recentBlocks" />}
          description={`Last ${recent_blocks.length} blocks`}
        />
        <Table
          rows={recent_blocks as unknown as Record<string, unknown>[]}
          keyField="hash"
          emptyMessage="No blocks found for this validator."
          columns={[
            {
              key: 'height',
              header: 'Block',
              render: (row) => (
                <Link href={`/blocks/${row.height}`} className="text-slate-800 dark:text-slate-200 hover:text-cyan-400">
                  #{formatNumber(row.height as string)}
                </Link>
              ),
            },
            {
              key: 'hash',
              header: 'Hash',
              render: (row) => (
                <span className="font-mono text-slate-400 text-xs">
                  {shortenHash(row.hash as string)}
                </span>
              ),
            },
            {
              key: 'tx_count',
              header: 'Txs',
              render: (row) => (
                <span className="text-slate-600 dark:text-slate-300">{row.tx_count as number}</span>
              ),
            },
            {
              key: 'gas_used',
              header: 'Gas Used',
              render: (row) => (
                <span className="text-slate-400 text-xs">{formatNumber(row.gas_used as string)}</span>
              ),
            },
            {
              key: 'timestamp',
              header: 'Time',
              render: (row) => (
                <span className="text-slate-400 text-xs">
                  {formatTimestampMs(row.timestamp_ms as string)}
                </span>
              ),
            },
          ]}
        />
      </section>

      {/* Link to address page */}
      <div className="flex items-center gap-3">
        <Link
          href={`/address/${address}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <TranslatedText tKey="validators.viewAddress" />
        </Link>
        <Link
          href={`/blocks?producer=${address}`}
          className="rounded-full border border-slate-300 dark:border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <TranslatedText tKey="validators.viewAllBlocks" />
        </Link>
      </div>
    </main>
  );
}
