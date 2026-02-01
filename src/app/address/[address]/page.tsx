import Link from 'next/link';
import { fetchJsonSafe } from '@/lib/api-client';
import { formatNumber, shortenHash } from '@/lib/format';
import SectionHeader from '@/components/SectionHeader';
import Table from '@/components/Table';
import CopyButton from '@/components/CopyButton';

const PAGE_SIZE = 25;

export default async function AddressDetailPage({
  params,
  searchParams,
}: {
  params: { address: string };
  searchParams: { page?: string };
}) {
  const address = params.address;
  const page = Math.max(1, Number(searchParams.page ?? '1'));
  const response = await fetchJsonSafe<{
    address: {
      address: string;
      balance: string;
      nonce: string;
      last_seen_block: string;
    };
    stats: { sent: string; received: string } | null;
    transactions: Array<{
      hash: string;
      from_address: string;
      to_address: string | null;
      value: string;
      status: string;
    }>;
  }>(`/api/address/${address}?page=${page}&limit=${PAGE_SIZE}`, { next: { revalidate: 20 } });

  const overview = response?.address ?? null;
  const stats = response?.stats ?? null;
  const transactions = response?.transactions ?? [];

  if (!overview) {
    return (
      <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
        <SectionHeader title="Address not found" description={shortenHash(address)} />
        <Link
          href="/"
          className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
        >
          Back home
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-8 px-6 py-12">
      <SectionHeader
        title="Address"
        description={shortenHash(address)}
        action={
          <div className="flex items-center gap-3">
            <CopyButton value={address} label="Copy address" />
            <Link
              href="/"
              className="rounded-full border border-slate-700 px-4 py-2 text-xs uppercase tracking-[0.2em] text-slate-200"
            >
              Back
            </Link>
          </div>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Balance</p>
          <p className="mt-2 text-lg text-white">{overview.balance}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Nonce</p>
          <p className="mt-2 text-lg text-white">{formatNumber(overview.nonce)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Last Seen</p>
          <p className="mt-2 text-lg text-white">{formatNumber(overview.last_seen_block)}</p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Txs</p>
          <p className="mt-2 text-lg text-white">
            {stats ? `${stats.sent} sent / ${stats.received} received` : '—'}
          </p>
        </div>
      </div>

      <section className="space-y-4">
        <SectionHeader title="Transactions" description={`Showing page ${page}`} />
        <Table
          rows={transactions}
          emptyMessage="No transactions for this address."
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
              key: 'direction',
              header: 'Direction',
              render: (row) => (row.from_address === address ? 'Out' : 'In'),
            },
            {
              key: 'counterparty',
              header: 'Counterparty',
              render: (row) =>
                row.from_address === address ? (
                  row.to_address ? (
                    <Link href={`/address/${row.to_address}`} className="text-slate-200">
                      {shortenHash(row.to_address)}
                    </Link>
                  ) : (
                    '—'
                  )
                ) : (
                  <Link href={`/address/${row.from_address}`} className="text-slate-200">
                    {shortenHash(row.from_address)}
                  </Link>
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
            href={`/address/${address}?page=${Math.max(1, page - 1)}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Previous
          </Link>
          <span>Page {page}</span>
          <Link
            href={`/address/${address}?page=${page + 1}`}
            className="rounded-full border border-slate-800 px-4 py-2"
          >
            Next
          </Link>
        </div>
      </section>
    </main>
  );
}
