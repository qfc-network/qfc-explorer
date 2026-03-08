export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pending Transactions',
  description: 'View pending transactions in the QFC mempool.',
  openGraph: {
    title: 'Pending Transactions | QFC Explorer',
    description: 'View pending transactions in the QFC mempool.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTxPool } from '@/lib/api-types';
import { formatWeiToQfc, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AddressTag from '@/components/AddressTag';
import PendingRefresh from './PendingRefresh';

function formatGwei(hex: string): string {
  if (!hex) return '0';
  try {
    const wei = BigInt(hex);
    const gwei = wei / 1_000_000_000n;
    const remainder = wei % 1_000_000_000n;
    if (remainder === 0n) return `${gwei}`;
    const decimals = remainder.toString().padStart(9, '0').slice(0, 2);
    return `${gwei}.${decimals}`;
  } catch {
    return '0';
  }
}

export default async function PendingPage({
  searchParams,
}: {
  searchParams: { sort?: string; order?: string };
}) {
  const sort = searchParams.sort ?? 'nonce';
  const order = searchParams.order ?? 'desc';

  const response = await fetchJsonSafe<ApiTxPool>(
    `/api/txpool?sort=${sort}&order=${order}&limit=100`,
    { next: { revalidate: 5 } }
  );

  const pending = response?.data.pending ?? [];
  const count = response?.data.count ?? 0;
  const queued = response?.data.queued ?? 0;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <PendingRefresh intervalMs={10000} currentSort={sort} currentOrder={order} />

      <SectionHeader
        title="Pending Transactions"
        description={`${count} pending, ${queued} queued in mempool`}
        action={
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            Back
          </Link>
        }
      />

      {/* Sort controls */}
      <div className="flex flex-wrap items-center gap-2 text-sm text-slate-400">
        <span>Sort by:</span>
        {[
          { key: 'gas_price', label: 'Gas Price' },
          { key: 'nonce', label: 'Nonce' },
          { key: 'value', label: 'Value' },
        ].map(({ key, label }) => {
          const isActive = sort === key;
          const nextOrder = isActive && order === 'desc' ? 'asc' : 'desc';
          return (
            <Link
              key={key}
              href={`/pending?sort=${key}&order=${nextOrder}`}
              className={`rounded-full border px-3 py-1 transition-colors ${
                isActive
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                  : 'border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              {label}
              {isActive && (
                <span className="ml-1">{order === 'desc' ? '\u2193' : '\u2191'}</span>
              )}
            </Link>
          );
        })}
      </div>

      <Table
        rows={pending}
        keyField="hash"
        emptyMessage="No pending transactions in the mempool."
        columns={[
          {
            key: 'hash',
            header: 'Hash',
            render: (row) => (
              <Link href={`/txs/${row.hash}`} className="text-slate-200 hover:text-cyan-400">
                {shortenHash(row.hash)}
              </Link>
            ),
          },
          {
            key: 'from',
            header: 'From',
            render: (row) => <AddressTag address={row.from} />,
          },
          {
            key: 'to',
            header: 'To',
            render: (row) =>
              row.to ? (
                <AddressTag address={row.to} />
              ) : (
                <span className="text-emerald-400 text-xs">Contract Creation</span>
              ),
          },
          {
            key: 'value',
            header: 'Value',
            render: (row) => `${formatWeiToQfc(row.value)} QFC`,
          },
          {
            key: 'gasPrice',
            header: 'Gas Price',
            render: (row) => (
              <span className="text-slate-300">{formatGwei(row.gasPrice)} Gwei</span>
            ),
          },
          {
            key: 'nonce',
            header: 'Nonce',
            render: (row) => <span className="font-mono text-slate-300">{row.nonce}</span>,
          },
        ]}
      />

      {count === 0 && (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 text-center">
          <p className="text-slate-400">The mempool is empty or txpool RPC methods are not available on this node.</p>
        </div>
      )}
    </main>
  );
}
