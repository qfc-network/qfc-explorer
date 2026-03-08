export const dynamic = "force-dynamic";

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Blocks',
  description: 'Browse all blocks on the QFC blockchain.',
  openGraph: {
    title: 'Blocks | QFC Explorer',
    description: 'Browse all blocks on the QFC blockchain.',
    type: 'website',
  },
};

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
  searchParams: { page?: string; cursor?: string };
}) {
  const cursor = searchParams.cursor ?? null;
  const page = Math.max(1, Number(searchParams.page ?? '1'));

  // Use cursor-based fetch when cursor is present, otherwise fall back to page-based
  const apiQuery = cursor
    ? `/api/blocks?cursor=${encodeURIComponent(cursor)}&limit=${PAGE_SIZE}`
    : `/api/blocks?page=${page}&limit=${PAGE_SIZE}`;

  const response = await fetchJsonSafe<ApiBlocksList>(apiQuery, {
    next: { revalidate: 10 },
  });
  const blocks = response?.data.items ?? [];
  const nextCursor = response?.data.next_cursor ?? null;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <AutoRefresh intervalMs={20000} />
      <SectionHeader
        title="Blocks"
        description={cursor ? 'Browsing blocks' : `Showing page ${page}`}
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
        keyField="hash"
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
        {/* Previous: fall back to page-based navigation */}
        {cursor || page > 1 ? (
          <Link
            href={cursor ? '/blocks' : `/blocks?page=${page - 1}`}
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
            href={`/blocks?cursor=${encodeURIComponent(nextCursor)}`}
            className="rounded-full border border-slate-800 px-4 py-2 hover:bg-slate-900 transition-colors"
          >
            Next
          </Link>
        ) : blocks.length === PAGE_SIZE ? (
          <Link
            href={`/blocks?page=${page + 1}`}
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
