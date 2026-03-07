export const dynamic = "force-dynamic";

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList, ApiStats, ApiTransactionsList } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, formatWeiToQfc, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import StatChart from '@/components/StatChart';
import Table from '@/components/Table';
import AutoRefresh from '@/components/AutoRefresh';

export default async function Home() {
  const [blocksResponse, transactionsResponse, statsResponse] = await Promise.all([
    fetchJsonSafe<ApiBlocksList>(
      '/api/blocks?limit=6&page=1',
      { next: { revalidate: 5 } }
    ),
    fetchJsonSafe<ApiTransactionsList>(
      '/api/transactions?limit=6&page=1',
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
  const latestTimestamp = statsResponse?.data.stats.latest_timestamp_ms ?? blocks[0]?.timestamp_ms ?? '0';
  const avgBlockTimeMs = statsResponse?.data.stats.avg_block_time_ms;
  const tps = statsResponse?.data.stats.tps;
  const activeAddresses = statsResponse?.data.stats.active_addresses;
  const series = statsResponse?.data.series;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
      <AutoRefresh intervalMs={15000} />
      <header className="space-y-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-500">QFC Explorer</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">
          Real-time clarity for every block.
        </h1>
        <p className="max-w-2xl text-base text-slate-300">
          Track QFC network activity, recent blocks, and transactions as the chain grows.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-3">
        <StatsCard label="Latest Block" value={formatNumber(latestHeight)} />
        <StatsCard
          label="Latest Timestamp"
          value={latestTimestamp !== '0' ? formatTimestampMs(latestTimestamp) : '—'}
        />
        <StatsCard
          label="Avg Block Time"
          value={avgBlockTimeMs == null ? '—' : `${Number(avgBlockTimeMs).toFixed(0)} ms`}
        />
        <StatsCard
          label="TPS (100 blocks)"
          value={tps == null ? '—' : Number(tps) < 0.01 ? Number(tps).toFixed(4) : Number(tps).toFixed(2)}
        />
        <StatsCard
          label="Total Addresses"
          value={activeAddresses == null ? '—' : formatNumber(activeAddresses)}
        />
        <StatsCard label="Total Blocks" value={formatNumber(latestHeight)} />
      </section>

      {series ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <StatChart title="Block Time (ms)" points={series.block_time_ms} suffix=" ms" />
          <StatChart title="Txs per Block" points={series.tps} />
          <StatChart title="Active Addresses" points={series.active_addresses} />
        </section>
      ) : null}

      <section className="space-y-4">
        <SectionHeader
          title="Latest Blocks"
          description="Most recent blocks indexed from the network."
          action={
            <Link
              href="/blocks"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
            >
              View all
            </Link>
          }
        />
        <Table
          rows={blocks}
          emptyMessage="No blocks indexed yet."
          columns={[
            {
              key: 'height',
              header: 'Height',
              render: (row) => (
                <Link href={`/blocks/${row.height}`} className="text-slate-200">
                  {formatNumber(row.height)}
                </Link>
              ),
            },
            {
              key: 'hash',
              header: 'Hash',
              render: (row) => (
                <Link href={`/blocks/${row.height}`} className="text-slate-200">
                  {shortenHash(row.hash)}
                </Link>
              ),
            },
            {
              key: 'producer',
              header: 'Producer',
              render: (row) => (row.producer ? shortenHash(row.producer) : '—'),
            },
            {
              key: 'tx_count',
              header: 'Txs',
              render: (row) => formatNumber(row.tx_count),
            },
            {
              key: 'timestamp',
              header: 'Timestamp',
              render: (row) => formatTimestampMs(row.timestamp_ms),
            },
          ]}
        />
      </section>

      <section className="space-y-4">
        <SectionHeader
          title="Latest Transactions"
          description="Recent transaction activity across indexed blocks."
          action={
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/txs"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
              >
                View all
              </Link>
              <Link
                href="/analytics"
                className="rounded-full border border-green-500/30 bg-green-500/10 px-4 py-2 text-xs uppercase tracking-[0.2em] text-green-400"
              >
                Analytics
              </Link>
              <Link
                href="/network"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Network
              </Link>
              <Link
                href="/contracts"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Contracts
              </Link>
              <Link
                href="/token/qfc"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Tokenomics
              </Link>
              <Link
                href="/tokens"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Tokens
              </Link>
              <Link
                href="/admin"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Admin
              </Link>
            </div>
          }
        />
        <Table
          rows={transactions}
          emptyMessage="No transactions indexed yet."
          columns={[
            {
              key: 'hash',
              header: 'Hash',
              render: (row) => (
                <Link href={`/txs/${row.hash}`} className="text-slate-200">
                  {shortenHash(row.hash)}
                </Link>
              ),
            },
            {
              key: 'from',
              header: 'From',
              render: (row) => (
                <Link href={`/address/${row.from_address}`} className="text-slate-200">
                  {shortenHash(row.from_address)}
                </Link>
              ),
            },
            {
              key: 'to',
              header: 'To',
              render: (row) =>
                row.to_address ? (
                  <Link href={`/address/${row.to_address}`} className="text-slate-200">
                    {shortenHash(row.to_address)}
                  </Link>
                ) : (
                  '—'
                ),
            },
            {
              key: 'value',
              header: 'Value',
              render: (row) => `${formatWeiToQfc(row.value)} QFC`,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => row.status,
            },
          ]}
        />
      </section>
    </main>
  );
}
