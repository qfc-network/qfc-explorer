import Link from 'next/link';
import { getLatestBlocks, getLatestTransactions } from '@/db/queries';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import StatsCard from '@/components/StatsCard';
import Table from '@/components/Table';

export default async function Home() {
  const [blocks, transactions] = await Promise.all([
    getLatestBlocks(6),
    getLatestTransactions(6),
  ]);

  const latestHeight = blocks[0]?.height ?? '0';
  const latestTimestamp = blocks[0]?.timestamp_ms ?? '0';

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-10 px-6 py-12">
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
        <StatsCard label="Tracked Blocks" value={formatNumber(blocks.length)} />
      </section>

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
                href="/network"
                className="rounded-full border border-slate-800 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-300"
              >
                Network
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
              render: (row) => row.value,
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
