import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { formatNumber, formatTimestampMs, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';

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
  const response = await fetchJsonSafe<{
    block: {
      hash: string;
      height: string;
      parent_hash: string | null;
      producer: string | null;
      timestamp_ms: string;
      gas_limit: string;
      gas_used: string;
      state_root: string | null;
      transactions_root: string | null;
      receipts_root: string | null;
    };
    transactions: Array<{
      hash: string;
      from_address: string;
      to_address: string | null;
      value: string;
      status: string;
    }>;
  }>(`/api/blocks/${height}?page=${page}&limit=${PAGE_SIZE}`, { next: { revalidate: 10 } });

  const block = response?.block ?? null;
  const transactions = response?.transactions ?? [];

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
          <Link
            href="/blocks"
            className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
          >
            Back
          </Link>
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
          <p className="mt-2 break-all text-xs text-slate-200">{block.state_root ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Tx Root</p>
          <p className="mt-2 break-all text-xs text-slate-200">{block.transactions_root ?? '—'}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Receipts Root</p>
          <p className="mt-2 break-all text-xs text-slate-200">{block.receipts_root ?? '—'}</p>
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
