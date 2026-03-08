export const dynamic = "force-dynamic";

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
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<ApiTransactionsList>(
    `/api/transactions?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 10 } }
  );
  const transactions = response?.data.items ?? [];

  // Resolve address labels
  const allAddresses = transactions.flatMap((tx) => [tx.from_address, tx.to_address].filter(Boolean) as string[]);
  const labels = await resolveAddressLabels(allAddresses);

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title="Transactions"
        description={`Showing page ${page}`}
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
        <Link
          href={`/txs?page=${Math.max(1, page - 1)}`}
          className="rounded-full border border-slate-800 px-4 py-2"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link href={`/txs?page=${page + 1}`} className="rounded-full border border-slate-800 px-4 py-2">
          Next
        </Link>
      </div>
    </main>
  );
}
