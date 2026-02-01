import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import StatusBadge from '@/components/StatusBadge';
import AutoRefresh from '@/components/AutoRefresh';

const PAGE_SIZE = 25;

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<{ ok: true; data: { items: Array<{ hash: string; from_address: string; to_address: string | null; value: string; status: string }> } }>(
    `/api/transactions?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 10 } }
  );
  const transactions = response?.data.items ?? [];

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
