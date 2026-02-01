import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlocksList } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import AutoRefresh from '@/components/AutoRefresh';

const PAGE_SIZE = 25;

export default async function BlocksPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<ApiBlocksList>(
    `/api/blocks?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 10 } }
  );
  const blocks = response?.data.items ?? [];

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title="Blocks"
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
            render: (row) =>
              row.producer ? (
                <Link href={`/address/${row.producer}`} className="text-slate-200">
                  {shortenHash(row.producer)}
                </Link>
              ) : (
                '—'
              ),
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

      <div className="flex items-center justify-between text-sm text-slate-400">
        <Link
          href={`/blocks?page=${Math.max(1, page - 1)}`}
          className="rounded-full border border-slate-800 px-4 py-2"
        >
          Previous
        </Link>
        <span>Page {page}</span>
        <Link
          href={`/blocks?page=${page + 1}`}
          className="rounded-full border border-slate-800 px-4 py-2"
        >
          Next
        </Link>
      </div>
    </main>
  );
}
