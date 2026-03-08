export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Transactions',
  description: 'Browse all transactions on the QFC blockchain.',
  openGraph: {
    title: 'Transactions | QFC Explorer',
    description: 'Browse all transactions on the QFC blockchain.',
    type: 'website',
  },
};

import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiTransactionsList } from '@/lib/api-types';
import { formatWeiToQfc, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import AutoRefresh from '@/components/AutoRefresh';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';

const PAGE_SIZE = 25;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string; cursor?: string };
}) {
  const cursor = searchParams.cursor ?? null;
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  // Use cursor-based fetch when cursor is present, otherwise fall back to page-based
  const apiQuery = cursor
    ? `/api/transactions?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`
    : `/api/transactions?page=${page}&limit=${PAGE_SIZE}`;

  const response = await fetchJsonSafe<ApiTransactionsList>(apiQuery, {
    next: { revalidate: 10 },
  });
  const transactions = response?.data.items ?? [];
  const nextCursor = response?.data.next_cursor ?? null;

  // Resolve address labels
  const allAddresses = transactions.flatMap((tx) => [tx.from_address, tx.to_address].filter(Boolean) as string[]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title="Transactions"
        description={cursor ? 'Browsing transactions' : `Showing page ${page}`}
        action={
          <Link
            href="/"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            Back
          </Link>
        }
      />

      <Table
        rows={transactions}
        keyField="hash"
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
              <AddressTag address={row.from_address} label={labels[row.from_address.toLowerCase()]?.label} />
            ),
          },
          {
            key: 'to',
            header: 'To',
            render: (row) =>
              row.to_address ? (
                <AddressTag address={row.to_address} label={labels[row.to_address.toLowerCase()]?.label} />
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
            key: 'status',
            header: 'Status',
            render: (row) => <StatusBadge status={row.status} />,
          },
        ]}
      />

      <div className="flex items-center justify-between text-sm text-slate-400">
        {/* Previous: fall back to page-based navigation */}
        {cursor || page > 1 ? (
          <Link
            href={cursor ? '/txs' : `/txs?page=${page - 1}`}
            className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
          >
            Previous
          </Link>
        ) : (
          <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
            Previous
          </span>
        )}
        <span>{cursor ? 'Cursor pagination' : `Page ${page}`}</span>
        {/* Next: use cursor when available, fall back to page increment */}
        {nextCursor ? (
          <Link
            href={`/txs?cursor=${encodeURIComponent(nextCursor)}`}
            className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
          >
            Next
          </Link>
        ) : transactions.length === PAGE_SIZE ? (
          <Link
            href={`/txs?page=${page + 1}`}
            className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
          >
            Next
          </Link>
        ) : (
          <span className="rounded-full border border-slate-800/40 px-4 py-2 text-slate-600">
            Next
          </span>
        )}
      </div>
    </main>
  );
}
