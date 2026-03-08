export const dynamic = "force-dynamic";

import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import type { ApiBlockDetail } from '@/lib/api-types';
import { formatNumber, formatTimestampMs, formatWeiToQfc, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import CopyButton from '@/components/CopyButton';
import StatusBadge from '@/components/StatusBadge';
import AddressTag from '@/components/AddressTag';
import { resolveAddressLabels } from '@/lib/labels';

export async function generateMetadata({ params }: { params: { height: string } }): Promise<Metadata> {
  return { title: `Block ${params.height}` };
}

const PAGE_SIZE = 25;

export default async function BlockDetailPage({
  params,
  searchParams,
}: {
  params: { height: string };
  searchParams: { page?: string };
}) {
  const height = params.height;
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<ApiBlockDetail>(
    `/api/blocks/${height}?page=${page}&limit=${PAGE_SIZE}`,
    { next: { revalidate: 10 } }
  );

  const block = response?.data.block ?? null;
  const transactions = response?.data.transactions ?? [];

  // Resolve address labels for transactions
  const allAddresses = transactions.flatMap((tx) => [tx.from_address, tx.to_address].filter(Boolean) as string[]);
  const labels = await resolveAddressLabels(allAddresses);

  if (!block) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Block not found" description={`Height ${height}`} />
        <Link
          href="/blocks"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Back to blocks
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title={`Block ${formatNumber(block.height)}`}
        description={`Hash ${shortenHash(block.hash)}`}
        action={
          <div className="flex items-center gap-3">
            <CopyButton value={block.hash} label="Copy hash" />
            <Link
              href="/blocks"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Timestamp</p>
          <p className="mt-2 text-lg text-white">{formatTimestampMs(block.timestamp_ms)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Producer</p>
          <p className="mt-2 text-lg text-white">
            {block.producer ? shortenHash(block.producer) : '—'}
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gas Used</p>
          <p className="mt-2 text-lg text-white">{formatNumber(block.gas_used)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Gas Limit</p>
          <p className="mt-2 text-lg text-white">{formatNumber(block.gas_limit)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">State Root</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="break-all text-xs text-slate-200">{block.state_root ?? '—'}</p>
            {block.state_root ? <CopyButton value={block.state_root} label="Copy" /> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tx Root</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="break-all text-xs text-slate-200">{block.transactions_root ?? '—'}</p>
            {block.transactions_root ? <CopyButton value={block.transactions_root} label="Copy" /> : null}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Receipts Root</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="break-all text-xs text-slate-200">{block.receipts_root ?? '—'}</p>
            {block.receipts_root ? <CopyButton value={block.receipts_root} label="Copy" /> : null}
          </div>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Transactions" description={`Showing page ${page}`} />
        <Table
          rows={transactions}
          emptyMessage="No transactions in this block."
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
            href={`/blocks/${height}?page=${Math.max(1, page - 1)}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Previous
          </Link>
          <span>Page {page}</span>
          <Link
            href={`/blocks/${height}?page=${page + 1}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}
